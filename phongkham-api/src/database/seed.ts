import 'reflect-metadata';
import { db } from './database';
import { adminUsers, serviceCatalog } from './schema';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('Seeding database...');

  const passwordHash = await bcrypt.hash(process.env.ADMIN_SEED_PASSWORD ?? 'change-me-immediately', 12);

  await db.insert(adminUsers).values({
    email:        'bacsiluc@phongkhamthuyluc.com',
    passwordHash,
    fullName:     'Bác Sĩ Lục',
  }).onConflictDoNothing();

  await db.insert(serviceCatalog).values([
    { name: 'Khám tổng quát',  category: 'general_checkup', defaultPrice: 150000,  durationMin: 30,  sortOrder: 1 },
    { name: 'Tái khám',        category: 'followup',        defaultPrice: 100000,  durationMin: 20,  sortOrder: 2 },
    { name: 'Tiêm vaccine',    category: 'vaccination',     defaultPrice: 200000,  durationMin: 15,  sortOrder: 3 },
    { name: 'Phẫu thuật',      category: 'surgery',         defaultPrice: 2000000, durationMin: 120, sortOrder: 4 },
    { name: 'Grooming',        category: 'grooming',        defaultPrice: 250000,  durationMin: 60,  sortOrder: 5 },
    { name: 'Xét nghiệm',     category: 'laboratory',      defaultPrice: 300000,  durationMin: 30,  sortOrder: 6 },
    { name: 'Nha khoa',        category: 'dental',          defaultPrice: 500000,  durationMin: 45,  sortOrder: 7 },
    { name: 'Cấp cứu',        category: 'emergency',       defaultPrice: 500000,  durationMin: 60,  sortOrder: 8 },
    { name: 'Dịch vụ khác',   category: 'other',           defaultPrice: 100000,  durationMin: 30,  sortOrder: 9 },
  ]).onConflictDoNothing();

  console.log('Seed complete.');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
