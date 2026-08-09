'use client'

import React, { useState } from 'react'
import { SectionCard } from '@/shared/components/coalrr'
import { useQuery } from '@tanstack/react-query'
import { updateChecklistSubmission } from '@/app/actions/checklist.actions'
import { FileText, Loader2, AlertCircle } from 'lucide-react'
import { DocumentWorkspaceModal } from '@/shared/components/coalrr/DocumentWorkspaceModal'
import { ChecklistHeaderProgress } from './ChecklistHeaderProgress'
import { GeneratedFormsSection } from './sections/GeneratedFormsSection'
import { OperationalChecklistSection } from './sections/OperationalChecklistSection'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { ACQ_LAND_SCHEDULE, MODULE_CODES } from '@/core/config/module-codes.config'

interface GenericChecklistWorkspaceProps {
  moduleCode?: string;
  checkableType?: string;
  checkableId: string;
  userId?: string;
  title?: string;
  description?: string;
  readonly?: boolean;
  action?: (isComplete: boolean) => React.ReactNode;
}

export function GenericChecklistWorkspace({
  moduleCode = MODULE_CODES.LAND_SCHEDULE,
  checkableType = ACQ_LAND_SCHEDULE,
  checkableId,
  userId,
  title = "Project Files & Statutory Clearances",
  description = "Dynamic rules engine managing operational compliance and legal document generation",
  readonly = false,
  action
}: GenericChecklistWorkspaceProps) {
  const [docWorkspaceOpen, setDocWorkspaceOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'generated' | 'operational'>('generated')

  const openDocWorkspace = (templateCode: string) => {
    setSelectedTemplate(templateCode)
    setDocWorkspaceOpen(true)
  }

  const { data, isLoading: loading, refetch, isError, error } = useQuery({
    queryKey: ['checklist', moduleCode, checkableType, checkableId],
    queryFn: async () => {
      console.log('[ChecklistWorkspace] fetching via REST for', checkableId);
      const res = await fetch(`/api/checklists/status?moduleCode=${moduleCode}&checkableType=${checkableType}&checkableId=${checkableId}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to fetch checklist');
      }
      return await res.json();
    },
    enabled: !!checkableId
  })

  const handleSubmitRequirement = async (requirementId: string, documentId?: string, userInput?: any) => {
    try {
      await updateChecklistSubmission({
        moduleCode,
        requirementId,
        checkableType,
        checkableId,
        documentId,
        userInput
      });
      await refetch();
    } catch (err) {
      console.error('Error submitting checklist requirement:', err);
    }
  }

  if (loading) return (
    <SectionCard title={title} icon={FileText} description={description}>
      <div className="flex items-center justify-center gap-3 p-12 text-sm text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span>Loading dynamic checklist & resolving compliance rules... ({checkableId})</span>
      </div>
    </SectionCard>
  )

  if (isError) return (
    <SectionCard title={title} icon={FileText} description={description}>
      <div className="flex items-center gap-3 p-6 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
        <AlertCircle className="h-5 w-5 shrink-0" />
        <div>
          <p className="font-semibold">Error loading checklist</p>
          <p className="text-xs opacity-90">{error?.message || 'Unknown error occurred while resolving checklist context'}</p>
        </div>
      </div>
    </SectionCard>
  )

  if (!data || !Array.isArray(data.items)) return (
    <SectionCard title={title} icon={FileText} description={description}>
      <div className="p-6 text-sm text-muted-foreground text-center">
        No checklist rules configured for module: <code className="font-mono">{moduleCode}</code>
      </div>
    </SectionCard>
  )

  const items = data.items;

  // Separate Generated Documents (Docx Engine) from Operational Items
  const generatedForms = items.filter((item: any) =>
    item.inputSchema?.type === 'generated_document' ||
    item.type === 'generated_document' ||
    item.inputSchema?.template_code ||
    item.inputSchema?.templateCode
  );

  const operationalItems = items.filter((item: any) =>
    item.inputSchema?.type !== 'generated_document' &&
    item.type !== 'generated_document' &&
    !item.inputSchema?.template_code &&
    !item.inputSchema?.templateCode
  );

  // Status Metrics
  const totalItems = items.length;
  const satisfiedItemsCount = items.filter((item: any) =>
    item.submission?.status === 'SUBMITTED' ||
    item.submission?.status === 'AUTO_SATISFIED' ||
    item.submission?.status === 'APPROVED' ||
    item.generatedDocInfo?.status === 'COMPLETED'
  ).length;

  const mandatoryItems = items.filter((item: any) => item.isMandatory);
  const satisfiedMandatoryCount = mandatoryItems.filter((item: any) =>
    item.submission?.status === 'SUBMITTED' ||
    item.submission?.status === 'AUTO_SATISFIED' ||
    item.submission?.status === 'APPROVED' ||
    item.generatedDocInfo?.status === 'COMPLETED'
  ).length;

  const isComplete = mandatoryItems.length === 0 || satisfiedMandatoryCount === mandatoryItems.length;

  return (
    <SectionCard title={title} icon={FileText} description={description}>
      <div className="space-y-6">
        {/* Header Progress Banner */}
        <ChecklistHeaderProgress
          totalItems={totalItems}
          satisfiedItemsCount={satisfiedItemsCount}
          mandatoryItemsCount={mandatoryItems.length}
          satisfiedMandatoryCount={satisfiedMandatoryCount}
          generatedFormsCount={generatedForms.length}
          operationalItemsCount={operationalItems.length}
        />

        {/* Dual Section Tabs */}
        <Tabs defaultValue={generatedForms.length > 0 ? "generated" : "operational"} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 p-1 bg-muted/60 rounded-xl">
            <TabsTrigger
              value="generated"
              className="rounded-lg text-xs font-semibold py-2.5 data-[state=active]:bg-card data-[state=active]:shadow-sm"
              disabled={generatedForms.length === 0}
            >
              Docx Generated Forms ({generatedForms.length})
            </TabsTrigger>

            <TabsTrigger
              value="operational"
              className="rounded-lg text-xs font-semibold py-2.5 data-[state=active]:bg-card data-[state=active]:shadow-sm"
            >
              Operational Clearances & Uploads ({operationalItems.length})
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Docx Engine Generated Forms */}
          {generatedForms.length > 0 && (
            <TabsContent value="generated" className="mt-0 focus-visible:outline-none">
              <GeneratedFormsSection
                items={generatedForms}
                onOpenWorkspace={openDocWorkspace}
                readonly={readonly}
              />
            </TabsContent>
          )}

          {/* Tab 2: Operational Compliance & FileManager Uploads */}
          <TabsContent value="operational" className="mt-0 focus-visible:outline-none">
            <OperationalChecklistSection
              items={operationalItems}
              checkableType={checkableType}
              checkableId={checkableId}
              moduleCode={moduleCode}
              onSubmit={handleSubmitRequirement}
              readonly={readonly}
            />
          </TabsContent>
        </Tabs>

        {action && (
          <div className="pt-4 border-t border-border">
            {action(isComplete)}
          </div>
        )}
      </div>

      {/* Docx Engine Workspace Modal */}
      {docWorkspaceOpen && selectedTemplate && (
        <DocumentWorkspaceModal
          isOpen={docWorkspaceOpen}
          onOpenChange={(open) => {
            setDocWorkspaceOpen(open)
            if (!open) {
              refetch()
            }
          }}
          templateCode={selectedTemplate}
          businessId={checkableId}
        />
      )}
    </SectionCard>
  )
}
