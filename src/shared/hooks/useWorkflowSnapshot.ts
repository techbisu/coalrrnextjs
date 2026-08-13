'use client';

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { WorkflowSnapshot } from '@/core/workflow/types/snapshot.types';

export function useWorkflowSnapshot(
  moduleCode: string,
  entityType: string,
  entityId: string,
  userRole?: string
) {
  const queryClient = useQueryClient();
  const queryKey = ['workflow-snapshot', moduleCode, entityType, entityId, userRole];

  // 1. Primary Snapshot Query
  const snapshotQuery = useQuery<WorkflowSnapshot>({
    queryKey,
    queryFn: async () => {
      const res = await fetch(`/api/workflow/snapshot/${moduleCode}/${entityType}/${entityId}`, {
        headers: userRole ? { 'x-user-role': userRole } : {},
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch workflow snapshot: ${res.statusText}`);
      }
      return res.json();
    },
    enabled: Boolean(moduleCode && entityType && entityId),
    staleTime: 1000 * 30, // 30 seconds
  });

  // 2. Realtime SSE Listener
  useEffect(() => {
    if (!moduleCode || !entityType || !entityId) return;

    const sseUrl = `/api/workflow/realtime/stream?entityType=${encodeURIComponent(
      entityType
    )}&entityId=${encodeURIComponent(entityId)}`;

    const eventSource = new EventSource(sseUrl);

    eventSource.addEventListener('WORKFLOW_UPDATED', () => {
      // Invalidate snapshot query across all components listening to this entity
      queryClient.invalidateQueries({
        queryKey: ['workflow-snapshot', moduleCode, entityType, entityId],
      });
    });

    eventSource.onerror = (err) => {
      console.warn('[useWorkflowSnapshot] SSE connection warning, will auto-reconnect', err);
    };

    return () => {
      eventSource.close();
    };
  }, [moduleCode, entityType, entityId, queryClient]);

  return snapshotQuery;
}
