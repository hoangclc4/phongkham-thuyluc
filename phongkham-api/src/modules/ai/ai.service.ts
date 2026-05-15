import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { Resend } from 'resend';
import { randomUUID } from 'crypto';
import { and, asc, eq, gte, inArray, like, lt } from 'drizzle-orm';
import { Db } from '../../database/database';
import { DB_TOKEN } from '../../database/database.module';
import { aiConversations } from '../../database/schema/ai-conversations.schema';
import { aiContextCache } from '../../database/schema/ai-context-cache.schema';
import { morningReports } from '../../database/schema/morning-reports.schema';
import { customers } from '../../database/schema/customers.schema';
import { pets } from '../../database/schema/pets.schema';
import { medicalRecords } from '../../database/schema/medical-records.schema';
import { vaccines } from '../../database/schema/vaccines.schema';
import { bookings } from '../../database/schema/bookings.schema';
import { ChatDto } from './dto/chat.dto';
import {
  AI_MODELS,
  BOOKING_SERVICE_LABELS,
  INTENT_DETECTION_PROMPT,
  INTENT_VALUES,
  IntentValue,
  MAX_CONVERSATION_MESSAGES,
  MORNING_REPORT_SYSTEM_PROMPT,
  STATIC_GUARDRAILS_PROMPT,
  VN_OFFSET_MS,
} from './constants/ai.constants';
import {
  BookingContextItem,
  ChatResponse,
  ContextDataObject,
  PetContextItem,
} from './types/ai-response.type';

interface ConversationMessage {
  role:    'user' | 'assistant';
  content: string;
}

