'use client';

import { useApiList } from '@/hooks/use-api-query';
import { keys } from '@/lib/query-keys';
import type { AuditListParams, AuditLog } from '@/types/models';

/** Audit log entries table for admins. */
export function useAuditLogs(params: AuditListParams) {
  return useApiList<AuditLog, AuditListParams>({
    key: keys.audit.list,
    path: '/audit-logs',
    params,
  });
}

