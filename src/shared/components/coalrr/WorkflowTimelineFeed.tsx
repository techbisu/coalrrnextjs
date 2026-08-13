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
} from 'lucide-react';
import { Badge } from '@/shared/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { useWorkflowSnapshot } from '@/shared/hooks/useWorkflowSnapshot';
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
  onSignDocument?: (action: WorkflowPendingAction) => void;
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
}: WorkflowTimelineFeedProps) {
  const { data: snapshot, isLoading, isError, refetch } = useWorkflowSnapshot(
    moduleCode,
    entityType,
    entityId,
    userRole
  );

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
    <Card className={`border shadow-sm bg-white overflow-hidden ${className}`}>
      <CardHeader className="pb-3 bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-emerald-600" />
          <CardTitle className="text-sm font-semibold text-slate-800">
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
          <div className="relative pl-6 space-y-8 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {assignments.map((assignment) => {
              const isCurrent = assignment.status === 'CURRENT';
              const isCompleted = assignment.status === 'COMPLETED';
              const isWaiting = assignment.status === 'WAITING';

              return (
                <div key={assignment.id} className="relative group space-y-3">
                  {/* Node Badge */}
                  <div
                    className={`absolute -left-[23px] top-1 w-4 h-4 rounded-full border-2 border-white shadow-sm flex items-center justify-center ring-2 ${
                      isCurrent
                        ? 'bg-amber-500 ring-amber-100'
                        : isCompleted
                        ? 'bg-emerald-600 ring-emerald-100'
                        : 'bg-slate-300 ring-slate-100'
                    }`}
                  />

                  {/* Assignment Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">
                        {isCompleted && '✓ '}
                        {isCurrent && '● '}
                        {isWaiting && '○ '}
                        Assignment: {assignment.stageName}
                      </span>
                      {isCurrent && (
                        <Badge className="bg-amber-100 text-amber-900 border-amber-300 text-[10px] uppercase tracking-wider font-semibold">
                          CURRENT ASSIGNMENT
                        </Badge>
                      )}
                      {isWaiting && (
                        <Badge variant="outline" className="text-[10px] text-slate-400">
                          WAITING
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 flex items-center gap-1.5 font-medium">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Assigned to:</span>
                    <span className="font-semibold text-slate-800">
                      {assignment.assignedUser
                        ? `${assignment.assignedUser.name} (${assignment.assignedRole})`
                        : assignment.assignedRole}
                    </span>
                  </div>

                  {/* 1. COMPLETED ACTIONS HISTORY */}
                  {assignment.actions.length > 0 && (
                    <div className="space-y-2 pt-1">
                      {assignment.actions.map((act) => (
                        <div
                          key={act.id}
                          className="p-3 rounded-lg bg-emerald-50/50 border border-emerald-100 space-y-1.5 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-emerald-950 flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              {act.label}
                            </span>
                            {act.completedAt && (
                              <span className="text-[11px] text-slate-400">
                                {new Date(act.completedAt).toLocaleString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit',
                                })}
                              </span>
                            )}
                          </div>

                          {act.completedBy && (
                            <div className="text-[11px] text-slate-500">
                              Completed by: <span className="font-medium text-slate-700">{act.completedBy}</span>
                            </div>
                          )}

                          {act.justification && (
                            <div className="p-2 rounded bg-white/80 border border-slate-200 text-slate-700 italic flex items-start gap-1.5">
                              <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-semibold not-italic text-slate-900 mr-1">
                                  Justification:
                                </span>
                                &ldquo;{act.justification}&rdquo;
                              </div>
                            </div>
                          )}

                          {act.attachments && act.attachments.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-1">
                              {act.attachments.map((att) => (
                                <a
                                  key={att.id}
                                  href={`/api/documents/${att.id}/download`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50 text-[11px] font-medium transition-colors"
                                >
                                  <Paperclip className="w-3 h-3 text-emerald-600" />
                                  <span>{att.fileName}</span>
                                  <Download className="w-3 h-3 ml-0.5 text-emerald-600" />
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 2. CURRENT ASSIGNMENT PENDING ACTIONS */}
                  {isCurrent && assignment.pendingActions && assignment.pendingActions.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/80 space-y-3">
                      <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5 uppercase tracking-wide">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        Pending Actions for Current Assignment
                      </div>

                      <div className="space-y-2">
                        {assignment.pendingActions.map((pending) => {
                          const canAct = pending.isAuthorizedForCurrentUser && pending.status === 'PENDING';

                          return (
                            <div
                              key={pending.id}
                              className={`p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                                canAct
                                  ? 'bg-white border-amber-300 shadow-sm'
                                  : 'bg-slate-50/80 border-slate-200 opacity-90'
                              }`}
                            >
                              <div className="space-y-0.5 text-xs">
                                <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                                  {pending.label}
                                </div>
                                {pending.description && (
                                  <p className="text-[11px] text-slate-500 pl-3.5">
                                    {pending.description}
                                  </p>
                                )}
                              </div>

                              {/* Actionable Button (Rendered ONLY if current user is authorized and backend permits) */}
                              <div>
                                {canAct ? (
                                  pending.type === 'DOCUMENT_SIGNATURE' ? (
                                    <Button
                                      size="sm"
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs h-8 px-3 shadow-xs gap-1.5"
                                      onClick={() => onSignDocument && onSignDocument(pending)}
                                    >
                                      <FileSignature className="w-3.5 h-3.5" />
                                      Sign Document
                                    </Button>
                                  ) : pending.type === 'MILESTONE' ? (
                                    <Button
                                      size="sm"
                                      className="bg-purple-600 hover:bg-purple-700 text-white font-medium text-xs h-8 px-3 shadow-xs gap-1.5"
                                      onClick={() => onRecordMilestone && onRecordMilestone()}
                                    >
                                      <Award className="w-3.5 h-3.5" />
                                      Record Milestone
                                    </Button>
                                  ) : (
                                    <Button
                                      size="sm"
                                      className="bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs h-8 px-3 shadow-xs gap-1.5"
                                      onClick={() => onExecuteAction && onExecuteAction(pending)}
                                    >
                                      <ChevronRight className="w-3.5 h-3.5" />
                                      Execute Action
                                    </Button>
                                  )
                                ) : (
                                  <Badge variant="outline" className="text-[11px] text-slate-400 font-normal">
                                    {pending.status === 'BLOCKED' ? 'Prerequisite Blocked' : 'View Only'}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 3. CURRENT ASSIGNMENT RECOMMENDATIONS */}
                  {isCurrent && (assignment as any).recommendations && (assignment as any).recommendations.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                      <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                        Recommendations &amp; Action Items
                      </div>

                      <div className="space-y-2">
                        {((assignment as any).recommendations as any[]).map((rec) => {
                          const isRequired = rec.mode === 'REQUIRED';
                          const isFulfilled = rec.status === 'FULFILLED';

                          return (
                            <div
                              key={rec.id}
                              className={`p-3 rounded-lg border flex items-center justify-between gap-3 text-xs ${
                                isFulfilled
                                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                                  : isRequired
                                  ? 'bg-amber-50/80 border-amber-300 text-amber-950'
                                  : 'bg-blue-50/60 border-blue-200 text-blue-950'
                              }`}
                            >
                              <div className="space-y-0.5">
                                <div className="font-semibold flex items-center gap-1.5">
                                  {isFulfilled ? (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  ) : isRequired ? (
                                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                  ) : (
                                    <Lightbulb className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                  )}
                                  <span>{rec.label}</span>
                                  <Badge
                                    variant="outline"
                                    className={`text-[10px] uppercase font-bold px-1.5 py-0.2 ${
                                      isRequired
                                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                                        : 'bg-blue-100 text-blue-800 border-blue-300'
                                    }`}
                                  >
                                    {rec.mode}
                                  </Badge>
                                </div>

                                {rec.reason && (
                                  <p className="text-[11px] text-slate-600 italic pl-5">
                                    &ldquo;{rec.reason}&rdquo;
                                  </p>
                                )}

                                {rec.createdBy && (
                                  <p className="text-[10px] text-slate-400 pl-5">
                                    By: {rec.createdBy}
                                  </p>
                                )}
                              </div>

                              <div>
                                {isFulfilled ? (
                                  <Badge className="bg-emerald-600 text-white text-[10px] uppercase font-bold">
                                    ✓ FULFILLED
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="text-[10px] uppercase font-bold">
                                    PENDING
                                  </Badge>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 3. WAITING ASSIGNMENT PLACEHOLDER */}
                  {isWaiting && (
                    <div className="text-xs text-slate-400 italic pl-1">
                      Waiting for previous assignment completion.
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
