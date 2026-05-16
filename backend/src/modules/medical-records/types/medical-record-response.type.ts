export interface TreatmentPlanItem {
  id?: string;
  drug: string;
  dosage: string;
  frequency: string;
  duration: string;
  route: string;
  notes?: string | null;
}

export interface AttachmentItem {
  id: string;
  filename: string;
  type: string;
  typeLabel: string;
  url: string;
  uploadedAt: string;
}

export interface PetInfo {
  name: string;
  species: string;
  breed: string | null;
  ownerName: string;
  ownerPhone: string;
  knownAllergies: string[] | null;
}

export interface LinkedBooking {
  displayNumber: string;
  serviceType: string;
}

export interface MedicalRecordResponse {
  id: string;
  displayNumber: string;
  pet: PetInfo;
  linkedBooking: LinkedBooking | null;
  visitDate: string;
  weightAtVisit: string | null;
  temperatureCelsius: string | null;
  chiefComplaint: string;
  physicalExamination: string | null;
  diagnosis: string | null;
  diagnosisNotes: string | null;
  treatmentPlan: TreatmentPlanItem[] | null;
  doctorNotes: string | null;
  followupDate: string | null;
  followupNotes: string | null;
  attachments: AttachmentItem[];
  isSharedWithCustomer: boolean;
  requiresAttention: boolean;
  attentionReason: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface MedicalRecordListItem {
  id: string;
  displayNumber: string;
  petId: string;
  pet: {
    name: string;
    species: string;
    ownerName: string;
    ownerPhone: string;
  };
  visitDate: string;
  chiefComplaint: string;
  diagnosis: string | null;
  requiresAttention: boolean;
  attentionReason: string | null;
  isSharedWithCustomer: boolean;
  createdAt: string;
}

export interface MedicalRecordListResponse {
  data: MedicalRecordListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
