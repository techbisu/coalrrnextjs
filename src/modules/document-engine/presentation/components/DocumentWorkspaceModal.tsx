'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, FileText, ChevronRight, ChevronLeft, PenTool, AlertCircle, X, Download } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DynamicForm } from './DynamicForm';
import { FilePreview } from '@/modules/file-management/components/FilePreview';
import { generateDocumentAction, startAndFetchWorkspaceAction } from '../actions';
import { cn } from '@/lib/utils';

interface DocumentWorkspaceModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  templateCode: string;
  businessId: string;
}

export function DocumentWorkspaceModal({ isOpen, onOpenChange, templateCode, businessId }: DocumentWorkspaceModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [instanceId, setInstanceId] = useState<string | null>(null);
  const [fileId, setFileId] = useState<string | null>(null);
  const [fields, setFields] = useState<any[]>([]);
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  useEffect(() => {
    if (isOpen && templateCode && businessId && !instanceId) {
      setLoading(true);
      startAndFetchWorkspaceAction(templateCode, businessId)
        .then(res => {
          if (res.success && res.instance) {
            setInstanceId(res.instance.id);
            setFileId(res.instance.generated_docx_path || null);
            setFields(res.fields || []);
            
            // If no fields, auto-generate doc if it doesn't exist yet
            if (res.fields?.length === 0 && !res.instance.generated_docx_path) {
              handleGenerate(res.instance.id);
            }
          } else {
            setError(res.error || "Failed to start workspace");
          }
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, templateCode, businessId]);

  const handleGenerate = async (idToUse = instanceId) => {
    if (!idToUse) return;
    setIsGenerating(true);
    const res = await generateDocumentAction(idToUse);
    if (res.success && res.fileId) {
      setFileId(res.fileId);
    } else {
      alert("Failed to generate document: " + res.error);
    }
    setIsGenerating(false);
  };

  const handleDownloadPdf = async () => {
    if (!fileId) return;
    setIsDownloadingPdf(true);
    try {
      const response = await fetch(`/api/files/${fileId}/download?format=pdf`);
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${templateCode}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error(err);
      alert('Failed to download PDF.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-none sm:max-w-none md:max-w-none w-screen h-screen m-0 p-0 rounded-none overflow-hidden flex flex-col bg-slate-50 border-0">
        
        {/* Header */}
        <header className="h-16 bg-white/95 backdrop-blur border-b flex items-center justify-between px-6 shrink-0 z-10 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-2 rounded-lg shadow-sm">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-lg tracking-tight text-slate-900 leading-tight">Document Workspace</h2>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-xs text-muted-foreground">Editing</span>
                <Badge variant="secondary" className="font-mono text-[9px] px-1.5 py-0 shadow-none h-4 bg-slate-100 text-slate-600">{templateCode}</Badge>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {fileId && (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleDownloadPdf} disabled={isDownloadingPdf} className="shadow-sm transition-all duration-200 bg-white text-blue-700 hover:text-blue-800 hover:bg-blue-50 border-blue-200">
                  {isDownloadingPdf ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                  Download PDF
                </Button>
                <Button size="sm" onClick={() => handleGenerate()} disabled={isGenerating} className="shadow-sm transition-all duration-200">
                  {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <PenTool className="w-4 h-4 mr-2" />}
                  Regenerate Document
                </Button>
              </div>
            )}
            
            <Separator orientation="vertical" className="h-8" />
            
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              title={sidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
              className="text-slate-500 hover:text-slate-900 bg-slate-50"
            >
              {sidebarOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </Button>
            
            <Separator orientation="vertical" className="h-6 mx-1" />
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => onOpenChange(false)}
              title="Close"
              className="text-slate-500 hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </header>

        {/* Body */}
        <div className="flex-1 flex overflow-hidden relative">
          
          {/* Left Area: Document Preview */}
          <div className="flex-1 h-full overflow-hidden bg-slate-100/50 flex flex-col relative">
            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="flex-1 flex items-center justify-center p-8">
                <Card className="max-w-md w-full border-destructive/20 shadow-sm">
                  <CardHeader className="text-center pb-4">
                    <div className="mx-auto bg-destructive/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-2">
                      <AlertCircle className="w-6 h-6 text-destructive" />
                    </div>
                    <CardTitle className="text-destructive">Workspace Error</CardTitle>
                    <CardDescription>{error}</CardDescription>
                  </CardHeader>
                </Card>
              </div>
            ) : fileId ? (
              <FilePreview 
                file_id={fileId} 
                mime_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
                original_name={`${templateCode}.docx`}
                className="flex-1 w-full h-full overflow-hidden"
              />
            ) : (
              <div className="flex-1 flex items-center justify-center p-8">
                <Card className="max-w-md w-full shadow-sm text-center border-slate-200/60 bg-white/50 backdrop-blur">
                  <CardContent className="pt-10 pb-8 flex flex-col items-center">
                    <div className="bg-primary/5 p-4 rounded-full mb-4">
                      <FileText className="w-10 h-10 text-primary/40" />
                    </div>
                    <h3 className="font-semibold text-xl mb-2 text-slate-800">No Document Generated Yet</h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      {fields.length > 0 
                        ? "Please fill out the required information in the sidebar and click Generate when ready."
                        : "Click the generate button below to create your document."}
                    </p>
                    <Button onClick={() => handleGenerate()} disabled={isGenerating} className="shadow-sm">
                      {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <PenTool className="w-4 h-4 mr-2" />}
                      Generate Document
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Right Area: Form & Signatures */}
          <div 
            className={cn(
              "h-full bg-slate-50/30 border-l shadow-[inset_1px_0_0_0_rgba(0,0,0,0.05)] transition-all duration-300 ease-in-out shrink-0 z-10 flex flex-col relative",
              sidebarOpen ? "w-[450px]" : "w-0 overflow-hidden opacity-0"
            )}
          >
            <ScrollArea className="flex-1">
              <div className="w-[450px] p-6 space-y-8 min-h-full">
                
                {/* Dynamic Form Section */}
                {fields.length > 0 && instanceId && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg tracking-tight text-slate-900">Additional Information</h3>
                      <p className="text-xs text-muted-foreground mt-1">Please fill the required fields to generate the final document.</p>
                    </div>
                    <Card className="shadow-sm overflow-hidden border-slate-200/60 bg-white">
                      <CardContent className="p-5">
                        <DynamicForm 
                          instanceId={instanceId} 
                          fields={fields} 
                          onSuccess={() => alert('Form data saved successfully!')} 
                        />
                      </CardContent>
                    </Card>
                  </div>
                )}
                
                {/* Signature Cards Section (Hidden because it was hardcoded mock data) */}
                {/* 
                  <div className="space-y-4">
                    ...mock data...
                  </div>
                */}
              </div>
            </ScrollArea>
          </div>
          
        </div>
      </DialogContent>
    </Dialog>
  );
}
