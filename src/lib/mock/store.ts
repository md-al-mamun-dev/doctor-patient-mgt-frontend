import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Doctor, Patient, Hospital, Specialization, PatientStatus, DashboardStats, DoctorFormData, PatientFormData } from '@/types';
import { INITIAL_DOCTORS, INITIAL_PATIENTS, INITIAL_HOSPITALS, INITIAL_SPECIALIZATIONS } from './seed';

interface MockStoreState {
  doctors: Doctor[];
  patients: Patient[];
  hospitals: Hospital[];
  specializations: Specialization[];

  // Actions
  addHospital: (name: string) => Hospital;
  addSpecialization: (name: string) => Specialization;
  addDoctor: (data: DoctorFormData) => Doctor;
  updateDoctor: (id: string, data: Partial<DoctorFormData>) => Doctor | null;
  addPatient: (data: PatientFormData) => Patient;
  updatePatient: (id: string, data: Partial<PatientFormData>) => Patient | null;
  deletePatient: (id: string) => boolean;
  reassignPatient: (patientId: string, newDoctorId: string) => boolean;
  resetStore: () => void;
}

const safeStorage = {
  getItem: (name: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      // Purge legacy v1 and v2 stores if present
      window.localStorage.removeItem('doctor-tracker-mock-store-v1');
      window.localStorage.removeItem('doctor-tracker-mock-store-v2');
      const item = window.localStorage.getItem(name);
      if (item) {
        // If stored data contains legacy 'doc-' slugs, purge it immediately
        if (item.includes('"id":"doc-') || item.includes('"doctorId":"doc-')) {
          window.localStorage.removeItem(name);
          return null;
        }
      }
      return item;
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(name, value);
    } catch {
      // ignore
    }
  },
  removeItem: (name: string): void => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(name);
    } catch {
      // ignore
    }
  },
};

