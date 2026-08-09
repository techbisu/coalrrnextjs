'use client'

import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { FileText, Filter } from 'lucide-react'
import { DocumentUploadField } from '../fields/DocumentUploadField'
import { BooleanField } from '../fields/BooleanField'
import { TextInputField } from '../fields/TextInputField'
import { NumberInputField } from '../fields/NumberInputField'
import { DateField } from '../fields/DateField'
import { SelectField } from '../fields/SelectField'

interface OperationalChecklistSectionProps {
  items: any[];
  checkableType: string;
  checkableId: string;
  moduleCode: string;
  onSubmit: (requirementId: string, documentId?: string, userInput?: any) => Promise<void>;
  readonly?: boolean;
}

export function OperationalChecklistSection({
  items,
  checkableType,
  checkableId,
  moduleCode,
  onSubmit,
  readonly = false
}: OperationalChecklistSectionProps) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'satisfied'>('all');

  if (items.length === 0) return null;

  const satisfiedCount = items.filter(item => 
    item.submission?.status === 'SUBMITTED' || 
    item.submission?.status === 'AUTO_SATISFIED' || 
    item.submission?.status === 'APPROVED'
  ).length;

  const filteredItems = items.filter(item => {
    const isSatisfied = item.submission?.status === 'SUBMITTED' || item.submission?.status === 'AUTO_SATISFIED' || item.submission?.status === 'APPROVED';
    if (filter === 'pending') return !isSatisfied;
    if (filter === 'satisfied') return isSatisfied;
    return true;
  });

  const renderField = (item: any) => {
    const type = item.inputSchema?.type || item.type;

    if (type === 'document' || type === 'file' || !type) {
      return (
        <DocumentUploadField
          key={item.ruleId}
          ruleId={item.ruleId}
          chkCode={item.chkCode}
          title={item.title}
          description={item.description}
          isMandatory={item.isMandatory}
          checkableType={checkableType}
          checkableId={checkableId}
          moduleCode={moduleCode}
          submission={item.submission}
          onSubmit={onSubmit}
          readonly={readonly}
        />
      );
    }

    if (type === 'boolean') {
      return (
        <BooleanField
          key={item.ruleId}
          ruleId={item.ruleId}
          title={item.title}
          description={item.description}
          isMandatory={item.isMandatory}
          submission={item.submission}
          onSubmit={onSubmit}
          readonly={readonly}
        />
      );
    }

    if (type === 'text') {
      return (
        <TextInputField
          key={item.ruleId}
          ruleId={item.ruleId}
          title={item.title}
          description={item.description}
          isMandatory={item.isMandatory}
          submission={item.submission}
          onSubmit={onSubmit}
          readonly={readonly}
        />
      );
    }

    if (type === 'number') {
      return (
        <NumberInputField
          key={item.ruleId}
          ruleId={item.ruleId}
          title={item.title}
          description={item.description}
          isMandatory={item.isMandatory}
          submission={item.submission}
          onSubmit={onSubmit}
          readonly={readonly}
        />
      );
    }

    if (type === 'date') {
      return (
        <DateField
          key={item.ruleId}
          ruleId={item.ruleId}
          title={item.title}
          description={item.description}
          isMandatory={item.isMandatory}
          submission={item.submission}
          onSubmit={onSubmit}
          readonly={readonly}
        />
      );
    }

    if (type === 'select') {
      return (
        <SelectField
          key={item.ruleId}
          ruleId={item.ruleId}
          title={item.title}
          description={item.description}
          isMandatory={item.isMandatory}
          inputSchema={item.inputSchema}
          submission={item.submission}
          onSubmit={onSubmit}
          readonly={readonly}
        />
      );
    }

    // Default fallback to DocumentUploadField
    return (
      <DocumentUploadField
        key={item.ruleId}
        ruleId={item.ruleId}
        chkCode={item.chkCode}
        title={item.title}
        description={item.description}
        isMandatory={item.isMandatory}
        checkableType={checkableType}
        checkableId={checkableId}
        moduleCode={moduleCode}
        submission={item.submission}
        onSubmit={onSubmit}
      />
    );
  };

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="border-b border-border/60 pb-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-foreground">
                Operational Compliance & Document Clearances
              </CardTitle>
              <CardDescription className="text-xs">
                Physical file uploads via FileManager, statutory clearances, and typed data verification
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Tabs defaultValue="all" value={filter} onValueChange={(v) => setFilter(v as any)}>
              <TabsList className="h-8 text-xs">
                <TabsTrigger value="all" className="h-7 text-xs">All ({items.length})</TabsTrigger>
                <TabsTrigger value="pending" className="h-7 text-xs">Pending ({items.length - satisfiedCount})</TabsTrigger>
                <TabsTrigger value="satisfied" className="h-7 text-xs">Satisfied ({satisfiedCount})</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-5 space-y-4">
        {filteredItems.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground italic border rounded-lg bg-muted/20">
            No items found matching the selected filter ({filter}).
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredItems.map((item) => renderField(item))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
