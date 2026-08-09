'use client'

import React, { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { CheckCircle2, ShieldCheck, Loader2, Lock } from 'lucide-react'

interface BooleanFieldProps {
  ruleId: string;
  title: string;
  description?: string;
  isMandatory?: boolean;
  submission?: {
    status: string;
    userInput?: any;
    updtTs?: string;
  } | null;
  onSubmit: (requirementId: string, documentId?: string, userInput?: any) => Promise<void>;
  readonly?: boolean;
}

export function BooleanField({
  ruleId,
  title,
  description,
  isMandatory,
  submission,
  onSubmit,
  readonly = false
}: BooleanFieldProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSatisfied = submission?.status === 'SUBMITTED' || submission?.status === 'AUTO_SATISFIED' || submission?.status === 'APPROVED';

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit(ruleId, undefined, { confirmed: true, timestamp: new Date().toISOString() });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`p-4 rounded-xl border transition-all duration-200 ${
      isSatisfied
        ? 'bg-emerald-50/40 border-emerald-200/80 dark:bg-emerald-950/10 dark:border-emerald-900/40'
        : 'bg-card border-border shadow-sm hover:border-emerald-200'
    }`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-foreground">{title}</span>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800 text-[10px] py-0 h-4">
              System Check
            </Badge>
            {isMandatory && (
              <Badge variant="destructive" className="text-[10px] py-0 h-4 uppercase tracking-wider">
                Required
              </Badge>
            )}
          </div>
          {description && <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>}
        </div>

        {isSatisfied && (
          <Badge className="bg-emerald-500 text-white gap-1 shrink-0 text-xs">
            <CheckCircle2 className="w-3.5 h-3.5" /> Satisfied
          </Badge>
        )}
      </div>

      <div className="pt-3 border-t border-border/60 mt-3 flex items-center justify-between gap-3">
        <div className="text-xs text-muted-foreground flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>
            {isSatisfied
              ? `Confirmed compliance on ${submission?.updtTs ? new Date(submission.updtTs).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : 'system'}`
              : 'Requires formal auditor / officer confirmation'}
          </span>
        </div>

        <div>
          {!isSatisfied && (
            readonly ? (
              <div className="flex items-center text-xs text-muted-foreground bg-muted px-2.5 py-1.5 rounded-md font-medium border border-border">
                <Lock className="w-3 h-3 mr-1.5" />
                Locked
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleConfirm}
                disabled={isSubmitting}
                className="h-8 text-xs bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800"
              >
                {isSubmitting ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                )}
                Confirm Requirement
              </Button>
            )
          )}
        </div>
      </div>
    </div>
  )
}