const CACHE_KEY_PREFIX = 'ctx:';
const CACHE_KEY_SEPARATOR = ':';
const FIRST_MESSAGE_INDEX = 0;
const LAST_3_RECORDS_LIMIT = 3;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class AiService {
  private _anthropic: Anthropic | undefined;
  private get anthropic(): Anthropic {
    if (!this._anthropic) this._anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    return this._anthropic;
  }

  private _resend: Resend | undefined;
  private get resend(): Resend {
    if (!this._resend) this._resend = new Resend(process.env.RESEND_API_KEY);
    return this._resend;
  }

  constructor(@Inject(DB_TOKEN) private readonly db: Db) {}

  private vnIsoDate(date: Date): string {
    const vnMs = date.getTime() + VN_OFFSET_MS;
    const vnDate = new Date(vnMs);
    const year = vnDate.getUTCFullYear();
    const month = String(vnDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(vnDate.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private vnDateKey(date: Date): string {
    return this.vnIsoDate(date).replace(/-/g, '');
  }

  private nextSixAmUtc(now: Date): Date {
    const vnMs = now.getTime() + VN_OFFSET_MS;
    const vnDate = new Date(vnMs);
    const tomorrowVnMidnight = Date.UTC(
      vnDate.getUTCFullYear(),
      vnDate.getUTCMonth(),
      vnDate.getUTCDate() + 1,
    );
    const sixAmVnTomorrow = tomorrowVnMidnight + 6 * 60 * 60 * 1000;
    return new Date(sixAmVnTomorrow - VN_OFFSET_MS);
  }

  private vnDayRange(date: Date): { start: Date; end: Date } {
    const vnMs = date.getTime() + VN_OFFSET_MS;
    const vnDate = new Date(vnMs);
    const vnMidnightUtc = Date.UTC(
      vnDate.getUTCFullYear(),
      vnDate.getUTCMonth(),
      vnDate.getUTCDate(),
    );
    const start = new Date(vnMidnightUtc - VN_OFFSET_MS);
    const end = new Date(start.getTime() + ONE_DAY_MS);
    return { start, end };
  }

  async invalidateCustomerContext(customerId: string): Promise<void> {
    await this.db
      .delete(aiContextCache)
      .where(like(aiContextCache.cacheKey, CACHE_KEY_PREFIX + customerId + CACHE_KEY_SEPARATOR + '%'));
  }

  async invalidateAllContexts(): Promise<void> {
    await this.db.delete(aiContextCache);
  }

  private async getOrBuildContext(customerId: string): Promise<ContextDataObject> {
    const now = new Date();
    const dateKey = this.vnDateKey(now);
    const cacheKey = CACHE_KEY_PREFIX + customerId + CACHE_KEY_SEPARATOR + dateKey;

    const cached = await this.db
      .select()
      .from(aiContextCache)
      .where(and(eq(aiContextCache.cacheKey, cacheKey), gte(aiContextCache.expiresAt, now)));

    if (cached[0]) {
      return cached[0].contextData as ContextDataObject;
    }

    const contextData = await this.buildContextData(customerId);
    const expiresAt = this.nextSixAmUtc(now);

    await this.db
      .insert(aiContextCache)
      .values({ cacheKey, contextData, expiresAt })
      .onConflictDoUpdate({
        target: aiContextCache.cacheKey,
        set: { contextData, expiresAt },
      });

    return contextData;
  }

  private async buildContextData(customerId: string): Promise<ContextDataObject> {
    const customerRows = await this.db
      .select({ fullName: customers.fullName, phone: customers.phone })
      .from(customers)
      .where(eq(customers.id, customerId));

    if (!customerRows[0]) {
      throw new NotFoundException('Không tìm thấy khách hàng');
    }

    const { fullName: customerName, phone: customerPhone } = customerRows[0];

    const petRows = await this.db
      .select({ id: pets.id, name: pets.name, species: pets.species, status: pets.status })
      .from(pets)
      .where(and(eq(pets.customerId, customerId)));

    const now = new Date();
    const sevenDaysLater = new Date(now.getTime() + SEVEN_DAYS_MS);
    const sevenDaysLaterIso = this.vnIsoDate(sevenDaysLater);
    const todayIso = this.vnIsoDate(now);

    const petItems: PetContextItem[] = await Promise.all(
      petRows.map(async (pet) => {
        const recordRows = await this.db
          .select({
            visitDate:      medicalRecords.visitDate,
            chiefComplaint: medicalRecords.chiefComplaint,
            diagnosis:      medicalRecords.diagnosis,
            followupDate:   medicalRecords.followupDate,
          })
          .from(medicalRecords)
          .where(
            and(
              eq(medicalRecords.petId, pet.id),
              eq(medicalRecords.isSharedWithCustomer, true),
            ),
          )
          .orderBy(medicalRecords.visitDate)
          .limit(LAST_3_RECORDS_LIMIT);

        const vaccineRows = await this.db
          .select({ vaccineName: vaccines.vaccineName, nextDueAt: vaccines.nextDueAt })
          .from(vaccines)
          .where(
            and(
              eq(vaccines.petId, pet.id),
              gte(vaccines.nextDueAt, todayIso),
              lt(vaccines.nextDueAt, sevenDaysLaterIso),
            ),
          );

        return {
          name:    pet.name,
          species: pet.species,
          status:  pet.status,
          medicalRecords: recordRows.map((r) => ({
            visitDate:      r.visitDate,
            chiefComplaint: r.chiefComplaint,
            diagnosis:      r.diagnosis ?? null,
            followupDate:   r.followupDate ?? null,
          })),
          upcomingVaccines: vaccineRows
            .filter((v): v is { vaccineName: string; nextDueAt: string } => v.nextDueAt !== null)
            .map((v) => ({ vaccineName: v.vaccineName, nextDueAt: v.nextDueAt })),
        };
      }),
    );

    const bookingRows = await this.db
      .select({
        displayNumber: bookings.displayNumber,
        scheduledAt:   bookings.scheduledAt,
        serviceType:   bookings.serviceType,
        status:        bookings.status,
        petName:       pets.name,
      })
      .from(bookings)
      .innerJoin(pets, eq(pets.id, bookings.petId))
      .where(
        and(
          eq(bookings.customerId, customerId),
          inArray(bookings.status, ['pending', 'confirmed']),
          gte(bookings.scheduledAt, now),
        ),
      )
      .orderBy(asc(bookings.scheduledAt));

    const upcomingBookings: BookingContextItem[] = bookingRows.map((b) => ({
      displayNumber: b.displayNumber,
      scheduledAt:   b.scheduledAt.toISOString(),
      serviceLabel:  BOOKING_SERVICE_LABELS[b.serviceType] ?? b.serviceType,
      status:        b.status,
      petName:       b.petName,
    }));

    return { customerName, customerPhone, pets: petItems, upcomingBookings };
  }

  private buildDynamicSystemPrompt(ctx: ContextDataObject): string {
    const lines: string[] = [
      `THÔNG TIN KHÁCH HÀNG:`,
      `- Tên: ${ctx.customerName}`,
      `- SĐT: ${ctx.customerPhone}`,
      ``,
    ];

    if (ctx.pets.length === 0) {
      lines.push('THÚ CƯNG: Chưa có thú cưng nào trong hệ thống.');
    }

    for (const pet of ctx.pets) {
      lines.push(`THÚ CƯNG: ${pet.name} (${pet.species}) — Trạng thái: ${pet.status}`);

      if (pet.medicalRecords.length === 0) {
        lines.push('  Chưa có hồ sơ bệnh lý được chia sẻ.');
      }

      for (const rec of pet.medicalRecords) {
        lines.push(`  Lần khám ${rec.visitDate}: ${rec.chiefComplaint}`);
        if (rec.diagnosis) lines.push(`    Chẩn đoán: ${rec.diagnosis}`);
        if (rec.followupDate) lines.push(`    Tái khám: ${rec.followupDate}`);
      }

      if (pet.upcomingVaccines.length > 0) {
        lines.push('  Vaccine sắp đến hạn:');
        for (const vac of pet.upcomingVaccines) {
          lines.push(`    - ${vac.vaccineName}: ${vac.nextDueAt}`);
        }
      }

      lines.push('');
    }

    if (ctx.upcomingBookings.length > 0) {
      lines.push('LỊCH KHÁM SẮP TỚI:');
      for (const b of ctx.upcomingBookings) {
        lines.push(`  - ${b.displayNumber}: ${b.petName} — ${b.serviceLabel} lúc ${b.scheduledAt} (${b.status})`);
      }
    }

    return lines.join('\n');
  }

  private async loadOrCreateSession(
    customerId: string,
    sessionId?: string,
  ): Promise<{ sessionId: string; messages: ConversationMessage[] }> {
    if (sessionId) {
      const rows = await this.db
        .select({ sessionId: aiConversations.sessionId, messages: aiConversations.messages })
        .from(aiConversations)
        .where(
          and(
            eq(aiConversations.sessionId, sessionId),
            eq(aiConversations.customerId, customerId),
          ),
        );

      if (rows[0]) {
        return {
          sessionId: rows[0].sessionId,
          messages:  rows[0].messages as ConversationMessage[],
        };
      }
    }

    return { sessionId: randomUUID().replace(/-/g, '').slice(0, 50), messages: [] };
  }

  async detectIntent(message: string): Promise<IntentValue> {
    const response = await this.anthropic.messages.create({
      model:      AI_MODELS.HAIKU,
      max_tokens: 20,
      system:     INTENT_DETECTION_PROMPT,
      messages:   [{ role: 'user', content: message }],
    });

    const firstContent = response.content[FIRST_MESSAGE_INDEX];
    if (firstContent?.type !== 'text') return INTENT_VALUES.GENERAL_CHAT;

    const raw = firstContent.text.trim().toUpperCase();
    const matched = Object.values(INTENT_VALUES).find((v) => v === raw);
    return matched ?? INTENT_VALUES.GENERAL_CHAT;
  }

  async chat(customerId: string, dto: ChatDto): Promise<ChatResponse> {
    const [ctx, session] = await Promise.all([
      this.getOrBuildContext(customerId),
      this.loadOrCreateSession(customerId, dto.sessionId),
    ]);

    const intent = await this.detectIntent(dto.message);

    const model =
      intent === INTENT_VALUES.SIMPLE_INFO || intent === INTENT_VALUES.BOOKING
        ? AI_MODELS.HAIKU
        : AI_MODELS.SONNET;

    const allMessages: ConversationMessage[] = [
      ...session.messages,
      { role: 'user', content: dto.message },
    ];

    const sliced = allMessages.slice(-MAX_CONVERSATION_MESSAGES);

    const firstUserIndex = sliced.findIndex((m) => m.role === 'user');
    const messagesForClaude = firstUserIndex > 0 ? sliced.slice(firstUserIndex) : sliced;

    const response = await this.anthropic.messages.create({
      model,
      max_tokens: 1024,
      system: [
        {
          type:          'text' as const,
          text:          STATIC_GUARDRAILS_PROMPT,
          cache_control: { type: 'ephemeral' as const },
        },
        {
          type: 'text' as const,
          text: this.buildDynamicSystemPrompt(ctx),
        },
      ],
      messages: messagesForClaude,
    });

    const firstContent = response.content[FIRST_MESSAGE_INDEX];
    const replyText = firstContent?.type === 'text' ? firstContent.text : '';

    const updatedMessages: ConversationMessage[] = [
      ...messagesForClaude,
      { role: 'assistant', content: replyText },
    ];

    const tokensInput  = response.usage.input_tokens;
    const tokensOutput = response.usage.output_tokens;

    await this.db
      .insert(aiConversations)
      .values({
        customerId,
        sessionId:       session.sessionId,
        messages:        updatedMessages,
        contextSnapshot: ctx,
        tokensInput,
        tokensOutput,
        modelUsed:       model,
      })
      .onConflictDoUpdate({
        target: aiConversations.sessionId,
        set: {
          messages:        updatedMessages,
          contextSnapshot: ctx,
          tokensInput:     tokensInput,
          tokensOutput:    tokensOutput,
          modelUsed:       model,
          updatedAt:       new Date(),
        },
      });

    return {
      reply:     replyText,
      sessionId: session.sessionId,
      model,
      intent,
    };
  }

  async generateMorningReport(): Promise<void> {
    const now = new Date();
    const todayIsoDate = this.vnIsoDate(now);

    const existingReport = await this.db
      .select({ id: morningReports.id })
      .from(morningReports)
      .where(eq(morningReports.reportDate, todayIsoDate));

    if (existingReport[0]) return;

    const { start: dayStart, end: dayEnd } = this.vnDayRange(now);
    const sevenDaysLater = new Date(now.getTime() + SEVEN_DAYS_MS);
    const sevenDaysLaterIso = this.vnIsoDate(sevenDaysLater);

    const [todayBookings, attentionRecords, inTreatmentPets, dueSoonVaccines, followupToday] =
      await Promise.all([
        this.db
          .select({
            displayNumber:  bookings.displayNumber,
            scheduledAt:    bookings.scheduledAt,
            serviceType:    bookings.serviceType,
            petName:        pets.name,
            customerName:   customers.fullName,
          })
          .from(bookings)
          .innerJoin(pets, eq(pets.id, bookings.petId))
          .innerJoin(customers, eq(customers.id, bookings.customerId))
          .where(
            and(
              gte(bookings.scheduledAt, dayStart),
              lt(bookings.scheduledAt, dayEnd),
              inArray(bookings.status, ['pending', 'confirmed', 'checked_in']),
            ),
          )
          .orderBy(asc(bookings.scheduledAt)),

        this.db
          .select({
            displayNumber:  medicalRecords.displayNumber,
            attentionReason: medicalRecords.attentionReason,
            petName:        pets.name,
          })
          .from(medicalRecords)
          .innerJoin(pets, eq(pets.id, medicalRecords.petId))
          .where(eq(medicalRecords.requiresAttention, true)),

        this.db
          .select({ petName: pets.name, customerName: customers.fullName })
          .from(pets)
          .innerJoin(customers, eq(customers.id, pets.customerId))
          .where(eq(pets.status, 'in_treatment')),

        this.db
          .select({ vaccineName: vaccines.vaccineName, nextDueAt: vaccines.nextDueAt, petName: pets.name })
          .from(vaccines)
          .innerJoin(pets, eq(pets.id, vaccines.petId))
          .where(
            and(
              gte(vaccines.nextDueAt, todayIsoDate),
              lt(vaccines.nextDueAt, sevenDaysLaterIso),
            ),
          ),

        this.db
          .select({
            displayNumber: medicalRecords.displayNumber,
            petName:       pets.name,
            customerName:  customers.fullName,
          })
          .from(medicalRecords)
          .innerJoin(pets, eq(pets.id, medicalRecords.petId))
          .innerJoin(customers, eq(customers.id, pets.customerId))
          .where(eq(medicalRecords.followupDate, todayIsoDate)),
      ]);

    const formatVnTime = (utcDate: Date): string => {
      const vnMs = utcDate.getTime() + VN_OFFSET_MS;
      const d = new Date(vnMs);
      return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
    };

    const dataPrompt = [
      `Ngày báo cáo: ${todayIsoDate}`,
      ``,
      `THÚ CƯNG ĐANG ĐIỀU TRỊ (${inTreatmentPets.length} con):`,
      ...inTreatmentPets.map((p) => `- ${p.petName} (chủ: ${p.customerName})`),
      ``,
      `LỊCH HÔM NAY (${todayBookings.length} lịch):`,
      ...todayBookings.map(
        (b) =>
          `- ${formatVnTime(b.scheduledAt)} | ${b.displayNumber} | ${b.petName} | ${BOOKING_SERVICE_LABELS[b.serviceType] ?? b.serviceType} | chủ: ${b.customerName}`,
      ),
      ``,
      `CẦN CHÚ Ý (${attentionRecords.length} hồ sơ):`,
      ...attentionRecords.map((r) => `- ${r.displayNumber} | ${r.petName} | ${r.attentionReason ?? ''}`),
      ``,
      `VACCINE SẮP HẾT HẠN TRONG 7 NGÀY (${dueSoonVaccines.length}):`,
      ...dueSoonVaccines.map((v) => `- ${v.petName} | ${v.vaccineName} | hạn: ${v.nextDueAt ?? ''}`),
      ``,
      `CẦN TÁI KHÁM HÔM NAY (${followupToday.length}):`,
      ...followupToday.map((f) => `- ${f.displayNumber} | ${f.petName} | chủ: ${f.customerName}`),
    ].join('\n');

    const response = await this.anthropic.messages.create({
      model:      AI_MODELS.SONNET,
      max_tokens: 2048,
      system:     MORNING_REPORT_SYSTEM_PROMPT,
      messages:   [{ role: 'user', content: dataPrompt }],
    });

    const firstContent = response.content[FIRST_MESSAGE_INDEX];
    const reportContent = firstContent?.type === 'text' ? firstContent.text : dataPrompt;
    const tokensUsed = response.usage.input_tokens + response.usage.output_tokens;

    await this.db.insert(morningReports).values({
      reportDate:  todayIsoDate,
      content:     reportContent,
      tokensUsed,
    });

    await this.invalidateAllContexts();

    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) return;

    await this.resend.emails.send({
      from:    'Phòng Khám Thú Y Bác Sĩ Lục <noreply@phongkhamthuyluc.com>',
      to:      adminEmail,
      subject: `Báo cáo buổi sáng ${todayIsoDate} — Phòng Khám Thú Y Bác Sĩ Lục`,
      text:    reportContent,
    }).catch(() => {});
  }
}
