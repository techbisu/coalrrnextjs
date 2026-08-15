'use client'

import React from 'react'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { FileText, CheckCircle2, Download, ExternalLink, Sparkles, Clock, Lock, PenTool, Edit3, ShieldCheck } from 'lucide-react'

interface GeneratedDocumentFieldProps {
  ruleId: string;
  title: string;
  description?: string;
  isMandatory?: boolean;
  inputSchema?: any;
  generatedDocInfo?: {
    instanceId?: string;
    templateCode: string;
    status: 'PENDING' | 'DRAFT' | 'INCOMPLETE' | 'COMPLETED' | 'QUEUED' | 'GENERATING' | 'FAILED' | string;
    generatedDocId?: string;
    stepDetails?: Array<{
      type: 'GENERATE' | 'ADDITIONAL_INFO' | 'REVIEW' | 'SIGN';
      status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING' | 'LOCKED';
      permission?: string;
      label: string;
    }>;
    nextAction?: {
      type: 'GENERATE' | 'ADDITIONAL_INFO' | 'REVIEW' | 'SIGN';
      permission?: string;
      label: string;
      canCurrentUserAct?: boolean;
    };
  };
  submission?: {
    status: string;
    documentId?: string;
    userInput?: any;
    updtTs?: string;
  } | null;
  onOpenWorkspace: (templateCode: string) => void;
  readonly?: boolean;
}

export function GeneratedDocumentField({
  ruleId,
  title,
  description,
  isMandatory,
  inputSchema,
  generatedDocInfo,
  submission,
  onOpenWorkspace,
  readonly = false
}: GeneratedDocumentFieldProps) {
  const templateCode = generatedDocInfo?.templateCode || inputSchema?.template_code || inputSchema?.templateCode || 'FORM_XXII';
  const docStatus = generatedDocInfo?.status || 'PENDING';
  
  const isGenerating = docStatus === 'QUEUED' || docStatus === 'GENERATING';
  const isFailed = docStatus === 'FAILED';
  const isSatisfied = docStatus === 'COMPLETED' || submission?.status === 'SUBMITTED' || submission?.status === 'AUTO_SATISFIED' || submission?.status === 'APPROVED';
  const isDraft = docStatus === 'DRAFT' || docStatus === 'INCOMPLETE';

  const nextAction = generatedDocInfo?.nextAction
  const stepDetails = generatedDocInfo?.stepDetails || []

  return (
    <div className={`p-4 rounded-xl border transition-all duration-200 ${
      isSatisfied
        ? 'bg-purple-50/40 border-purple-200/80 dark:bg-purple-950/10 dark:border-purple-900/40'
        : isGenerating || isDraft
        ? 'bg-amber-50/40 border-amber-200/80 dark:bg-amber-950/10 dark:border-amber-900/40'
        : isFailed
        ? 'bg-red-50/40 border-red-200/80 dark:bg-red-950/10 dark:border-red-900/40'
        : 'bg-card border-border shadow-sm hover:border-purple-300/50'
    }`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-foreground">{title}</span>
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800 text-[10px] py-0 h-4">
              <Sparkles className="w-2.5 h-2.5 mr-1" />
              Docx Engine Form
            </Badge>
            <Badge variant="secondary" className="font-mono text-[10px] bg-muted/60">
              {templateCode}
            </Badge>
            {isMandatory && (
              <Badge variant="destructive" className="text-[10px] py-0 h-4 uppercase tracking-wider">
                Required
              </Badge>
            )}
          </div>

          {/* Granular Step Progress Badges */}
          {stepDetails.length > 0 && (
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              {stepDetails.map((st, idx) => (
                <Badge
                  key={idx}
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0 font-normal h-4 gap-1 ${
                    st.status === 'COMPLETED'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : st.status === 'PENDING'
                      ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                      : 'bg-slate-100 text-slate-400 border-slate-200'
                  }`}
                >
                  {st.status === 'COMPLETED' ? '✓' : st.status === 'LOCKED' ? '🔒' : '⏳'} {st.type}
                </Badge>
              ))}
            </div>
          )}

          {description && <p className="text-xs text-muted-foreground leading-relaxed mt-1">{description}</p>}
        </div>

        <div>
          {isSatisfied ? (
            <Badge className="bg-emerald-500 text-white gap-1 shrink-0 text-xs">
              <CheckCircle2 className="w-3.5 h-3.5" /> Finalized & Complete
            </Badge>
          ) : isGenerating ? (
            <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 gap-1 text-xs animate-pulse">
              <Clock className="w-3.5 h-3.5 animate-spin text-amber-600" /> Generating...
            </Badge>
          ) : isFailed ? (
            <Badge variant="destructive" className="gap-1 text-xs">
              Generation Failed
            </Badge>
          ) : isDraft ? (
            <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 gap-1 text-xs">
              <Clock className="w-3.5 h-3.5" /> In Progress
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground text-xs">
              Not Started
            </Badge>
          )}
        </div>
      </div>

      <div className="pt-3 border-t border-border/60 mt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="text-xs text-muted-foreground flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <span>
            {isSatisfied
              ? 'Document compiled, reviewed & signed'
              : nextAction
              ? `Next Action Required: ${nextAction.label}`
              : 'Auto-populates domain fields into official .docx template'}
          </span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          {(generatedDocInfo?.generatedDocId || submission?.documentId) && (
            <Button variant="outline" size="sm" asChild className="h-8 text-xs bg-background">
              <a href={`/api/files/${generatedDocInfo?.generatedDocId || submission?.documentId}/download`} target="_blank" rel="noreferrer">
                <Download className="mr-1.5 h-3.5 w-3.5" />
                View File
              </a>
            </Button>
          )}

          {readonly ? (
            <div className="flex items-center text-xs text-muted-foreground bg-muted px-2.5 py-1.5 rounded-md font-medium border border-border">
              <Lock className="w-3 h-3 mr-1.5" />
              Locked
            </div>
          ) : (
            <>
              {/* Direct Next Action Button */}
              {nextAction && nextAction.canCurrentUserAct !== false && (
                <Button
                  size="sm"
                  onClick={() => onOpenWorkspace(templateCode)}
                  className={`h-8 text-xs ${
                    nextAction.type === 'GENERATE' ? 'bg-purple-600 hover:bg-purple-700 text-white' :
                    nextAction.type === 'ADDITIONAL_INFO' ? 'bg-blue-600 hover:bg-blue-700 text-white' :
                    nextAction.type === 'REVIEW' ? 'bg-indigo-600 hover:bg-indigo-700 text-white' :
                    'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  {nextAction.type === 'GENERATE' ? <PenTool className="mr-1.5 h-3.5 w-3.5" /> :
                   nextAction.type === 'ADDITIONAL_INFO' ? <Edit3 className="mr-1.5 h-3.5 w-3.5" /> :
                   nextAction.type === 'REVIEW' ? <ShieldCheck className="mr-1.5 h-3.5 w-3.5" /> :
                   <PenTool className="mr-1.5 h-3.5 w-3.5" />}
                  {nextAction.label}
                </Button>
              )}

              {/* Workspace Trigger Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenWorkspace(templateCode)}
                className="h-8 text-xs bg-background"
              >
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                Open Workspace
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
