'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Loader2, FileText, ChevronRight, ChevronLeft, PenTool, AlertCircle, X, Download, CheckCircle2, ChevronDown, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Separator } from '@/shared/components/ui/separator';
import { DynamicForm } from './DynamicForm';
import { FilePreview } from '@/modules/file-management/components/FilePreview';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface DocumentWorkspaceModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  templateCode: string;
  businessId: string;
  extraData?: Record<string, any>;
}

export function DocumentWorkspaceModal({ isOpen, onOpenChange, templateCode, businessId, extraData }: DocumentWorkspaceModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [instanceId, setInstanceId] = useState<string | null>(null);
  const [fileId, setFileId] = useState<string | null>(null);
  const [fields, setFields] = useState<any[]>([]);
  const [savedValues, setSavedValues] = useState<Record<string, any>>({});
  
  const [signatureRules, setSignatureRules] = useState<any[]>([]);
  const [appliedSignatures, setAppliedSignatures] = useState<any[]>([]);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [userName, setUserName] = useState<string>('');
  const [signatureInput, setSignatureInput] = useState<string>('');
  const [isSigning, setIsSigning] = useState<boolean>(false);

  const [isFormCollapsed, setIsFormCollapsed] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setInstanceId(null);
      setFileId(null);
      setFields([]);
      setSavedValues({});
      setSignatureRules([]);
      setAppliedSignatures([]);
      setUserRoles([]);
      setUserPermissions([]);
      setSignatureInput('');
      setIsFormCollapsed(false);
      setError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && templateCode && businessId) {
      setLoading(true);
      setError(null);
      fetch('/api/document-engine/workspace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateCode, applicationId: businessId, extraData })
      })
        .then(res => res.json())
        .then(res => {
          if (res.success && res.instance) {
            setInstanceId(res.instance.id);
            setFileId(res.instance.generated_docx_path || null);
            setFields(res.fields || []);
            setSavedValues((res.instance.form_data as Record<string, any>) || {});
            setSignatureRules(res.signatures || []);
            setAppliedSignatures(res.instance.signature_data || []);
            setUserRoles(res.userRoles || []);
            setUserPermissions(res.userPermissions || []);
            setUserName(res.userName || res.userEmail || 'Authorized Signee');

            const noFields = !res.fields || res.fields.length === 0;
            if (noFields) {
              setSidebarOpen(false);
              if (!res.instance.generated_docx_path) {
                handleGenerate(res.instance.id);
              }
            } else {
              setSidebarOpen(true);
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
    try {
      const res = await fetch('/api/document-engine/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceId: idToUse })
      });
      const data = await res.json();
      if (data.success && data.fileId) {
        setFileId(data.fileId);
      } else {
        alert("Failed to generate document: " + data.error);
      }
    } catch (err: any) {
      alert("Failed to generate document: " + err.message);
    }
    setIsGenerating(false);
  };

  const handleSignDocument = async (roleToSign: string) => {
    if (!instanceId) return;
    const signText = signatureInput.trim() || userName || 'Signed & Vetted';
    setIsSigning(true);
    try {
      const res = await fetch('/api/document-engine/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceId, role: roleToSign, signatureText: signText })
      });
      const data = await res.json();
      if (data.success && data.fileId) {
        toast.success(`Document signed as ${roleToSign.replace(/_/g, ' ')}`);
        setFileId(data.fileId);
        setAppliedSignatures(data.signatures || []);
        setSignatureInput('');
      } else {
        toast.error(data.error || 'Failed to sign document');
      }
    } catch (err: any) {
      toast.error('Signing error: ' + err.message);
    } finally {
      setIsSigning(false);
    }
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

  // Check dynamic signature permission: document.sign OR workflow.approve OR proposal.approve OR officer/admin role
  const hasSigningPermission = 
    userPermissions.includes('document.sign') ||
    userPermissions.includes('workflow.approve') ||
    userPermissions.includes('proposal.approve') ||
    userRoles.some(r => {
      const rl = r.toLowerCase();
      return rl.includes('admin') || rl.includes('super') || rl.includes('officer') || rl.includes('clerk') || rl.includes('surveyor') || rl.includes('gm');
    });

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
              "h-full bg-slate-50/30 border-l shadow-[inset_1px_0_0_0_rgba(0,0,0,0.05)] transition-all duration-300 ease-in-out shrink-0 z-10 flex flex-col relative overflow-hidden",
              sidebarOpen ? "w-[450px]" : "w-0 overflow-hidden opacity-0"
            )}
          >
            <div className="flex-1 overflow-y-auto p-6 space-y-6 max-h-full [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded">
              
              {/* Dynamic Form Section (Collapsible) */}
              {fields.length > 0 && instanceId && (
                <Card className="shadow-sm overflow-hidden border-slate-200/60 bg-white transition-all duration-200">
                  <CardHeader 
                    className="p-4 bg-slate-50/80 border-b flex flex-row items-center justify-between cursor-pointer hover:bg-slate-100/80 transition-colors select-none"
                    onClick={() => setIsFormCollapsed(!isFormCollapsed)}
                  >
                    <div>
                      <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                        <span>Additional Information</span>
                        {isFormCollapsed && <Badge variant="outline" className="text-[10px] text-emerald-700 bg-emerald-50 border-emerald-200 font-normal">Submitted</Badge>}
                      </CardTitle>
                      <CardDescription className="text-xs mt-0.5">
                        {isFormCollapsed ? "Click to expand and modify form fields" : "Required inputs for generating document placeholders"}
                      </CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 shrink-0">
                      {isFormCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4 rotate-90" />}
                    </Button>
                  </CardHeader>
                  
                  {!isFormCollapsed && (
                    <CardContent className="p-5">
                      <DynamicForm 
                        instanceId={instanceId} 
                        fields={fields}
                        defaultValues={savedValues}
                        onSuccess={() => {
                          toast.success('Form saved successfully. Auto-collapsing section…');
                          setIsFormCollapsed(true);
                          handleGenerate();
                        }} 
                      />
                    </CardContent>
                  )}
                </Card>
              )}

              {/* Authorized Signatures & Vetting Section (Sequential Role-Based Execution) */}
              {signatureRules.length > 0 && (
                <Card className="shadow-sm overflow-hidden border-blue-200/80 bg-white">
                  <CardHeader className="p-4 bg-blue-50/60 border-b border-blue-100">
                    <CardTitle className="text-base font-semibold text-blue-950 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-blue-600" />
                        <span>Workflow Signatures</span>
                      </div>
                      <Badge variant="outline" className="bg-white text-blue-800 border-blue-200 text-xs font-mono">
                        {appliedSignatures.length}/{signatureRules.length} Signed
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-xs text-blue-800 mt-1">
                      Sequential approval workflow ({templateCode}). Previous signatures must be completed before next role can sign.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3">
                    {(() => {
                      // Sort rules by display_order sequentially
                      const sortedRules = [...signatureRules].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
                      
                      return sortedRules.map((rule: any, index: number) => {
                        const isSigned = appliedSignatures.some((s: any) => s.role === rule.role);
                        const signedEntry = appliedSignatures.find((s: any) => s.role === rule.role);

                        // Check if all previous required steps are completed
                        let isUnlocked = true;
                        let blockedByRole = '';
                        for (let k = 0; k < index; k++) {
                          const prev = sortedRules[k];
                          const prevPerm = prev.sig_permission || prev.role;
                          if (prev.is_required && !appliedSignatures.some((s: any) => (s.sig_permission || s.role) === prevPerm)) {
                            isUnlocked = false;
                            blockedByRole = prevPerm;
                            break;
                          }
                        }

                        // rule.sig_permission maintains the exact permission name (e.g. form_xxii.sign.area_land_cell_member)
                        const permName = rule.sig_permission || rule.role;
                        const labelText = permName.includes('.sign.') 
                          ? permName.split('.sign.')[1].replace(/_/g, ' ') 
                          : permName.replace(/_/g, ' ');
                        
                        const canCurrentUserSign = 
                          userPermissions.includes(permName) ||
                          userPermissions.includes('document.sign') ||
                          userPermissions.includes('*') ||
                          userRoles.some((ur: string) => {
                            const urClean = ur.toLowerCase().replace(/[^a-z0-9]/g, '');
                            return urClean.includes('admin') || urClean.includes('super');
                          });

                        return (
                          <div 
                            key={rule.id || rule.role} 
                            className={cn(
                              "p-3.5 rounded-lg border transition-all flex flex-col gap-2",
                              isSigned 
                                ? "border-emerald-200 bg-emerald-50/40" 
                                : isUnlocked && canCurrentUserSign
                                  ? "border-blue-300 bg-blue-50/30 shadow-sm ring-1 ring-blue-400/20"
                                  : isUnlocked
                                    ? "border-slate-200 bg-slate-50/50"
                                    : "border-slate-200 bg-slate-100/60 opacity-75"
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-mono text-[10px] flex items-center justify-center font-bold">
                                  {index + 1}
                                </span>
                                <span className="font-semibold text-xs text-slate-800 uppercase tracking-wide">
                                  {labelText}
                                </span>
                              </div>

                              {isSigned ? (
                                <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 text-[10px] gap-1 font-normal border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Signed
                                </Badge>
                              ) : !isUnlocked ? (
                                <Badge variant="outline" className="text-[10px] text-slate-500 border-slate-300 bg-slate-200/50 font-normal">
                                  Locked (Step {index} Pending)
                                </Badge>
                              ) : canCurrentUserSign ? (
                                <Badge className="bg-blue-600 text-white text-[10px] font-normal animate-pulse">
                                  Action Required
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[10px] text-amber-700 border-amber-300 bg-amber-50 font-normal">
                                  Awaiting Signee
                                </Badge>
                              )}
                            </div>

                            {/* Status Body */}
                            {isSigned && signedEntry ? (
                              <div className="text-[11px] text-slate-600 bg-white/80 p-2.5 rounded border border-emerald-100 mt-1">
                                <div className="font-medium text-slate-900"><span className="text-slate-500 font-normal">Signed by:</span> {signedEntry.signatureText || signedEntry.userName}</div>
                                <div className="text-[10px] text-muted-foreground mt-0.5">Timestamp: {new Date(signedEntry.signedAt).toLocaleString('en-IN')}</div>
                              </div>
                            ) : !isUnlocked ? (
                              <p className="text-[11px] text-slate-500 italic mt-0.5 flex items-center gap-1">
                                <span>🔒 Unlocks after step {index} signature.</span>
                              </p>
                            ) : canCurrentUserSign ? (
                              <div className="space-y-2 mt-1 pt-2 border-t border-blue-200/60">
                                <div className="text-[11px] text-slate-600 bg-blue-50/70 p-2 rounded border border-blue-200/60 flex items-center justify-between">
                                  <span className="text-slate-500 text-[10px]">Authenticated Signee:</span>
                                  <span className="font-medium text-slate-900 text-xs">{userName}</span>
                                </div>
                                <Button 
                                  size="sm" 
                                  className="w-full text-xs bg-blue-700 hover:bg-blue-800 text-white h-8 shadow-sm font-medium"
                                  disabled={isSigning}
                                  onClick={() => handleSignDocument(rule.role)}
                                >
                                  {isSigning ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <PenTool className="w-3.5 h-3.5 mr-1.5" />}
                                  Sign Document as {labelText}
                                </Button>
                              </div>
                            ) : (
                              <p className="text-[11px] text-slate-500 italic mt-0.5">
                                Requires permission <code className="bg-slate-200/80 px-1 py-0.5 rounded font-mono text-[10px] text-slate-700">{permName}</code> to sign this step.
                              </p>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </CardContent>
                </Card>
              )}
              
            </div>
          </div>
          
        </div>
      </DialogContent>
    </Dialog>
  );
}

