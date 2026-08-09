'use client'

import React, { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { CheckCircle2, Edit3, Send, Loader2, ListFilter, Lock } from 'lucide-react'

interface SelectFieldProps {
  ruleId: string;
  title: string;
  description?: string;
  isMandatory?: boolean;
  inputSchema?: {
    options?: Array<{ label: string; value: string }>;
    placeholder?: string;
  };
  submission?: {
    status: string;
    userInput?: any;
    updtTs?: string;
  } | null;
  onSubmit: (requirementId: string, documentId?: string, userInput?: any) => Promise<void>;
  readonly?: boolean;
}

export function SelectField({
  ruleId,
  title,
  description,
  isMandatory,
  inputSchema,
  submission,
  onSubmit,
  readonly = false
}: SelectFieldProps) {
  const existingValue = typeof submission?.userInput === 'string'
    ? submission.userInput
    : submission?.userInput?.selected || '';

  const options = inputSchema?.options || [];
  const [value, setValue] = useState(existingValue);
  const [isEditing, setIsEditing] = useState(!submission);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isSatisfied = submission?.status === 'SUBMITTED' || submission?.status === 'AUTO_SATISFIED' || submission?.status === 'APPROVED';

  const selectedOptionLabel = options.find(o => o.value === value)?.label || value;

  const handleSave = async () => {
    if (isMandatory && !value) {
      setErrorMsg('Please select an option');
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      await onSubmit(ruleId, undefined, { selected: value });
      setIsEditing(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`p-4 rounded-xl border transition-all duration-200 ${
      isSatisfied && !isEditing
        ? 'bg-emerald-50/40 border-emerald-200/80 dark:bg-emerald-950/10 dark:border-emerald-900/40'
        : 'bg-card border-border shadow-sm hover:border-slate-300'
    }`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-foreground">{title}</span>
            <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800 text-[10px] py-0 h-4">
              <ListFilter className="w-2.5 h-2.5 mr-1" />
              Choice Selection
            </Badge>
            {isMandatory && (
              <Badge variant="destructive" className="text-[10px] py-0 h-4 uppercase tracking-wider">
                Required
              </Badge>
            )}
          </div>
          {description && <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>}
        </div>

        {isSatisfied && !isEditing && (
          <Badge className="bg-emerald-500 text-white gap-1 shrink-0 text-xs">
            <CheckCircle2 className="w-3.5 h-3.5" /> Satisfied
          </Badge>
        )}
      </div>

      <div className="pt-3 border-t border-border/60 mt-3">
        {isSatisfied && !isEditing ? (
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                {selectedOptionLabel}
              </p>
              <span className="text-[11px] text-muted-foreground">
                Submitted on {submission?.updtTs ? new Date(submission.updtTs).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : 'system'}
              </span>
            </div>

            {readonly ? (
              <div className="flex items-center text-xs text-muted-foreground bg-muted px-2.5 py-1.5 rounded-md font-medium border border-border">
                <Lock className="w-3 h-3 mr-1.5" />
                Locked
              </div>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="h-8 text-xs text-muted-foreground">
                <Edit3 className="mr-1.5 h-3.5 w-3.5" /> Edit
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <Select value={value} onValueChange={(val) => {
              setValue(val);
              if (errorMsg) setErrorMsg(null);
            }}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder={inputSchema?.placeholder || "Select option..."} />
              </SelectTrigger>
              <SelectContent>
                {options.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {errorMsg && (
              <p className="text-xs text-destructive font-medium">{errorMsg}</p>
            )}

            <div className="flex justify-end gap-2 pt-1">
              {isSatisfied && (
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} className="h-8 text-xs">
                  Cancel
                </Button>
              )}
              {readonly ? (
                <div className="flex items-center text-xs text-muted-foreground bg-muted px-2.5 py-1.5 rounded-md font-medium border border-border">
                  <Lock className="w-3 h-3 mr-1.5" />
                  Locked
                </div>
              ) : (
                <Button size="sm" onClick={handleSave} disabled={isSubmitting || readonly} className="h-8 text-xs">
                  {isSubmitting ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Send className="mr-1.5 h-3.5 w-3.5" />}
                  Submit Selection
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
