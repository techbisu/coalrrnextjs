'use client'

import React, { useState, useEffect } from 'react'
import { SectionCard } from '@/shared/components/coalrr'
import { useQuery } from '@tanstack/react-query'
import { updateChecklistSubmission } from '@/app/actions/checklist.actions'
import { FileText, Loader2, AlertCircle } from 'lucide-react'
import { DocumentWorkspaceModal } from '@/shared/components/coalrr/DocumentWorkspaceModal'
import { ChecklistHeaderProgress } from './ChecklistHeaderProgress'
import { GeneratedFormsSection } from './sections/GeneratedFormsSection'
import { OperationalChecklistSection } from './sections/OperationalChecklistSection'
import { StageTabs } from './StageTabs'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { ACQ_LAND_SCHEDULE, MODULE_CODES } from '@/core/config/module-codes.config'
import type { ChecklistStageDTO } from '../usecases/GetChecklistStatusUseCase'

interface GenericChecklistWorkspaceProps {
  moduleCode?: string;
  checkableType?: string;
  checkableId: string;
  userId?: string;
  title?: string;
  description?: string;
  readonly?: boolean;
  action?: (isComplete: boolean) => React.ReactNode;
  onChanged?: () => void;
}

export function GenericChecklistWorkspace({
  moduleCode = MODULE_CODES.LAND_SCHEDULE,
  checkableType = ACQ_LAND_SCHEDULE,
  checkableId,
  userId,
  title = "Project Files & Statutory Clearances",
  description = "Dynamic rules engine managing operational compliance and legal document generation",
  readonly = false,
  action,
  onChanged
}: GenericChecklistWorkspaceProps) {
  const [docWorkspaceOpen, setDocWorkspaceOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [selectedContextId, setSelectedContextId] = useState<string | undefined>()
  const [selectedStageCode, setSelectedStageCode] = useState<string | null>(null)

  const openDocWorkspace = (templateCode: string, contextId?: string) => {
    setSelectedTemplate(templateCode)
    setSelectedContextId(contextId)
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

  // Sync selected stage on data load
  useEffect(() => {
    if (data?.currentStage?.code && !selectedStageCode) {
      setSelectedStageCode(data.currentStage.code);
    }
  }, [data, selectedStageCode]);

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
      if (onChanged) onChanged();
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

  const allItems = data.items;
  const stages: ChecklistStageDTO[] = data.stages || [];
  const currentStageCode = data.currentStage?.code || selectedStageCode;

  // Resolve currently active stage selection
  const activeStageObj = stages.find(s => s.code === (selectedStageCode || currentStageCode));
  const isSelectedStageReadOnly = readonly || (activeStageObj ? activeStageObj.isReadOnly : false);

  // If stage filtering is active, filter items for the selected stage
  const displayedItems = activeStageObj && activeStageObj.items
    ? activeStageObj.items
    : allItems;

  // Separate Generated Documents (Docx Engine) from Operational Items
  const isGeneratedDoc = (item: any) =>
    item.type === 'generated_document' ||
    item.type === 'GENERATED_DOCUMENT' ||
    item.inputSchema?.type === 'generated_document';

  const generatedForms = displayedItems.filter(isGeneratedDoc);
  const operationalItems = displayedItems.filter((item: any) => !isGeneratedDoc(item));

  // Overall Status Metrics — using authoritative `item.isSatisfied` from DTO
  const totalItems = allItems.length;
  const satisfiedItemsCount = allItems.filter((item: any) => item.isSatisfied === true).length;

  const mandatoryItems = allItems.filter((item: any) => item.isMandatory);
  const satisfiedMandatoryCount = mandatoryItems.filter((item: any) => item.isSatisfied === true).length;

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

        {/* Generic Stage Selection Tabs (Visible stages only: Historical Completed + Current) */}
        {stages.length > 1 && (
          <StageTabs
            stages={stages}
            selectedStageCode={selectedStageCode || currentStageCode}
            onSelectStage={(code) => setSelectedStageCode(code)}
          />
        )}

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
                readonly={isSelectedStageReadOnly}
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
              readonly={isSelectedStageReadOnly}
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
          contextId={selectedContextId}
        />
      )}
    </SectionCard>
  )
}
