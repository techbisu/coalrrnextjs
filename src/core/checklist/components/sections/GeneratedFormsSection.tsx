'use client'

import React from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Sparkles, FileText } from 'lucide-react'
import { GeneratedDocumentField } from '../fields/GeneratedDocumentField'

interface GeneratedFormsSectionProps {
  items: any[];
  onOpenWorkspace: (templateCode: string, contextId?: string) => void;
  readonly?: boolean;
}

export function GeneratedFormsSection({ items, onOpenWorkspace, readonly = false }: GeneratedFormsSectionProps) {
  if (items.length === 0) return null;

  // Use the authoritative `isSatisfied` field from the checklist DTO — single source of truth
  const completedCount = items.filter(item => item.isSatisfied === true).length;

  return (
    <Card className="border-purple-200/80 dark:border-purple-900/40 bg-gradient-to-br from-purple-50/20 via-card to-card shadow-sm overflow-hidden">
      <CardHeader className="border-b border-purple-100 dark:border-purple-900/30 pb-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-foreground">
                Generated Forms & Statutory Documents
              </CardTitle>
              <CardDescription className="text-xs">
                Official legal templates projected & compiled via the Docx Engine Service
              </CardDescription>
            </div>
          </div>

          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 font-mono text-xs">
            {completedCount} of {items.length} Finalized
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-5 space-y-4">
        <div className="grid gap-4">
          {items.map((item) => (
            <GeneratedDocumentField
              key={item.ruleId}
              ruleId={item.ruleId}
              title={item.title}
              description={item.description}
              isMandatory={item.isMandatory}
              inputSchema={item.inputSchema}
              generatedDocInfo={item.generatedDocInfo}
              submission={item.submission}
              onOpenWorkspace={(templateCode) => onOpenWorkspace(templateCode, item.contextId)}
              readonly={readonly}
              isSatisfied={item.isSatisfied}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
