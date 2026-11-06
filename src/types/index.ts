export type DoctorStatus = 'Active' | 'Inactive';

export interface Hospital {
  id: string;
  name: string;
  createdAt?: string;
}

export interface Specialization {
  id: string;
  name: string;
  createdAt?: string;
}

export interface SpecializationInput {
  name: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  hospital: string;
  department?: string;
  email: string;
  phone: string;
  status: DoctorStatus;
  patientCount?: number;
  patientsCount?: number;
  createdAt?: string;
}

export type PatientGender = 'male' | 'female' | 'other';
export type PatientStatus = 'Active' | 'Critical' | 'Recovered';

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: PatientGender;
  doctorId: string;
  doctorName: string;
  condition: string;
  status: PatientStatus;
  admitted: string; // YYYY-MM-DD or formatted date string
  admissionDate?: string;
  phone?: string;
  email?: string;
  diagnosis?: string;
  notes?: string;
  address?: string;
  emergencyContact?: string;
  createdAt?: string;
}

export interface DashboardStats {
  totalDoctors: number;
  activeDoctors: number;
  totalPatients: number;
  activePatients: number;
  criticalPatients: number;
  recoveredPatients: number;
  dischargedPatients: number;
  hospitalsCount: number;
  highestCaseload: number;
  avgPatientsPerDoctor: number;
  newPatients: number;
  newPatientsPrevPeriod: number;
  changePct: number;
  specialtyBreakdown: Array<{
    specialty: string;
    doctorCount: number;
    patientCount: number;
  }>;
  specializationTable: Array<{
    specialization: string;
    doctors: number;
    patients: number;
    perDoctor: string;
    percentage: number;
  }>;
  conditionBreakdown: Array<{
    condition: string;
    key: string;
    count: number;
    percentage: number;
    color: string;
    bgClass: string;
  }>;
  topDoctors: Array<{
    doctorId: string;
    name: string;
    specialization: string;
    count: number;
    percentage: number;
  }>;
  admissionsTrend: Array<{
    date: string;
    count: number;
  }>;
}

export interface DoctorFilterParams {
  search?: string;
  specialty?: string;
  hospital?: string;
  department?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export interface PatientFilterParams {
  search?: string;
  status?: string;
  doctorId?: string;
  condition?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export type { DoctorFormData, PatientFormData, LoginFormData } from '@/lib/validation/schemas';

