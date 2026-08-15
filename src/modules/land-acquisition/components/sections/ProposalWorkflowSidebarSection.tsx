'use client';

import * as React from 'react';
import { WorkflowTimelineFeed } from '@/shared/components/coalrr/WorkflowTimelineFeed';
import { WorkflowActionBar } from '@/shared/components/coalrr/workflow/WorkflowActionBar';
import { WorkflowActionCommandCenter } from '@/shared/components/coalrr/workflow/WorkflowActionCommandCenter';
import { LimitCheckPanel } from '@/shared/components/coalrr';
import { MODULE_CODES, CHECKABLE_ENTITY_TYPES } from '@/core/config/module-codes.config';
import { useWorkflowSnapshot } from '@/shared/hooks/useWorkflowSnapshot';
import type { LimitDetails } from '@/shared/components/coalrr';
import type { WorkflowTransitionOption } from '@/core/workflow/types/snapshot.types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface ProposalWorkflowSidebarSectionProps {
  proposalId: string;
  currentState: string;
  actorRole: string;
  onActorRoleChange?: (role: string) => void;
  limits: LimitDetails | null;
}

export function ProposalWorkflowSidebarSection({
  proposalId,
  currentState,
  actorRole,
  onActorRoleChange,
  limits,
}: ProposalWorkflowSidebarSectionProps) {
  const queryClient = useQueryClient();
  const [selectedTransition, setSelectedTransition] = React.useState<WorkflowTransitionOption | null>(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  const { data: snapshot } = useWorkflowSnapshot(
    MODULE_CODES.LAND_SCHEDULE,
    CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE,
    proposalId,
    actorRole
  );

  const transitionMutation = useMutation({
    mutationFn: async ({
      transition,
      comments,
    }: {
      transition: WorkflowTransitionOption;
      comments: string;
    }) => {
      const res = await fetch(`/api/schedules/${proposalId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionName: transition.name,
          role: actorRole,
          comments,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Transition failed');
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Transitioned to ${data.newStatusLabel || 'next state'}`);
      queryClient.invalidateQueries({
        queryKey: [
          'workflow-snapshot',
          MODULE_CODES.LAND_SCHEDULE,
          CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE,
          proposalId,
        ],
      });
      setIsDialogOpen(false);
    },
    onError: (err: Error) => {
      toast.error('Transition blocked', { description: err.message });
    },
  });

  return (
    <div className="space-y-6">
      {/* 1. Workflow Action Bar for Authorized Transitions */}
      {snapshot?.availableTransitions && (
        <WorkflowActionBar
          availableTransitions={snapshot.availableTransitions}
          onSelectTransition={(t) => {
            setSelectedTransition(t);
            setIsDialogOpen(true);
          }}
          isSubmitting={transitionMutation.isPending}
        />
      )}

      {/* 2. Single Primary Assignment-Centric Workflow Timeline & Action Feed */}
      <WorkflowTimelineFeed
        moduleCode={MODULE_CODES.LAND_SCHEDULE}
        entityType={CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE}
        entityId={proposalId}
        userRole={actorRole}
        onExecuteAction={() => {
          if (snapshot?.availableTransitions && snapshot.availableTransitions.length > 0) {
            setSelectedTransition(snapshot.availableTransitions[0]);
            setIsDialogOpen(true);
          }
        }}
      />

      {/* 3. Metadata-Driven Action Command Center */}
      <WorkflowActionCommandCenter
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        proposalId={proposalId}
        transition={selectedTransition as any}
      />

      {/* 4. Project Baseline Limits Gauge */}
      <LimitCheckPanel limits={limits} />
    </div>
  );
}
