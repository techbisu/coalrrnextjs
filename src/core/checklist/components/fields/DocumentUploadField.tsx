'use client'

import React, { useState } from 'react'
import { DocumentUploader } from '@/shared/components/coalrr'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { CheckCircle2, Download, RefreshCw, Lock } from 'lucide-react'

interface DocumentUploadFieldProps {
  ruleId: string;
  chkCode?: string;
  title: string;
  description?: string;
  isMandatory?: boolean;
  checkableType: string;
  checkableId: string;
  moduleCode: string;
  submission?: {
    status: string;
    documentId?: string;
    userInput?: any;
    updtTs?: string;
  } | null;
  onSubmit: (requirementId: string, documentId?: string, userInput?: any) => Promise<void>;
  readonly?: boolean;
}

export function DocumentUploadField({
  ruleId,
  chkCode,
  title,
  description,
  isMandatory,
  checkableType,
  checkableId,
  moduleCode,
  submission,
  onSubmit,
  readonly = false
}: DocumentUploadFieldProps) {
  const [isReplacing, setIsReplacing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSatisfied = submission?.status === 'SUBMITTED' || submission?.status === 'AUTO_SATISFIED' || submission?.status === 'APPROVED';
  const isInherited = submission?.status === 'AUTO_SATISFIED';

  const handleUploadComplete = async (doc: any) => {
    setIsSubmitting(true);
    try {
      await onSubmit(ruleId, doc.id || doc.file_id);
      setIsReplacing(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`p-4 rounded-xl border transition-all duration-200 ${
      isSatisfied
        ? 'bg-emerald-50/40 border-emerald-200/80 dark:bg-emerald-950/10 dark:border-emerald-900/40'
        : 'bg-card border-border shadow-sm hover:border-muted-foreground/30'
    }`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-foreground">{title}</span>
            <Badge variant="outline" className="bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800 text-[10px] py-0 h-4">
              Document Upload
            </Badge>
            {isMandatory && (
              <Badge variant="destructive" className="text-[10px] py-0 h-4 uppercase tracking-wider">
                Required
              </Badge>
            )}
            {isInherited && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-[10px] py-0 h-4 uppercase tracking-wider">
                Inherited
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

      <div className="pt-3 border-t border-border/60 mt-3">
        {isSatisfied && !isReplacing ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              {isInherited ? (
                'Inherited clearance from Project Master'
              ) : submission?.updtTs ? (
                `Uploaded on ${new Date(submission.updtTs).toLocaleDateString('en-IN', { dateStyle: 'medium' })}`
              ) : (
                'Document attached successfully'
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {submission?.documentId && (
                <Button variant="outline" size="sm" asChild className="h-8 text-xs bg-background">
                  <a href={`/api/files/${submission.documentId}/download`} target="_blank" rel="noreferrer">
                    <Download className="mr-1.5 h-3.5 w-3.5" />
                    Download File
                  </a>
                </Button>
              )}

              {readonly ? (
                <div className="flex items-center text-xs text-muted-foreground bg-muted px-2.5 py-1.5 rounded-md font-medium border border-border">
                  <Lock className="w-3 h-3 mr-1.5" />
                  Locked
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsReplacing(true)}
                  className="h-8 text-xs text-muted-foreground hover:text-foreground"
                >
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                  Replace
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {readonly ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 rounded-md bg-muted/50 border border-border">
                <Lock className="w-4 h-4" />
                <span>Cannot upload document: Baseline is locked.</span>
              </div>
            ) : (
              <>
                {isReplacing && (
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
                      Select a replacement file below:
                    </p>
                    <Button variant="ghost" size="sm" onClick={() => setIsReplacing(false)} className="h-6 text-xs">
                      Cancel
                    </Button>
                  </div>
                )}

                <DocumentUploader
                  checklist_item_key={chkCode || ruleId}
                  mode="single"
                  label="Select or upload document via FileManager"
                  entity_type={checkableType}
                  entity_id={checkableId}
                  module={moduleCode}
                  disabled={isSubmitting}
                  onChange={handleUploadComplete}
                />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
