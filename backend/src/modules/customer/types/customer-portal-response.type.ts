export interface CustomerProfileResponse {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  address: string | null;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface CustomerPetResponse {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  gender: string;
  dateOfBirth: string | null;
  color: string | null;
  weightKg: string | null;
  avatarUrl: string | null;
  status: string;
  knownAllergies: string[] | null;
  microchipId: string | null;
  notes: string | null;
  isNeutered: boolean | null;
  createdAt: string;
}

export interface CustomerMedicalRecordResponse {
  id: string;
  displayNumber: string;
  visitDate: string;
  weightAtVisit: string | null;
  temperatureCelsius: string | null;
  chiefComplaint: string;
  diagnosis: string | null;
  diagnosisNotes: string | null;
  treatmentPlan: unknown;
  followupDate: string | null;
  followupNotes: string | null;
  attachments: unknown;
  createdAt: string;
}

export interface CustomerVaccineResponse {
  id: string;
  vaccineName: string;
  administeredAt: string;
  nextDueAt: string | null;
  batchNumber: string | null;
  notes: string | null;
}

export interface CustomerBookingResponse {
  id: string;
  displayNumber: string;
  petId: string;
  petName: string;
  petSpecies: string;
  serviceType: string;
  serviceLabel: string;
  scheduledAt: string;
  durationMinutes: number;
  status: string;
  statusLabel: string;
  notes: string | null;
  cancelledAt: string | null;
  cancelledReason: string | null;
  createdAt: string;
}