/** Generates a valid 24-character hexadecimal MongoDB ObjectId string */
function generateObjectId(): string {
  const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
  const randomHex = Array.from({ length: 16 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  return (timestamp + randomHex).toLowerCase();
}

export const useMockStore = create<MockStoreState>()(
  persist(
    (set, get) => ({
      doctors: INITIAL_DOCTORS,
      patients: INITIAL_PATIENTS,
      hospitals: INITIAL_HOSPITALS,
      specializations: INITIAL_SPECIALIZATIONS,

      addHospital: (name: string) => {
        const trimmed = name.trim();
        const existing = get().hospitals.find((h) => h.name.toLowerCase() === trimmed.toLowerCase());
        if (existing) return existing;
        const newHospital: Hospital = {
          id: `hosp-${Date.now()}`,
          name: trimmed,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ hospitals: [...state.hospitals, newHospital] }));
        return newHospital;
      },

      addSpecialization: (name: string) => {
        const trimmed = name.trim();
        const existing = get().specializations.find((s) => s.name.toLowerCase() === trimmed.toLowerCase());
        if (existing) return existing;
        const newSpecialization: Specialization = {
          id: `spec-${Date.now()}`,
          name: trimmed,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ specializations: [...state.specializations, newSpecialization] }));
        return newSpecialization;
      },

      addDoctor: (data: DoctorFormData) => {
        const newId = generateObjectId();
        const hospitalName = data.hospital || data.department || 'Square Hospital';
        const existingHosp = get().hospitals.find((h) => h.name.toLowerCase() === hospitalName.toLowerCase());
        if (!existingHosp) {
          get().addHospital(hospitalName);
        }
        const newDoctor: Doctor = {
          id: newId,
          name: data.name,
          specialty: data.specialty,
          hospital: hospitalName,
          department: data.department || hospitalName,
          email: data.email,
          phone: data.phone,
          status: data.status || 'Active',
          patientsCount: 0,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          doctors: [newDoctor, ...state.doctors],
        }));

        return newDoctor;
      },

      updateDoctor: (id: string, data: Partial<DoctorFormData>) => {
        let updated: Doctor | null = null;

        set((state) => {
          const index = state.doctors.findIndex((d) => d.id === id);
          if (index === -1) return state;

          const current = state.doctors[index];
          const updatedDoctor: Doctor = { ...current, ...data };
          updated = updatedDoctor;
          const nextDoctors = [...state.doctors];
          nextDoctors[index] = updatedDoctor;

          let nextPatients = state.patients;
          if (data.name && data.name !== current.name) {
            nextPatients = state.patients.map((p) =>
              p.doctorId === id ? { ...p, doctorName: data.name! } : p
            );
          }

          return { doctors: nextDoctors, patients: nextPatients };
        });

        return updated;
      },

      addPatient: (data: PatientFormData) => {
        const assignedDoctor = get().doctors.find((d) => d.id === data.doctorId);
        const doctorName = assignedDoctor ? assignedDoctor.name : 'Unknown Doctor';

        const conditionLower = (data.condition || '').toLowerCase();
        let derivedStatus: PatientStatus = data.status || 'Active';
        if (!data.status) {
          if (conditionLower === 'critical') derivedStatus = 'Critical';
          else if (conditionLower === 'recovering' || conditionLower === 'discharged' || conditionLower === 'recovered') derivedStatus = 'Recovered';
        }

        const dateVal = data.admissionDate || data.admitted || new Date().toISOString().split('T')[0];

        const newPatient: Patient = {
          id: generateObjectId(),
          name: data.name,
          age: data.age,
          gender: data.gender,
          doctorId: data.doctorId,
          doctorName,
          condition: data.condition,
          status: derivedStatus,
          admitted: dateVal,
          admissionDate: dateVal,
          phone: data.phone,
          email: data.email,
          diagnosis: data.diagnosis,
          notes: data.notes,
          address: data.address,
          emergencyContact: data.emergencyContact,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          patients: [newPatient, ...state.patients],
        }));

        return newPatient;
      },

      updatePatient: (id: string, data: Partial<PatientFormData>) => {
        let updated: Patient | null = null;

        set((state) => {
          const index = state.patients.findIndex((p) => p.id === id);
          if (index === -1) return state;

          const current = state.patients[index];
          let doctorName = current.doctorName;

          if (data.doctorId && data.doctorId !== current.doctorId) {
            const doc = state.doctors.find((d) => d.id === data.doctorId);
            doctorName = doc ? doc.name : current.doctorName;
          }

          let derivedStatus = data.status || current.status;
          if (!data.status && data.condition) {
            const conditionLower = data.condition.toLowerCase();
            if (conditionLower === 'critical') derivedStatus = 'Critical';
            else if (conditionLower === 'recovering' || conditionLower === 'discharged' || conditionLower === 'recovered') derivedStatus = 'Recovered';
          }

          const dateVal = data.admissionDate || data.admitted || current.admitted;

          const updatedPat: Patient = {
            ...current,
            ...data,
            status: derivedStatus,
            admitted: dateVal,
            admissionDate: dateVal,
            doctorName,
          };
          updated = updatedPat;

          const nextPatients = [...state.patients];
          nextPatients[index] = updatedPat;

          return { patients: nextPatients };
        });

        return updated;
      },

      deletePatient: (id: string) => {
        let existed = false;
        set((state) => {
          const exists = state.patients.some((p) => p.id === id);
          if (!exists) return state;
          existed = true;
          return {
            patients: state.patients.filter((p) => p.id !== id),
          };
        });
        return existed;
      },

      reassignPatient: (patientId: string, newDoctorId: string) => {
        const doc = get().doctors.find((d) => d.id === newDoctorId);
        if (!doc) return false;

        let success = false;
        set((state) => {
          const pIndex = state.patients.findIndex((p) => p.id === patientId);
          if (pIndex === -1) return state;

          success = true;
          const nextPatients = [...state.patients];
          nextPatients[pIndex] = {
            ...nextPatients[pIndex],
            doctorId: newDoctorId,
            doctorName: doc.name,
          };

          return { patients: nextPatients };
        });

        return success;
      },

      resetStore: () => {
        set({
          doctors: INITIAL_DOCTORS,
          patients: INITIAL_PATIENTS,
          hospitals: INITIAL_HOSPITALS,
          specializations: INITIAL_SPECIALIZATIONS,
        });
      },
    }),
    {
      name: 'doctor-tracker-mock-store-v3',
      storage: createJSONStorage(() => safeStorage),
    }
  )
);

// Derived Selectors
export function selectDoctorPatientCount(state: MockStoreState, doctorId: string): number {
  return state.patients.filter((p) => p.doctorId === doctorId).length;
}

export function classifyPatientCondition(
  p: Patient
): 'Critical' | 'Under observation' | 'Recovering' | 'Stable' | 'Discharged' {
  const condLower = (p.condition || '').toLowerCase();
  const statusLower = (p.status || '').toLowerCase();

  if (statusLower === 'critical' || condLower.includes('critical')) {
    return 'Critical';
  }
  if (statusLower === 'recovered' || condLower.includes('discharg')) {
    return 'Discharged';
  }
  if (
    condLower.includes('observ') ||
    condLower.includes('severe') ||
    condLower.includes('heart') ||
    condLower.includes('arrhythmia') ||
    condLower.includes('migraine')
  ) {
    return 'Under observation';
  }
  if (
    condLower.includes('recov') ||
    condLower.includes('neoplasm') ||
    condLower.includes('ligament') ||
    condLower.includes('neuro')
  ) {
    return 'Recovering';
  }
  return 'Stable';
}

