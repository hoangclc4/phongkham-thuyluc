export interface UpcomingAppointment {
  id: string;
  displayNumber: string;
  scheduledAt: string;
}

export interface VaccineResponse {
  id: string;
  petId: string;
  vaccineName: string;
  administeredAt: string;
  nextDueAt: string | null;
  batchNumber: string | null;
  notes: string | null;
  createdAt: string;
}

export interface MedicalRecordSummary {
  id: string;
  displayNumber: string;
  visitDate: string;
  chiefComplaint: string;
  diagnosis: string | null;
  createdAt: string;
}

export interface PetResponse {
  id: string;
  customerId: string;
  ownerPhone: string;
  ownerName: string;
  name: string;
  species: string;
  speciesLabel: string;
  breed: string | null;
  gender: string;
  genderLabel: string;
  dateOfBirth: string | null;
  ageDisplay: string | null;
  weightKg: string | null;
  color: string | null;
  avatarUrl: string | null;
  status: string;
  statusLabel: string;
  knownAllergies: string[] | null;
  isNeutered: boolean;
  microchipId: string | null;
  notes: string | null;
  lastVisitDate: string | null;
  upcomingAppointment: UpcomingAppointment | null;
  createdAt: string;
}

export interface PetListResponse {
  data: PetResponse[];
  total: number;
  page: number;
  limit: number;
}
