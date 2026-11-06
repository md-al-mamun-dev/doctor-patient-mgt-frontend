import { DoctorFilterParams, PatientFilterParams } from '@/types';

export function parseDoctorFilters(searchParams: URLSearchParams): Required<DoctorFilterParams> {
  const search = searchParams.get('search') ?? '';
  const specialty = searchParams.get('specialty') ?? '';
  const hospital = searchParams.get('hospital') ?? searchParams.get('department') ?? '';
  const department = searchParams.get('department') ?? hospital;
  const from = searchParams.get('from') ?? '';
  const to = searchParams.get('to') ?? '';
  const parsedPage = parseInt(searchParams.get('page') ?? '1', 10);
  const parsedLimit = parseInt(searchParams.get('limit') ?? '10', 10);

  return {
    search: search.trim(),
    specialty: specialty.trim(),
    hospital: hospital.trim(),
    department: department.trim(),
    from: from.trim(),
    to: to.trim(),
    page: isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage,
    limit: isNaN(parsedLimit) || parsedLimit < 1 ? 10 : Math.min(parsedLimit, 100),
  };
}

export function parsePatientFilters(searchParams: URLSearchParams): Required<PatientFilterParams> {
  const search = searchParams.get('search') ?? '';
  const status = searchParams.get('status') ?? '';
  const doctorId = searchParams.get('doctorId') ?? '';
  const condition = searchParams.get('condition') ?? '';
  const from = searchParams.get('from') ?? '';
  const to = searchParams.get('to') ?? '';
  const parsedPage = parseInt(searchParams.get('page') ?? '1', 10);
  const parsedLimit = parseInt(searchParams.get('limit') ?? '10', 10);

  return {
    search: search.trim(),
    status: status.trim(),
    doctorId: doctorId.trim(),
    condition: condition.trim(),
    from: from.trim(),
    to: to.trim(),
    page: isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage,
    limit: isNaN(parsedLimit) || parsedLimit < 1 ? 10 : Math.min(parsedLimit, 100),
  };
}

export function getDatePresetRange(preset: string): { from: string; to: string } {
  const now = new Date();
  const toStr = now.toISOString().split('T')[0];

  if (preset === '7d') {
    const fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return { from: fromDate.toISOString().split('T')[0], to: toStr };
  }
  if (preset === '30d') {
    const fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return { from: fromDate.toISOString().split('T')[0], to: toStr };
  }
  return { from: '', to: '' };
}

export function buildQueryString(
  currentParams: URLSearchParams,
  updates: Record<string, string | number | null | undefined>
): string {
  const params = new URLSearchParams(currentParams.toString());

  for (const [key, val] of Object.entries(updates)) {
    if (val === null || val === undefined || val === '') {
      params.delete(key);
    } else {
      params.set(key, String(val));
    }
  }

  // If a filter or search term changed and page wasn't explicitly updated in updates, reset page to 1
  const filterKeys = ['search', 'specialty', 'hospital', 'department', 'status', 'doctorId', 'condition', 'from', 'to'];
  const hasFilterUpdate = Object.keys(updates).some((k) => filterKeys.includes(k));
  if (hasFilterUpdate && !('page' in updates)) {
    params.delete('page'); // page 1 is default
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
}
