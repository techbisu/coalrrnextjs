'use client';

import * as React from 'react';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Paperclip,
  Download,
  MessageSquare,
  FileSignature,
  Award,
  ChevronRight,
  ShieldCheck,
  User,
  ArrowRight,
  Sparkles,
  Lightbulb,
  AlertTriangle,
  Lock,
  ChevronDown,
  ChevronUp,
  Undo,
} from 'lucide-react';
import { Badge } from '@/shared/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useWorkflowSnapshot } from '@/shared/hooks/useWorkflowSnapshot';
import { UserInfoBadge } from './UserInfoBadge';
import type { WorkflowPendingAction, WorkflowAssignmentNode } from '@/core/workflow/types/snapshot.types';

export interface WorkflowTimelineFeedProps {
  moduleCode: string; // e.g. MODULE_CODES.LAND_SCHEDULE ('LAND_SCHEDULE')
  entityType: string; // e.g. CHECKABLE_ENTITY_TYPES.ACQ_LAND_SCHEDULE ('acq_land_schedule')
  entityId: string;
  userRole?: string;
  maxHeight?: number | string;
  className?: string;
  onExecuteAction?: (action: WorkflowPendingAction) => void;
  onRecordMilestone?: () => void;
  onSignDocument?: () => void;
  onExecuteTransition?: (transition: any) => void;
}