export function computeDashboardStats(doctors: Doctor[], patients: Patient[]): DashboardStats {
  const totalDoctors = doctors.length;
  const activeDoctors = doctors.filter((d) => d.status === 'Active').length;
  const totalPatients = patients.length;
  const activePatients = patients.filter((p) => p.status === 'Active').length;
  const criticalPatients = patients.filter((p) => classifyPatientCondition(p) === 'Critical').length;
  const recoveredPatients = patients.filter((p) => p.status === 'Recovered').length;
  const dischargedPatients = patients.filter((p) => classifyPatientCondition(p) === 'Discharged').length;

  const hospitalsCount = new Set(doctors.map((d) => d.hospital || d.department)).size || 8;

  // Doctor Caseloads & Top Doctors
  const doctorCaseloadMap = new Map<string, number>();
  patients.forEach((p) => {
    doctorCaseloadMap.set(p.doctorId, (doctorCaseloadMap.get(p.doctorId) || 0) + 1);
  });

  const doctorCounts = doctors.map((d) => ({
    doctorId: d.id,
    name: d.name,
    specialization: d.specialty,
    count: doctorCaseloadMap.get(d.id) || 0,
  }));

  doctorCounts.sort((a, b) => b.count - a.count);
  const highestCaseload = doctorCounts.length > 0 ? doctorCounts[0].count : 0;

  const topDoctors = doctorCounts.slice(0, 10).map((d) => ({
    ...d,
    percentage: highestCaseload > 0 ? Math.round((d.count / highestCaseload) * 1000) / 10 : 0,
  }));

  const avgPatientsPerDoctor =
    totalDoctors > 0 ? Math.round((totalPatients / totalDoctors) * 10) / 10 : 0;

  // Specialty Breakdown & Specializations Table
  const specialtyMap = new Map<string, { doctorCount: number; patientCount: number }>();
  doctors.forEach((d) => {
    const existing = specialtyMap.get(d.specialty) || { doctorCount: 0, patientCount: 0 };
    existing.doctorCount += 1;
    specialtyMap.set(d.specialty, existing);
  });

  patients.forEach((p) => {
    const doctor = doctors.find((d) => d.id === p.doctorId);
    if (doctor) {
      const existing = specialtyMap.get(doctor.specialty) || { doctorCount: 0, patientCount: 0 };
      existing.patientCount += 1;
      specialtyMap.set(doctor.specialty, existing);
    }
  });

  const specialtyBreakdown = Array.from(specialtyMap.entries()).map(([specialty, counts]) => ({
    specialty,
    ...counts,
  }));

  const maxSpecPatients = Math.max(
    1,
    ...Array.from(specialtyMap.values()).map((s) => s.patientCount)
  );

  const specializationTable = Array.from(specialtyMap.entries())
    .map(([specialization, counts]) => ({
      specialization,
      doctors: counts.doctorCount,
      patients: counts.patientCount,
      perDoctor: counts.doctorCount > 0 ? (counts.patientCount / counts.doctorCount).toFixed(1) : '0.0',
      percentage: Math.round((counts.patientCount / maxSpecPatients) * 1000) / 10,
    }))
    .sort((a, b) => b.patients - a.patients);

  // Condition Breakdown (5 Canonical Tiers)
  const conditionCategoryMap: Record<string, number> = {
    Critical: 0,
    'Under observation': 0,
    Recovering: 0,
    Stable: 0,
    Discharged: 0,
  };

  patients.forEach((p) => {
    const cat = classifyPatientCondition(p);
    conditionCategoryMap[cat] = (conditionCategoryMap[cat] || 0) + 1;
  });

  const conditionConfigs = [
    { name: 'Critical', key: 'critical', color: '#F43F5E', bgClass: 'bg-rose-500' },
    { name: 'Under observation', key: 'under_observation', color: '#FBBF24', bgClass: 'bg-amber-400' },
    { name: 'Recovering', key: 'recovering', color: '#0EA5E9', bgClass: 'bg-sky-500' },
    { name: 'Stable', key: 'stable', color: '#10B981', bgClass: 'bg-emerald-500' },
    { name: 'Discharged', key: 'discharged', color: '#CBD5E1', bgClass: 'bg-slate-300' },
  ];

  const conditionBreakdown = conditionConfigs.map((cfg) => {
    const count = conditionCategoryMap[cfg.name] || 0;
    const percentage = totalPatients > 0 ? Math.round((count / totalPatients) * 1000) / 10 : 0;
    return {
      condition: cfg.name,
      key: cfg.key,
      count,
      percentage,
      color: cfg.color,
      bgClass: cfg.bgClass,
    };
  });

  // Admissions Trend
  const dateMap = new Map<string, number>();
  patients.forEach((p) => {
    const date = p.admitted;
    dateMap.set(date, (dateMap.get(date) || 0) + 1);
  });

  const admissionsTrend = Array.from(dateMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const newPatients = patients.length;
  const newPatientsPrevPeriod = Math.max(1, Math.round(newPatients * 0.89));
  const changePct = 12.3;

  return {
    totalDoctors,
    activeDoctors,
    totalPatients,
    activePatients,
    criticalPatients,
    recoveredPatients,
    dischargedPatients,
    hospitalsCount,
    highestCaseload,
    avgPatientsPerDoctor,
    newPatients,
    newPatientsPrevPeriod,
    changePct,
    specialtyBreakdown,
    specializationTable,
    conditionBreakdown,
    topDoctors,
    admissionsTrend,
  };
}
