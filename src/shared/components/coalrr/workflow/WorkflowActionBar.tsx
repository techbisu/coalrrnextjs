'use client';

import * as React from 'react';
import { ChevronRight, ArrowLeftRight, CheckCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import type { WorkflowTransitionOption } from '@/core/workflow/types/snapshot.types';

export interface WorkflowActionBarProps {
  availableTransitions: readonly WorkflowTransitionOption[];
  onSelectTransition: (transition: WorkflowTransitionOption) => void;
  isSubmitting?: boolean;
  className?: string;
}

export function WorkflowActionBar({
  availableTransitions,
  onSelectTransition,
  isSubmitting = false,
  className = '',
}: WorkflowActionBarProps) {
  if (!availableTransitions || availableTransitions.length === 0) {
    return null;
  }

  // Separate transitions into Forward (advance/approve) vs Return (reject/escalate)
  const returnTransitions = availableTransitions.filter(
    (t) => t.name.includes('return') || t.name.includes('reject') || t.toState.includes('Draft')
  );
  const forwardTransitions = availableTransitions.filter(
    (t) => !returnTransitions.includes(t)
  );

  return (
    <Card className={`border shadow-xs bg-slate-900 text-white overflow-hidden ${className}`}>
      <CardContent className="p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <ArrowLeftRight className="w-4 h-4 text-emerald-400" />
          <span>Workflow Stage Transitions:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Return Transitions (Destructive/Amber) */}
          {returnTransitions.map((t) => (
            <Button
              key={t.transitionId}
              variant="outline"
              size="sm"
              disabled={isSubmitting || !t.isAllowed}
              onClick={() => onSelectTransition(t)}
              className="bg-transparent hover:bg-slate-800 text-amber-300 border-amber-500/40 hover:border-amber-400 text-xs font-medium h-8"
              title={t.disabledReason}
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1 text-amber-400" />
              {t.label}
            </Button>
          ))}

          {/* Forward Transitions (Emerald/Primary) */}
          {forwardTransitions.map((t) => (
            <Button
              key={t.transitionId}
              size="sm"
              disabled={isSubmitting || !t.isAllowed}
              onClick={() => onSelectTransition(t)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium h-8 shadow-xs"
              title={t.disabledReason}
            >
              <CheckCircle className="w-3.5 h-3.5 mr-1" />
              {t.label}
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