export function WorkflowTimelineFeed({
  moduleCode,
  entityType,
  entityId,
  userRole,
  maxHeight = 650,
  className = '',
  onExecuteAction,
  onRecordMilestone,
  onSignDocument,
  onExecuteTransition,
}: WorkflowTimelineFeedProps) {
  const { data: snapshot, isLoading, isError, refetch } = useWorkflowSnapshot(
    moduleCode,
    entityType,
    entityId,
    userRole
  );

  const [collapsedNodes, setCollapsedNodes] = React.useState<Record<string, boolean>>({});

  const toggleNode = (id: string) => {
    setCollapsedNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (isLoading) {
    return (
      <Card className="p-4 space-y-4">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </Card>
    );
  }

  if (isError || !snapshot) {
    return (
      <div className="p-4 rounded-lg bg-red-50 text-red-700 border border-red-200 text-sm flex items-center justify-between">
        <span>Failed to load workflow timeline snapshot.</span>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  const { currentState, currentAssignment, assignments } = snapshot;

  return (
    <Card className={`border shadow-sm bg-white dark:bg-slate-950 overflow-hidden ${className}`}>
      <CardHeader className="pb-3 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-emerald-600" />
          <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Workflow Timeline & Action Feed
          </CardTitle>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="text-xs font-semibold px-2.5 py-0.5"
            style={{ backgroundColor: snapshot.currentState.color ? '#ecfdf5' : '#f1f5f9' }}
          >
            {currentState.label}
          </Badge>
          <Badge variant="secondary" className="text-xs font-mono">
            {moduleCode}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-6 overflow-y-auto" style={{ maxHeight }}>
        {assignments.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm italic">
            No assignments recorded yet.
          </div>
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
            {assignments.map((assignment) => {
              const isCurrent = assignment.status === 'CURRENT';
              const isCompleted = assignment.status === 'COMPLETED';
              const isWaiting = assignment.status === 'WAITING';
              // Collapse all past/future timeline stages by default; only expand current assignment
              const isCollapsed = !isCurrent && (collapsedNodes[assignment.id] ?? true);

              return (
                <div key={assignment.id} className="relative group space-y-2.5">
                  {/* Node Badge */}
                  <div
                    className={`absolute -left-[23px] top-1 w-4 h-4 rounded-full border-2 border-white shadow-sm flex items-center justify-center ring-2 ${
                      isCurrent
                        ? 'bg-amber-500 ring-amber-100 dark:ring-amber-950'
                        : isCompleted
                        ? 'bg-emerald-600 ring-emerald-100 dark:ring-emerald-950'
                        : 'bg-slate-300 ring-slate-100 dark:ring-slate-900'
                    }`}
                  />

                  {/* Assignment Header */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        {isCompleted && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                        {isCurrent && <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0 animate-pulse" />}
                        {isWaiting && <span className="w-2.5 h-2.5 rounded-full bg-slate-300 shrink-0" />}
                        Assignment: {assignment.stageName}
                      </span>
                      {isCurrent && (
                        <Badge className="bg-amber-100 text-amber-900 border-amber-300 text-[10px] uppercase tracking-wider font-semibold dark:bg-amber-950/60 dark:text-amber-300">
                          CURRENT ASSIGNMENT
                        </Badge>
                      )}
                      {isWaiting && (
                        <Badge variant="outline" className="text-[10px] text-slate-400">
                          WAITING
                        </Badge>
                      )}
                      {assignment.actions && assignment.actions.length > 0 && (
                        <Badge variant="secondary" className="text-[10px] font-mono">
                          {assignment.actions.length} Action Log{assignment.actions.length === 1 ? '' : 's'}
                        </Badge>
                      )}
                    </div>

                    {!isCurrent && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 gap-1"
                        onClick={() => toggleNode(assignment.id)}
                      >
                        <span>{isCollapsed ? 'Expand' : 'Collapse'}</span>
                        {isCollapsed ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
                      </Button>
                    )}
                  </div>

                  {!isCollapsed && (
                    <div className="space-y-3 pt-0.5">
                      <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2 font-medium">
                        <span className="text-slate-500">Assigned to:</span>
                        <UserInfoBadge user={assignment.assignedUser} role={assignment.assignedRole} />
                      </div>

                      {/* 1. STAGE PREREQUISITES & COMPLETED TASKS STACK (ALWAYS TOP OF STAGE) */}
                      {assignment.pendingActions && assignment.pendingActions.length > 0 && (() => {
                        const remainingCount = assignment.pendingActions.filter((p) => p.status !== 'COMPLETED').length;
                        const hasActionableByMe = assignment.pendingActions.some((p) => p.classification === 'ACTIONABLE_BY_ME');
                        const isStageTasksDoneByYou = !hasActionableByMe && assignment.pendingActions.some((p) => p.description?.includes('Signed by you'));
                        const allSatisfied = remainingCount === 0 || isCompleted;
                        
                        const containerBg = allSatisfied ? 'bg-emerald-50/40 dark:bg-emerald-950/20' : (hasActionableByMe ? 'bg-amber-50/40 dark:bg-amber-950/20' : 'bg-blue-50/40 dark:bg-blue-950/20');
                        const headerColor = allSatisfied ? 'text-emerald-900 dark:text-emerald-200' : (hasActionableByMe ? 'text-amber-900 dark:text-amber-200' : 'text-blue-900 dark:text-blue-200');

                        return (
                          <div className={`p-3 rounded-lg space-y-2.5 ${containerBg}`}>
                            <div className={`text-xs font-bold flex items-center gap-1.5 uppercase tracking-wide ${headerColor}`}>
                              {allSatisfied ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              ) : hasActionableByMe ? (
                                <Clock className="w-3.5 h-3.5 text-amber-600" />
                              ) : (
                                <User className="w-3.5 h-3.5 text-blue-600" />
                              )}
                              {allSatisfied
                                ? 'Stage Prerequisites & Tasks (All Completed)'
                                : hasActionableByMe
                                ? `Pending Stage Prerequisites (${remainingCount} Remaining)`
                                : isStageTasksDoneByYou
                                ? 'Stage Tasks Completed by You (Awaiting Next Signatory)'
                                : `Pending Stage Tasks (Awaiting Assignee)`}
                            </div>

                            <div className="space-y-2 pl-1">
                              {assignment.pendingActions.map((pending) => {
                                const isDone = pending.classification === 'COMPLETED' || pending.status === 'COMPLETED';
                                const isActionable = pending.classification === 'ACTIONABLE_BY_ME';
                                const isWaitingOnAssignee = pending.classification === 'WAITING_ON_ASSIGNEE';
                                const isBlocked = pending.classification === 'BLOCKED_BY_PREREQUISITE' || pending.status === 'BLOCKED';

                                return (
                                  <div
                                    key={pending.id}
                                    className={cn(
                                      'space-y-0.5 text-xs transition-colors py-0.5',
                                      isDone
                                        ? 'text-emerald-800 dark:text-emerald-300'
                                        : isActionable
                                        ? 'text-slate-900 font-medium dark:text-slate-100'
                                        : isWaitingOnAssignee
                                        ? 'text-slate-600 dark:text-slate-400'
                                        : 'text-slate-400 dark:text-slate-500'
                                    )}
                                  >
                                    <div className="flex items-center justify-between min-w-0 flex-wrap gap-1.5">
                                      <div className="flex items-center gap-2 min-w-0">
                                        {isDone ? (
                                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                        ) : isActionable ? (
                                          <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0 animate-pulse" />
                                        ) : isWaitingOnAssignee ? (
                                          <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                        ) : (
                                          <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                        )}
                                        <span
                                          className={cn(
                                            'italic font-semibold truncate',
                                            isDone
                                              ? 'text-emerald-800 dark:text-emerald-300'
                                              : isActionable
                                              ? 'text-slate-900 dark:text-slate-100'
                                              : isWaitingOnAssignee
                                              ? 'text-slate-700 dark:text-slate-300'
                                              : 'text-slate-400 dark:text-slate-500'
                                          )}
                                        >
                                          {pending.label}
                                        </span>
                                      </div>

                                      {!isDone && isWaitingOnAssignee && pending.requiredPermission && (
                                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 font-mono text-muted-foreground">
                                          Awaiting {pending.requiredPermission.split('.').pop()?.replace(/[-_]/g, ' ')}
                                        </Badge>
                                      )}
                                      {!isDone && isActionable && (
                                        <Badge className="bg-amber-100 text-amber-900 border-amber-300 text-[9px] px-1.5 py-0 font-semibold dark:bg-amber-950/60 dark:text-amber-300">
                                          Action Required by You
                                        </Badge>
                                      )}
                                    </div>

                                    {pending.description && (
                                      <p
                                        className={cn(
                                          'text-[11px] pl-5.5 leading-snug',
                                          isDone
                                            ? 'text-emerald-700/80 dark:text-emerald-400 font-normal'
                                            : isActionable
                                            ? 'text-slate-600 dark:text-slate-300'
                                            : 'text-slate-500 dark:text-slate-400'
                                        )}
                                      >
                                        {pending.description}
                                      </p>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}

                      {/* 2. COMPLETED ACTIONS & FORWARD HISTORY (BELOW STAGE TASKS) */}
                      {assignment.actions && assignment.actions.length > 0 && (
                        <div className="space-y-2 pt-1 border-t border-border/40">
                          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground pl-1">
                            Action History &amp; Forward Logs ({assignment.actions.length})
                          </div>
                          <div className="space-y-2.5 pl-1">
                            {[...assignment.actions]
                              .sort((a, b) => (a.completedAt && b.completedAt ? new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime() : 0))
                              .map((act) => {
                                const isReturnAction =
                                  (act.label && (act.label.toLowerCase().includes('return') || act.label.toLowerCase().includes('reject'))) ||
                                  ((act as any).action && ((act as any).action.toLowerCase().includes('return') || (act as any).action.toLowerCase().includes('reject')));

                                return (
                                  <div
                                    key={act.id}
                                    className="space-y-1 text-xs transition-colors py-1 px-2.5 rounded-md bg-muted/20 border border-border/40"
                                  >
                                    <div className="flex items-center justify-between min-w-0 flex-wrap gap-1.5">
                                      <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                                        {isReturnAction ? (
                                          <Undo className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                        ) : (
                                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                        )}
                                        <span
                                          className={cn(
                                            'font-semibold truncate text-xs capitalize',
                                            isReturnAction ? 'text-amber-800 dark:text-amber-300' : 'text-emerald-800 dark:text-emerald-300'
                                          )}
                                        >
                                          {act.label || (act as any).action || 'Workflow Action Executed'}
                                        </span>

                                        {act.completedUser && (
                                          <span className="text-[11px] font-normal text-muted-foreground">
                                            by <strong className="font-semibold text-slate-800 dark:text-slate-200">{act.completedUser.name}</strong> ({act.completedUser.designation || 'Unit Surveyor'})
                                          </span>
                                        )}

                                        {(act.targetRecipientLabel || act.completedRole) && (
                                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-medium bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800">
                                            ➔ Forwarded to: {act.targetRecipientLabel || act.completedRole}
                                          </Badge>
                                        )}
                                      </div>

                                      {act.completedAt && (
                                        <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                                          {new Date(act.completedAt).toLocaleString('en-IN', {
                                            day: '2-digit',
                                            month: 'short',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                          })}
                                        </span>
                                      )}
                                    </div>

                                    {act.justification && (
                                      <div className="pl-5 text-[11px] text-slate-600 dark:text-slate-400 italic flex items-start gap-1.5 bg-background/50 p-1.5 rounded border border-border/30">
                                        <MessageSquare className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                                        <span>&ldquo;{act.justification}&rdquo;</span>
                                      </div>
                                    )}

                                    {act.attachments && act.attachments.length > 0 && (
                                      <div className="flex flex-wrap gap-2 pl-5 pt-1">
                                        {act.attachments.map((att: any) => (
                                          <a
                                            key={att.id}
                                            href={`/api/documents/${att.id}/download`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white text-emerald-800 border border-emerald-300 hover:bg-emerald-50 dark:bg-slate-900 dark:text-emerald-300 dark:border-emerald-800 text-[11px] font-semibold transition-colors shadow-2xs"
                                          >
                                            <Paperclip className="w-3 h-3 text-emerald-600 shrink-0" />
                                            <span className="truncate max-w-[180px]">{att.fileName}</span>
                                            <Download className="w-3 h-3 text-emerald-600 shrink-0 ml-0.5" />
                                          </a>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
