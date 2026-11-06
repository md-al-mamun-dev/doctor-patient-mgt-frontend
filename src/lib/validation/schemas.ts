import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const doctorFormSchema = z.object({
  name: z.string().trim().min(2, 'Doctor name must be at least 2 characters'),
  specialty: z.string().trim().min(2, 'Specialty is required'),
  hospital: z.string().trim().min(2, 'Hospital is required'),
  department: z.string().trim().optional(),
  email: z.string().trim().email('Please enter a valid email address'),
  phone: z
    .string()
    .trim()
    .min(1, 'Phone number is required')
    .refine(
      (val) => {
        const digits = val.replace(/\D/g, '');
        const validChars = /^[+]?[\d\s\-()./]+$/.test(val);
        return validChars && digits.length >= 6 && digits.length <= 18;
      },
      {
        message: 'Enter a valid phone number (e.g. +1-555-0101, 01712345678, or +8801712345678)',
      }
    ),
  status: z.enum(['Active', 'Inactive']),
});

export type DoctorFormData = z.infer<typeof doctorFormSchema>;

export const patientFormSchema = z.object({
  name: z.string().trim().min(2, 'Patient name must be at least 2 characters').max(100),
  age: z.number().int().min(0, 'Age must be 0 or greater').max(130, 'Age cannot exceed 130'),
  gender: z.enum(['male', 'female', 'other'], {
    message: 'Please select a gender',
  }),
  doctorId: z.string().min(1, 'Please select an assigned doctor'),
  phone: z
    .string()
    .trim()
    .min(1, 'Phone number is required')
    .refine(
      (val) => {
        const digits = val.replace(/\D/g, '');
        const validChars = /^[+]?[\d\s\-()./]+$/.test(val);
        return validChars && digits.length >= 6 && digits.length <= 18;
      },
      {
        message: 'Enter a valid phone number (e.g. +1-555-0101, 01712345678, or +8801712345678)',
      }
    ),
  email: z.string().trim().email('Please enter a valid email address').optional().or(z.literal('')),
  condition: z.string().trim().min(1, 'Please select a condition'),
  diagnosis: z.string().trim().max(200).optional().or(z.literal('')),
  admissionDate: z.string().optional().or(z.literal('')),
  notes: z.string().trim().max(2000).optional().or(z.literal('')),
  status: z.enum(['Active', 'Critical', 'Recovered']).optional(),
  admitted: z.string().optional(),
  address: z.string().trim().optional(),
  emergencyContact: z.string().trim().optional(),
});

export type PatientFormData = z.infer<typeof patientFormSchema>;
