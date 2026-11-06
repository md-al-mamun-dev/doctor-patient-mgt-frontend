export interface DoctorMock {
  id: string;
  name: string;
  specialty: string;
  department: string;
  hospital: string;
  email: string;
  phone: string;
  patientCount: number;
  joinedDate: string;
}

export interface PatientMock {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  doctorId: string;
  doctorName: string;
  condition: string;
  status: 'active' | 'recovered' | 'critical';
  admittedDate: string;
}

export const initialDoctors: DoctorMock[] = [
  { id: '669d6d77362041728a698101', name: 'Dr. Sarah Jenkins', specialty: 'Cardiology', department: 'Cardiovascular', hospital: 'General Hospital', email: 'sarah.jenkins@hospital.org', phone: '+1-555-0101', patientCount: 5, joinedDate: '2023-01-15' },
  { id: '669d6d77362041728a698102', name: 'Dr. Michael Chen', specialty: 'Neurology', department: 'Neuroscience', hospital: 'City Medical Center', email: 'michael.chen@citymed.org', phone: '+1-555-0102', patientCount: 5, joinedDate: '2023-03-20' },
  { id: '669d6d77362041728a698103', name: 'Dr. Emily Rodriguez', specialty: 'Pediatrics', department: 'Children Health', hospital: 'Childrens Clinic', email: 'emily.rodriguez@clinic.org', phone: '+1-555-0103', patientCount: 5, joinedDate: '2022-11-10' },
  { id: '669d6d77362041728a698104', name: 'Dr. James Wilson', specialty: 'Orthopedics', department: 'Musculoskeletal', hospital: 'General Hospital', email: 'james.wilson@hospital.org', phone: '+1-555-0104', patientCount: 5, joinedDate: '2023-05-12' },
  { id: '669d6d77362041728a698105', name: 'Dr. Priya Patel', specialty: 'Dermatology', department: 'Dermatological Care', hospital: 'Metro Health', email: 'priya.patel@metrohealth.org', phone: '+1-555-0105', patientCount: 5, joinedDate: '2021-08-01' },
  { id: '669d6d77362041728a698106', name: 'Dr. David Kim', specialty: 'Oncology', department: 'Cancer Center', hospital: 'City Medical Center', email: 'david.kim@citymed.org', phone: '+1-555-0106', patientCount: 5, joinedDate: '2022-04-18' },
  { id: '669d6d77362041728a698107', name: 'Dr. Lisa Thompson', specialty: 'Psychiatry', department: 'Mental Health', hospital: 'Hope Wellness', email: 'lisa.thompson@hope.org', phone: '+1-555-0107', patientCount: 5, joinedDate: '2023-09-01' },
  { id: '669d6d77362041728a698108', name: 'Dr. Robert Martinez', specialty: 'General Surgery', department: 'Surgical Wing', hospital: 'General Hospital', email: 'robert.martinez@hospital.org', phone: '+1-555-0108', patientCount: 5, joinedDate: '2020-10-15' },
  { id: '669d6d77362041728a698109', name: 'Dr. Amanda White', specialty: 'Endocrinology', department: 'Metabolic Health', hospital: 'Metro Health', email: 'amanda.white@metrohealth.org', phone: '+1-555-0109', patientCount: 5, joinedDate: '2022-07-22' },
  { id: '669d6d77362041728a698110', name: 'Dr. Christopher Taylor', specialty: 'Gastroenterology', department: 'Digestive Health', hospital: 'City Medical Center', email: 'chris.taylor@citymed.org', phone: '+1-555-0110', patientCount: 5, joinedDate: '2021-12-05' },
  { id: '669d6d77362041728a698111', name: 'Dr. Maria Garcia', specialty: 'Ophthalmology', department: 'Vision Care', hospital: 'Eye Care Institute', email: 'maria.garcia@eyecare.org', phone: '+1-555-0111', patientCount: 5, joinedDate: '2023-02-28' },
  { id: '669d6d77362041728a698112', name: 'Dr. Daniel Brown', specialty: 'Pulmonology', department: 'Respiratory Clinic', hospital: 'General Hospital', email: 'daniel.brown@hospital.org', phone: '+1-555-0112', patientCount: 5, joinedDate: '2022-09-14' },
];

export const initialPatients: PatientMock[] = [
  { id: '669d6d77362041728a698201', name: 'John Doe', age: 45, gender: 'male', doctorId: '669d6d77362041728a698101', doctorName: 'Dr. Sarah Jenkins', condition: 'Hypertension', status: 'active', admittedDate: '2024-01-10' },
  { id: '669d6d77362041728a698202', name: 'Jane Smith', age: 34, gender: 'female', doctorId: '669d6d77362041728a698101', doctorName: 'Dr. Sarah Jenkins', condition: 'Arrhythmia', status: 'active', admittedDate: '2024-01-12' },
  { id: '669d6d77362041728a698203', name: 'Robert Johnson', age: 58, gender: 'male', doctorId: '669d6d77362041728a698101', doctorName: 'Dr. Sarah Jenkins', condition: 'Coronary Artery Disease', status: 'critical', admittedDate: '2024-02-01' },
  { id: '669d6d77362041728a698204', name: 'Emily Davis', age: 29, gender: 'female', doctorId: '669d6d77362041728a698101', doctorName: 'Dr. Sarah Jenkins', condition: 'Mild Murmur', status: 'recovered', admittedDate: '2024-02-15' },
  { id: '669d6d77362041728a698205', name: 'Michael Brown', age: 62, gender: 'male', doctorId: '669d6d77362041728a698101', doctorName: 'Dr. Sarah Jenkins', condition: 'Heart Failure', status: 'active', admittedDate: '2024-03-01' },
  { id: '669d6d77362041728a698206', name: 'Jessica Taylor', age: 41, gender: 'female', doctorId: '669d6d77362041728a698102', doctorName: 'Dr. Michael Chen', condition: 'Migraine', status: 'active', admittedDate: '2024-01-15' },
  { id: '669d6d77362041728a698207', name: 'William Anderson', age: 53, gender: 'male', doctorId: '669d6d77362041728a698102', doctorName: 'Dr. Michael Chen', condition: 'Neuropathy', status: 'active', admittedDate: '2024-01-22' },
  { id: '669d6d77362041728a698208', name: 'Ashley Thomas', age: 31, gender: 'female', doctorId: '669d6d77362041728a698102', doctorName: 'Dr. Michael Chen', condition: 'Epilepsy', status: 'recovered', admittedDate: '2024-02-05' },
  { id: '669d6d77362041728a698209', name: 'David Jackson', age: 67, gender: 'male', doctorId: '669d6d77362041728a698102', doctorName: 'Dr. Michael Chen', condition: 'Parkinsons', status: 'critical', admittedDate: '2024-02-20' },
  { id: '669d6d77362041728a698210', name: 'Sophia White', age: 24, gender: 'female', doctorId: '669d6d77362041728a698102', doctorName: 'Dr. Michael Chen', condition: 'Vertigo', status: 'active', admittedDate: '2024-03-05' },
];

