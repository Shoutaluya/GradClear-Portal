export type Stage = 'Faculty' | 'Bursary' | 'Library' | 'Clinic' | 'DSC';
export type StageStatus = 'pending' | 'halted' | 'halted_resolved' | 'awaiting_review' | 'approved' | 'completed';

export const REQUIRED_DOCUMENTS: Record<Stage, string[]> = {
  Faculty: [
    "BIO-DATA FORM",
    "JAMB UTME RESULT SLIP",
    "O'LEVEL RESULTS",
    "JAMB LETTER OF ADMISSION",
    "AUI NOTIFICATION OF PROVISIONAL ADMISSION",
    "BIRTH CERTIFICATE/DECLARATION OF AGE",
    "COURSE REGISTRATION FORM: 100, 200, 300, 400",
    "SIGNED MATRICULATION OATH FORM"
  ],
  Bursary: [
    "BURSARY PAYMENT CLEARANCE"
  ],
  Library: [
    "LIBRARY CLEARANCE FORM"
  ],
  Clinic: [
    "CLINIC CLEARANCE FORM"
  ],
  DSC: [
    "REFERENCE LETTER FROM SEC. SCHOOL",
    "REFERENCE LETTER FROM PRIEST/PASTOR/IMAM",
    "ICT STUDENT BIO-DATA PRINTOUT"
  ]
};

export interface ClearancePipeline {
  studentId: string;
  currentStage: Stage;
  stageStatus: StageStatus;
  haltReason: string | null;
  resolvingDocumentUrl: string | null;
  uploadedDocuments?: Record<string, string>;
  approvals: {
    faculty: boolean;
    bursary: boolean;
    library: boolean;
    clinic: boolean;
    dsc: boolean;
  };
  isFullyCleared: boolean;
}

export type Role = 'student' | 'faculty_admin' | 'bursary_admin' | 'library_admin' | 'clinic_admin' | 'dsc_admin' | 'central_admin';

export interface UserCustomClaims {
  role?: Role;
  matric?: string;
}

export interface AppNotification {
  id?: string;
  studentId: string;
  title: string;
  message: string;
  type: 'status_update' | 'action_required' | 'info';
  read: boolean;
  createdAt: number;
}
