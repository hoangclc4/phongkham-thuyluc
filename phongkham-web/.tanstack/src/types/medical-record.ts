export interface TreatmentItem {
  id: string;
  drug: string;
  dosage: string;
  frequency: string;
  duration: string;
  route: string;
  notes: string | null;
}

export interface Attachment {
  id: string;
  filename: string;
  type: string;
  typeLabel: string;
  url: string;
  uploadedAt: string;
}

export interface MedicalRecordPet {
  name: string;
  species: string;
  breed: string | null;
  ownerName: string;
  ownerPhone: string;
  knownAllergies: string[];
}

export interface LinkedBooking {
  displayNumber: string;
  serviceType: string;
}

export interface MedicalRecord {
  id: string;
  displayNumber: string;
  petId: string;
  pet: MedicalRecordPet;
  linkedBooking: LinkedBooking | null;
  visitDate: string;
  weightAtVisit: number | null;
  temperatureCelsius: number | null;
  chiefComplaint: string;
  physicalExamination: string | null;
  diagnosis: string;
  diagnosisNotes: string | null;
  treatmentPlan: TreatmentItem[];
  doctorNotes: string | null;
  followupDate: string | null;
  followupNotes: string | null;
  attachments: Attachment[];
  isSharedWithCustomer: boolean;
  requiresAttention: boolean;
  attentionReason: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface MedicalRecordListParams {
  petId?: string;
  requiresAttention?: boolean;
  page?: number;
  limit?: number;
}

export interface CreateMedicalRecordDto {
  petId: string;
  bookingId?: string;
  visitDate: string;
  weightAtVisit?: number;
  temperatureCelsius?: number;
  chiefComplaint: string;
  physicalExamination?: string;
  diagnosis: string;
  diagnosisNotes?: string;
  treatmentPlan?: Omit<TreatmentItem, 'id'>[];
  doctorNotes?: string;
  followupDate?: string;
  followupNotes?: string;
  isSharedWithCustomer?: boolean;
  requiresAttention?: boolean;
  attentionReason?: string;
}
