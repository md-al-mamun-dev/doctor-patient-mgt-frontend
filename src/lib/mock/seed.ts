import { Doctor, Patient, Hospital, Specialization } from '@/types';

export const INITIAL_SPECIALIZATIONS: Specialization[] = [
  { id: 'spec-1', name: 'Cardiology' },
  { id: 'spec-2', name: 'Neurology' },
  { id: 'spec-3', name: 'Pediatrics' },
  { id: 'spec-4', name: 'Orthopedics' },
  { id: 'spec-5', name: 'Dermatology' },
  { id: 'spec-6', name: 'Oncology' },
  { id: 'spec-7', name: 'General Medicine' },
  { id: 'spec-8', name: 'Obstetrics & Gynecology' },
  { id: 'spec-9', name: 'Gastroenterology' },
  { id: 'spec-10', name: 'Ophthalmology' },
  { id: 'spec-11', name: 'Pulmonology' },
  { id: 'spec-12', name: 'Otolaryngology (ENT)' },
  { id: 'spec-13', name: 'Nephrology' },
  { id: 'spec-14', name: 'Anesthesiology' },
  { id: 'spec-15', name: 'Endocrinology' },
  { id: 'spec-16', name: 'Emergency Medicine' },
  { id: 'spec-17', name: 'Hematology' },
  { id: 'spec-18', name: 'Radiology' },
  { id: 'spec-19', name: 'Pathology' },
  { id: 'spec-20', name: 'Psychiatry' },
  { id: 'spec-21', name: 'Infectious Diseases' },
  { id: 'spec-22', name: 'Rheumatology' },
  { id: 'spec-23', name: 'Physical Medicine & Rehabilitation' },
  { id: 'spec-24', name: 'General Surgery' },
  { id: 'spec-25', name: 'Preventive & Occupational Medicine' },
  { id: 'spec-26', name: 'Medical Genetics' },
  { id: 'spec-27', name: 'Urology' },
  { id: 'spec-28', name: 'Dentistry' },
];

export const INITIAL_HOSPITALS: Hospital[] = [
  { id: 'hosp-1', name: 'Square Hospital' },
  { id: 'hosp-2', name: 'Evercare Hospital Dhaka' },
  { id: 'hosp-3', name: 'United Hospital' },
  { id: 'hosp-4', name: 'Labaid Specialized Hospital' },
  { id: 'hosp-5', name: 'Ibn Sina Hospital' },
  { id: 'hosp-6', name: 'Dhaka Medical College Hospital' },
  { id: 'hosp-7', name: 'BIRDEM General Hospital' },
  { id: 'hosp-8', name: 'Popular Medical College Hospital' },
  { id: 'hosp-9', name: 'National Heart Foundation' },
  { id: 'hosp-10', name: 'Apollo Hospital' },
];

