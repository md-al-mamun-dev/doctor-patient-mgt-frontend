/** Resource shapes matching the canonical REST API specification. */

export type Condition = 'stable' | 'under_observation' | 'critical' | 'recovering' | 'discharged';
export type Gender = 'male' | 'female' | 'other';
export type UserRole = 'admin' | 'staff';
export type UserStatus = 'active' | 'disabled';

export type Doctor = {
  id: string;
  name: string;
  specialization: string;
  hospital: string;
  phone: string;
  email: string;
  patientCount: number;
  createdAt: string;
  updatedAt: string;
  version: number;
};

export type DoctorInput = Pick<Doctor, 'name' | 'specialization' | 'hospital' | 'phone' | 'email'>;

export type DoctorListParams = {
  q?: string;
  specialization?: string[];
  hospital?: string[];
  from?: string;
  to?: string;
  sort?: '-createdAt' | 'createdAt' | 'name' | '-name' | '-patientCount';
  page?: number;
  limit?: number;
};

export type Hospital = {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
};

export type HospitalInput = {
  name: string;
};

export type Specialization = {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
};

export type SpecializationInput = {
  name: string;
};

export type Patient = {
  id: string;
  name: string;
  age: number;
  gender: Gender;
  phone: string;
  email?: string;
  condition: Condition;
  diagnosis?: string;
  admissionDate: string; // YYYY-MM-DD
  notes?: string; // single-patient responses only
  doctor?: { id: string; name: string };
  doctorId?: string;
  doctorName?: string;
  createdAt: string;
  updatedAt: string;
  version: number;
};

export type PatientListItem = Omit<Patient, 'notes'>;

export type PatientInput = Pick<
  Patient,
  'name' | 'age' | 'gender' | 'phone' | 'email' | 'condition' | 'diagnosis' | 'admissionDate' | 'notes'
>;

export type PatientListParams = {
  q?: string;
  condition?: Condition[];
  gender?: Gender;
  doctorId?: string;
  from?: string;
  to?: string;
  sort?: '-admissionDate' | 'admissionDate' | 'name';
  page?: number;
  limit?: number;
};

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  mustChangePassword: boolean;
  lastLoginAt?: string;
  lockedUntil?: string;
  createdAt: string;
  updatedAt: string;
  version: number;
};

export type UserInput = Pick<User, 'name' | 'email' | 'role'> & {
  temporaryPassword?: string;
};

export type UserListParams = {
  q?: string;
  role?: UserRole;
  status?: UserStatus;
  sort?: '-createdAt' | 'createdAt' | 'name' | '-name';
  page?: number;
  limit?: number;
};

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  mustChangePassword: boolean;
  session?: {
    expiresAt: string;
  };
};

export type DashboardSummary = {
  range: { from: string; to: string };
  previousRange: { from: string; to: string };
  totalDoctors: number;
  totalPatients: number;
  newPatients: number;
  newPatientsPrevPeriod: number;
  changePct?: number;
  avgPatientsPerDoctor: number;
  criticalPatients: number;
  dischargedPatients: number;
};

export type DashboardAdmissions = {
  interval: 'day' | 'week' | 'month';
  current: Array<{ date: string; count: number }>;
  previous: Array<{ date: string; count: number }>;
};

export type DoctorCaseload = {
  doctorId: string;
  name: string;
  specialization: string;
  count: number;
};

export type DashboardBreakdown = {
  byCondition: Array<{ condition: Condition; count: number }>;
  bySpecialization: Array<{ specialization: string; doctors: number; patients: number }>;
};

export type AuditLog = {
  id: string;
  at: string;
  actor: { id: string; name: string };
  action: string;
  entityType: string;
  entityId: string;
  fields: string[];
  ip: string;
};

export type AuditListParams = {
  actorId?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
};

