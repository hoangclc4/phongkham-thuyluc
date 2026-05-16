export interface ChatResponse {
  reply:     string;
  sessionId: string;
  model:     string;
  intent:    string;
}

export interface PetContextItem {
  name:    string;
  species: string;
  status:  string;
  medicalRecords: {
    visitDate:      string;
    chiefComplaint: string;
    diagnosis:      string | null;
    followupDate:   string | null;
  }[];
  upcomingVaccines: {
    vaccineName: string;
    nextDueAt:   string;
  }[];
}

export interface BookingContextItem {
  displayNumber: string;
  scheduledAt:   string;
  serviceLabel:  string;
  status:        string;
  petName:       string;
}

export interface ContextDataObject {
  customerName:     string;
  customerPhone:    string;
  pets:             PetContextItem[];
  upcomingBookings: BookingContextItem[];
}