export const INITIAL_DOCTORS: Doctor[] = [
  { id: '669d6d77362041728a698101', name: 'Dr. Sarah Jenkins', specialty: 'Cardiology', department: 'Cardiovascular', hospital: 'Square Hospital', email: 'sarah.jenkins@hospital.org', phone: '+1-555-0101', status: 'Active' },
  { id: '669d6d77362041728a698102', name: 'Dr. Michael Chen', specialty: 'Neurology', department: 'Neuroscience', hospital: 'Evercare Hospital', email: 'michael.chen@citymed.org', phone: '+1-555-0102', status: 'Active' },
  { id: '669d6d77362041728a698103', name: 'Dr. Emily Rodriguez', specialty: 'Pediatrics', department: 'Children Health', hospital: 'Apollo Hospital', email: 'emily.rodriguez@clinic.org', phone: '+1-555-0103', status: 'Active' },
  { id: '669d6d77362041728a698104', name: 'Dr. James Wilson', specialty: 'Orthopedics', department: 'Musculoskeletal', hospital: 'United Hospital', email: 'james.wilson@hospital.org', phone: '+1-555-0104', status: 'Active' },
  { id: '669d6d77362041728a698105', name: 'Dr. Priya Patel', specialty: 'Dermatology', department: 'Dermatological Care', hospital: 'Labaid Hospital', email: 'priya.patel@metrohealth.org', phone: '+1-555-0105', status: 'Active' },
  { id: '669d6d77362041728a698106', name: 'Dr. David Kim', specialty: 'Oncology', department: 'Cancer Center', hospital: 'Square Hospital', email: 'david.kim@citymed.org', phone: '+1-555-0106', status: 'Active' },
  { id: '669d6d77362041728a698107', name: 'Dr. Lisa Anderson', specialty: 'Cardiology', department: 'Cardiovascular', hospital: 'Evercare Hospital', email: 'lisa.anderson@hospital.org', phone: '+1-555-0107', status: 'Active' },
  { id: '669d6d77362041728a698108', name: 'Dr. Marcus Vance', specialty: 'General Medicine', department: 'Internal Medicine', hospital: 'United Hospital', email: 'marcus.vance@clinic.org', phone: '+1-555-0108', status: 'Active' },
  { id: '669d6d77362041728a698109', name: 'Dr. Olivia Thorne', specialty: 'Neurology', department: 'Neuroscience', hospital: 'Labaid Hospital', email: 'olivia.thorne@hospital.org', phone: '+1-555-0109', status: 'Active' },
  { id: '669d6d77362041728a698110', name: 'Dr. Robert Martinez', specialty: 'Orthopedics', department: 'Musculoskeletal', hospital: 'Square Hospital', email: 'robert.martinez@citymed.org', phone: '+1-555-0110', status: 'Active' },
  { id: '669d6d77362041728a698111', name: 'Dr. Chloe Bennett', specialty: 'Pediatrics', department: 'Children Health', hospital: 'Evercare Hospital', email: 'chloe.bennett@clinic.org', phone: '+1-555-0111', status: 'Active' },
  { id: '669d6d77362041728a698112', name: 'Dr. Alan Turing', specialty: 'General Medicine', department: 'Internal Medicine', hospital: 'United Hospital', email: 'alan.turing@metrohealth.org', phone: '+1-555-0112', status: 'Inactive' },
];

