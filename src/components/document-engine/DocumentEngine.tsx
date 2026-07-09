'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Download, Edit3, History, CheckCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useMutation, useQuery } from '@tanstack/react-query'

interface DocumentEngineProps {
  templateCode: string
  entityId: string
  dataProvider: () => Promise<Record<string, unknown>>
  workflowCode?: string
  options?: {
    preview?: boolean
    pdf?: boolean
    docx?: boolean
    signature?: boolean
    versioning?: boolean
  }
}

export function DocumentEngine({
  templateCode,
  entityId,
  dataProvider,
  workflowCode,
  options = { preview: true, pdf: true, docx: true, signature: true, versioning: true }
}: DocumentEngineProps) {
  const [activeTab, setActiveTab] = React.useState('generate')
  
  // Simulated fetch of document history/instance
  const { data: instance, isLoading: isInstanceLoading, refetch } = useQuery({
    queryKey: ['doc-instance', templateCode, entityId],
    queryFn: async () => {
      // In a real app, this fetches from GET /api/documents/instance?templateCode=X&entityId=Y
      // Mocking for frontend scaffolding:
      return null as any
    }
  })

  // Simulated generation mutation
  const generateMutation = useMutation({
    mutationFn: async (businessData: any) => {
      // Call POST /api/documents/generate
      // In this scaffold, we just pretend it succeeds
      await new Promise(r => setTimeout(r, 2000))
      return { documentId: `DOC-2026-${Math.floor(Math.random() * 9999)}`, version: 1 }
    },
    onSuccess: (data) => {
      toast.success(`Document Generated: ${data.documentId}`)
      if (options.preview) setActiveTab('preview')
      refetch()
    },
    onError: (e: any) => toast.error(`Generation Failed: ${e.message}`)
  })

  const handleGenerate = async () => {
    try {
      const data = await dataProvider()
      generateMutation.mutate(data)
    } catch (e: any) {
      toast.error(`Data Provider Error: ${e.message}`)
    }
  }

  const handleDownload = (type: 'pdf' | 'docx') => {
    if (!instance || !instance.versions || instance.versions.length === 0) {
      toast.error('No document generated yet')
      return
    }
    
    const latestVersion = instance.versions[0];
    const fileId = type === 'pdf' ? latestVersion.pdfFileId : latestVersion.docxFileId;
    
    if (!fileId) {
      toast.error(`${type.toUpperCase()} version is not available`)
      return;
    }

    window.location.href = `/api/files/${fileId}/download`
  }

  return (
    <div className="flex flex-col gap-4 border border-border bg-card text-card-foreground rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-500" />
            Document Engine
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Template: <span className="font-mono bg-muted px-1 py-0.5 rounded text-xs">{templateCode}</span>
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {options.docx && (
            <Button variant="outline" size="sm" onClick={() => handleDownload('docx')} disabled={!instance}>
              <Download className="h-4 w-4 mr-2" />
              DOCX
            </Button>
          )}
          {options.pdf && (
            <Button variant="default" size="sm" onClick={() => handleDownload('pdf')} disabled={!instance}>
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="generate">Generate / Form</TabsTrigger>
          <TabsTrigger value="preview" disabled={!options.preview}>Preview</TabsTrigger>
          <TabsTrigger value="workflow" disabled={!options.signature}>Workflow</TabsTrigger>
          <TabsTrigger value="history" disabled={!options.versioning}>History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="generate" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Merge & Generation</CardTitle>
              <CardDescription>
                Load business data and merge into the DOCX template.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleGenerate} 
                disabled={generateMutation.isPending}
                className="w-full sm:w-auto"
              >
                {generateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate Document
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {!instance ? (
                <div className="text-center text-muted-foreground py-10">
                  Document not generated yet.
                </div>
              ) : (
                <div className="border bg-muted/50 rounded flex items-center justify-center min-h-[400px]">
                  {/* Ideally, load an iframe pointing to PDF download or use react-doc-viewer */}
                  <iframe 
                    src={instance.versions?.[0]?.pdfFileId ? `/api/files/${instance.versions[0].pdfFileId}/download#toolbar=0` : ''} 
                    className="w-full h-[600px] border-0"
                    title="Document Preview"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workflow" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Signatures & Workflow</CardTitle>
            </CardHeader>
            <CardContent>
               <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded">
                    <div>
                      <div className="font-medium">Area Officer Approval</div>
                      <div className="text-sm text-muted-foreground">Pending your signature</div>
                    </div>
                    <Button variant="default">
                      <Edit3 className="w-4 h-4 mr-2" />
                      Sign Document
                    </Button>
                  </div>
               </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card>
             <CardHeader>
               <CardTitle>Version History</CardTitle>
             </CardHeader>
             <CardContent>
                <div className="space-y-4">
                   <div className="flex gap-4 p-4 border rounded">
                     <History className="text-muted-foreground w-5 h-5" />
                     <div>
                       <div className="font-medium">Version 1</div>
                       <div className="text-sm text-muted-foreground">Generated by System - Just now</div>
                     </div>
                   </div>
                </div>
             </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
