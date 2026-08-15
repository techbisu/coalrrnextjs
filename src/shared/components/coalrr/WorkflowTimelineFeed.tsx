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
              const isCollapsed = !isCurrent && collapsedNodes[assignment.id] === true;

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

                      {/* 1. COMPLETED ACTIONS HISTORY (FORWARD & RETURN LOGS) */}
                      {assignment.actions && assignment.actions.length > 0 && (
                        <div className="space-y-2">
                          {assignment.actions.map((act) => {
                            const isReturnAction =
                              (act.label && (act.label.toLowerCase().includes('return') || act.label.toLowerCase().includes('reject'))) ||
                              ((act as any).action && ((act as any).action.toLowerCase().includes('return') || (act as any).action.toLowerCase().includes('reject')));

                            return (
                              <div
                                key={act.id}
                                className={cn(
                                  'p-3 rounded-xl border space-y-2 text-xs transition-all',
                                  isReturnAction
                                    ? 'bg-amber-50/60 border-amber-200/90 dark:bg-amber-950/30 dark:border-amber-900'
                                    : 'bg-emerald-50/60 border-emerald-200/90 dark:bg-emerald-950/30 dark:border-emerald-900'
                                )}
                              >
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                  <span
                                    className={cn(
                                      'font-bold flex items-center gap-1.5 text-xs',
                                      isReturnAction ? 'text-amber-950 dark:text-amber-200' : 'text-emerald-950 dark:text-emerald-200'
                                    )}
                                  >
                                    {isReturnAction ? (
                                      <Undo className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                    ) : (
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                    )}
                                    {act.label || (act as any).action || 'Workflow Action Executed'}
                                  </span>
                                  {act.completedAt && (
                                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
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

                                {((act as any).completedUser || act.completedBy || (act as any).completedRole) && (
                                  <div className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-1.5 flex-wrap">
                                    <span className="font-medium text-slate-500">Performed by:</span>
                                    {(act as any).completedUser ? (
                                      <UserInfoBadge user={(act as any).completedUser} role={(act as any).completedRole} />
                                    ) : (
                                      <span className="font-semibold text-slate-800 dark:text-slate-200">{act.completedBy || (act as any).completedRole}</span>
                                    )}
                                  </div>
                                )}

                                {act.justification && (
                                  <div className="p-2.5 rounded-md bg-white/90 border border-slate-200/80 dark:bg-slate-900 dark:border-slate-800 text-slate-700 dark:text-slate-300 italic flex items-start gap-2">
                                    <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                                    <div className="leading-relaxed">
                                      <span className="font-bold not-italic text-slate-900 dark:text-slate-100 mr-1.5">
                                        Justification / Remarks:
                                      </span>
                                      &ldquo;{act.justification}&rdquo;
                                    </div>
                                  </div>
                                )}

                                {act.attachments && act.attachments.length > 0 && (
                                  <div className="flex flex-wrap gap-2 pt-1">
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
                      )}

                      {/* 2. CURRENT ASSIGNMENT PENDING ACTIONS (MINIMAL LIST ONLY) */}
                      {isCurrent && assignment.pendingActions && assignment.pendingActions.length > 0 && (
                        <div className="p-3 rounded-lg bg-amber-50/40 dark:bg-amber-950/20 space-y-2.5">
                          <div className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5 uppercase tracking-wide">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            Pending Stage Prerequisites ({assignment.pendingActions.filter((p) => p.status !== 'COMPLETED').length} Remaining)
                          </div>

                          <div className="space-y-2 pl-1">
                            {assignment.pendingActions.map((pending) => {
                              const isCompleted = pending.status === 'COMPLETED';

                              return (
                                <div
                                  key={pending.id}
                                  className={cn(
                                    'space-y-0.5 text-xs transition-colors py-0.5',
                                    isCompleted ? 'text-slate-500 opacity-75' : 'text-slate-800 dark:text-slate-200'
                                  )}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    {isCompleted ? (
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                    ) : (
                                      <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0 italic" />
                                    )}
                                    <span
                                      className={cn(
                                        'italic font-semibold truncate',
                                        isCompleted ? 'text-slate-500 line-through' : 'text-slate-800 dark:text-slate-200'
                                      )}
                                    >
                                      {pending.label}
                                    </span>
                                  </div>

                                  {pending.description && (
                                    <p
                                      className={cn(
                                        'text-[11px] pl-5.5 leading-snug',
                                        isCompleted ? 'text-slate-400 line-through' : 'text-slate-600 dark:text-slate-400'
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