export const INITIAL_PATIENTS: Patient[] = [
  { id: '669d6d77362041728a698201', name: 'John Doe', age: 45, gender: 'male', doctorId: '669d6d77362041728a698101', doctorName: 'Dr. Sarah Jenkins', condition: 'Hypertension', status: 'Active', admitted: '2024-01-10', phone: '+1-555-1001' },
  { id: '669d6d77362041728a698202', name: 'Jane Smith', age: 34, gender: 'female', doctorId: '669d6d77362041728a698101', doctorName: 'Dr. Sarah Jenkins', condition: 'Arrhythmia', status: 'Active', admitted: '2024-01-12', phone: '+1-555-1002' },
  { id: '669d6d77362041728a698203', name: 'Robert Johnson', age: 58, gender: 'male', doctorId: '669d6d77362041728a698101', doctorName: 'Dr. Sarah Jenkins', condition: 'Coronary Artery Disease', status: 'Critical', admitted: '2024-02-01', phone: '+1-555-1003' },
  { id: '669d6d77362041728a698204', name: 'Emily Davis', age: 29, gender: 'female', doctorId: '669d6d77362041728a698101', doctorName: 'Dr. Sarah Jenkins', condition: 'Mild Murmur', status: 'Recovered', admitted: '2024-02-15', phone: '+1-555-1004' },
  { id: '669d6d77362041728a698205', name: 'Michael Brown', age: 62, gender: 'male', doctorId: '669d6d77362041728a698101', doctorName: 'Dr. Sarah Jenkins', condition: 'Heart Failure', status: 'Active', admitted: '2024-03-01', phone: '+1-555-1005' },

  { id: '669d6d77362041728a698206', name: 'Jessica Taylor', age: 41, gender: 'female', doctorId: '669d6d77362041728a698102', doctorName: 'Dr. Michael Chen', condition: 'Migraine', status: 'Active', admitted: '2024-01-15', phone: '+1-555-1006' },
  { id: '669d6d77362041728a698207', name: 'William Anderson', age: 53, gender: 'male', doctorId: '669d6d77362041728a698102', doctorName: 'Dr. Michael Chen', condition: 'Neuropathy', status: 'Active', admitted: '2024-01-22', phone: '+1-555-1007' },
  { id: '669d6d77362041728a698208', name: 'Ashley Thomas', age: 31, gender: 'female', doctorId: '669d6d77362041728a698102', doctorName: 'Dr. Michael Chen', condition: 'Epilepsy', status: 'Recovered', admitted: '2024-02-05', phone: '+1-555-1008' },
  { id: '669d6d77362041728a698209', name: 'Christopher White', age: 47, gender: 'male', doctorId: '669d6d77362041728a698102', doctorName: 'Dr. Michael Chen', condition: 'Concussion', status: 'Critical', admitted: '2024-02-18', phone: '+1-555-1009' },

  { id: '669d6d77362041728a698210', name: 'Sophia Miller', age: 8, gender: 'female', doctorId: '669d6d77362041728a698103', doctorName: 'Dr. Emily Rodriguez', condition: 'Asthma', status: 'Active', admitted: '2024-01-18', phone: '+1-555-1010' },
  { id: '669d6d77362041728a698211', name: 'Liam Wilson', age: 12, gender: 'male', doctorId: '669d6d77362041728a698103', doctorName: 'Dr. Emily Rodriguez', condition: 'Bronchitis', status: 'Recovered', admitted: '2024-02-10', phone: '+1-555-1011' },
  { id: '669d6d77362041728a698212', name: 'Ava Martinez', age: 5, gender: 'female', doctorId: '669d6d77362041728a698103', doctorName: 'Dr. Emily Rodriguez', condition: 'Pneumonia', status: 'Critical', admitted: '2024-03-02', phone: '+1-555-1012' },

  { id: '669d6d77362041728a698213', name: 'Daniel Jackson', age: 39, gender: 'male', doctorId: '669d6d77362041728a698104', doctorName: 'Dr. James Wilson', condition: 'Knee Ligament Tear', status: 'Active', admitted: '2024-01-25', phone: '+1-555-1013' },
  { id: '669d6d77362041728a698214', name: 'Olivia Martin', age: 67, gender: 'female', doctorId: '669d6d77362041728a698104', doctorName: 'Dr. James Wilson', condition: 'Osteoarthritis', status: 'Active', admitted: '2024-02-14', phone: '+1-555-1014' },

  { id: '669d6d77362041728a698215', name: 'Lucas Harris', age: 24, gender: 'male', doctorId: '669d6d77362041728a698105', doctorName: 'Dr. Priya Patel', condition: 'Severe Eczema', status: 'Active', admitted: '2024-02-20', phone: '+1-555-1015' },
  { id: '669d6d77362041728a698216', name: 'Mia Robinson', age: 33, gender: 'female', doctorId: '669d6d77362041728a698105', doctorName: 'Dr. Priya Patel', condition: 'Psoriasis', status: 'Recovered', admitted: '2024-02-28', phone: '+1-555-1016' },

  { id: '669d6d77362041728a698217', name: 'Alexander Clark', age: 71, gender: 'male', doctorId: '669d6d77362041728a698106', doctorName: 'Dr. David Kim', condition: 'Lung Carcinoma', status: 'Critical', admitted: '2024-01-08', phone: '+1-555-1017' },
  { id: '669d6d77362041728a698218', name: 'Charlotte Lewis', age: 59, gender: 'female', doctorId: '669d6d77362041728a698106', doctorName: 'Dr. David Kim', condition: 'Breast Neoplasm', status: 'Active', admitted: '2024-01-30', phone: '+1-555-1018' },

  { id: '669d6d77362041728a698219', name: 'Ethan Walker', age: 50, gender: 'male', doctorId: '669d6d77362041728a698107', doctorName: 'Dr. Lisa Anderson', condition: 'Hypertension', status: 'Active', admitted: '2024-02-12', phone: '+1-555-1019' },
  { id: '669d6d77362041728a698220', name: 'Amelia Hall', age: 43, gender: 'female', doctorId: '669d6d77362041728a698108', doctorName: 'Dr. Marcus Vance', condition: 'Type 2 Diabetes', status: 'Active', admitted: '2024-02-22', phone: '+1-555-1020' },
];

