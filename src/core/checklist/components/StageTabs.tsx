'use client';

import * as React from 'react';
import { CheckCircle2, Clock, ShieldCheck } from 'lucide-react';
import { Badge } from '@/shared/components/ui/badge';
import type { ChecklistStageDTO } from '../usecases/GetChecklistStatusUseCase';

export interface StageTabsProps {
  stages: ChecklistStageDTO[];
  selectedStageCode: string;
  onSelectStage: (stageCode: string) => void;
  className?: string;
}

export function StageTabs({
  stages,
  selectedStageCode,
  onSelectStage,
  className = '',
}: StageTabsProps) {
  if (!stages || stages.length <= 1) return null;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-2">
        <ShieldCheck className="w-3.5 h-3.5 text-primary" />
        <span>Workflow Stage Context</span>
      </div>

      <div className="flex flex-wrap gap-2 p-1.5 bg-muted/40 rounded-xl border border-border/50">
        {stages.map((stage) => {
          const isSelected = stage.code === selectedStageCode;
          const isCompleted = stage.status === 'COMPLETED';
          const isCurrent = stage.status === 'CURRENT';

          return (
            <button
              key={stage.code}
              type="button"
              onClick={() => onSelectStage(stage.code)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                isSelected
                  ? 'bg-card text-foreground shadow-sm ring-1 ring-border'
                  : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
              }`}
            >
              {isCompleted && (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              )}
              {isCurrent && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
              )}

              <span>{stage.label}</span>

              {isCompleted && (
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] py-0 px-1.5 font-medium">
                  ✓ Completed
                </Badge>
              )}

              {isCurrent && (
                <Badge className="bg-amber-100 text-amber-900 border-amber-300 text-[10px] py-0 px-1.5 font-medium">
                  ● Current
                </Badge>
              )}

              {stage.items && (
                <span className="text-[10px] text-muted-foreground font-normal">
                  ({stage.items.length})
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
