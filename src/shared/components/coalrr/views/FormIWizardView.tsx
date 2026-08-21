"use client";
/** FormIWizardView — Citizen Intake & Statutory Registry */

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  SectionCard,
  WizardShell,
  DataTable,
  StateBadge,
  DocumentUploader,
  LandLoserKycStep,
  FormIStatutoryDocumentView,
  DocumentWorkspaceModal,
} from "@/shared/components/coalrr";
import type { Column, UploadedDoc } from "@/shared/components/coalrr";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/utils/formatters";
import { getDisplayPlotNo } from "@/shared/utils/plot.utils";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Badge } from "@/shared/components/ui/badge";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Dialog, DialogContent } from "@/shared/components/ui/dialog";
import {
  StateSelect,
  DistrictSelect,
  BlockSelect,
  MouzaSelect,
  CasteSelect,
} from "@/shared/components/coalrr/selects";
import { toast } from "sonner";
import {
  FileText,
  ShieldCheck,
  MapPin,
  IndianRupee,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  Eye,
  PenTool,
  Plus,
  Trash2,
  Camera,
  Search,
  FileCheck,
  UploadCloud,
  X,
  Pencil,
  ArrowLeft,
  Paperclip,
  Download,
  Lock,
} from "lucide-react";
import { useMasterQuery, MasterLookup } from "@/core/master-lookup";

interface Claim {
  id: string;
  claim_code: string;
  claimant_name: string;
  father_husband_name?: string;
  present_address?: string;
  permanent_address?: string;
  epic_no?: string;
  citizen_id_hash?: string;
  occupation?: string;
  gender?: string;
  nationality?: string;
  religion?: string;
  caste_category?: string;
  photo_doc_id?: string;
  magistrate_affidavit_doc_id?: string;
  passbook_doc_id?: string;
  title_deed_doc_id?: string;
  signed_form_i_doc_id?: string;
  plot_id: string;
  plot_number: string;
  mouza: string;
  state_lgd?: string;
  district_lgd?: string;
  block_lgd?: string;
  mouza_lgd?: string;
  pincode?: string;
  land_type: string;
  own_share_acres: number | string;
  plots?: any[];
  form_i_claim_plot?: any[];
  plot_count?: number;
  khatian_no?: string;
  link_deed_no?: string;
  ownership_date?: string;
  transferor_name?: string;
  acquisition_mode_offered?: string;
  opted_monetary_in_lieu_of_employment: boolean;
  bank_name?: string;
  bank_branch?: string;
  bank_account_number?: string;
  bank_ifsc?: string;
  prior_compensation_received?: boolean;
  prior_compensation_details?: string;
  prior_employment_linked?: boolean;
  prior_employment_details?: string;
  is_free_from_disputes?: boolean;
  dispute_details?: string;
  is_free_from_encumbrances?: boolean;
  encumbrance_details?: string;
  can_handover_possession?: boolean;
  possession_reason?: string;
  monetary_opt_reason?: string;
  form_v_eligible?: boolean;
  state: string;
  ecl_approval_status?: string;
  ecl_approved_at?: string | null;
  submitted_at: string | null;
  transparency_window_ends_at: string | null;
  daysRemaining: number | null;
  entry_ts: string;
}

export interface PlotItem {
  id: string;
  plot_no?: string;
  plot_number: string;
  mouza: string;
  mouza_lgd?: string;
  state_lgd?: string;
  district_lgd?: string;
  block_lgd?: string;
  notification_no?: string;
  area_acres: string;
  land_type: string;
}

export interface PlotEntry {
  plot_id: string;
  plot_no: string;
  mouza_name?: string;
  state_lgd?: string;
  mouza_lgd?: string;
  khatian_no: string;
  own_share_acres: string;
  total_ror_area: string;
  opted_monetary_in_lieu_of_employment: boolean;
}

async function fetchClaims(): Promise<Claim[]> {
  const r = await fetch("/api/claims");
  if (!r.ok) throw new Error("Failed to load claims");
  return r.json();
}

async function fetchPlots(): Promise<PlotItem[]> {
  const r = await fetch("/api/plots");
  if (!r.ok) throw new Error("Failed to load plots");
  return r.json();
}

export function getCleanOnlyPlotNo(
  plotItem?: any,
  stateLgd?: string | number | null,
  mouzaLgd?: string | number | null
): string {
  if (!plotItem) return "—";

  let rawStr = "";
  let plotTy = "";
  if (typeof plotItem === "object") {
    rawStr = String(
      plotItem.plot_number || plotItem.plot_no || plotItem.display_plot_no || ""
    ).trim();
    plotTy = String(plotItem.plot_ty || plotItem.land_type || "").trim();
    if (!stateLgd) stateLgd = plotItem.state_lgd || plotItem.district_lgd;
    if (!mouzaLgd) mouzaLgd = plotItem.mouza_lgd;
  } else {
    rawStr = String(plotItem).trim();
  }

  if (!rawStr) return "—";

  let str = rawStr;

  // 1. Strip "Plot #" or "PlotNo" or "Plot " prefixes
  str = str.replace(/^Plot\s*(#|No\.?|Number)?\s*/i, "").trim();

  // 2. Strip explicit State LGD & Mouza LGD prefixes if provided
  const sLgd = stateLgd ? String(stateLgd) : "";
  const mLgd = mouzaLgd ? String(mouzaLgd) : "";

  if (sLgd && mLgd && str.startsWith(`${sLgd}${mLgd}`)) {
    str = str.slice(`${sLgd}${mLgd}`.length);
  } else if (mLgd && str.startsWith(mLgd)) {
    str = str.slice(mLgd.length);
  } else if (sLgd && str.startsWith(sLgd)) {
    str = str.slice(sLgd.length);
  }

  // 3. Handle slash, underscore, or hyphen delimited formats e.g. "19/101/1/12" or "19_101_1_12" or "19-101-1-12"
  if (str.includes("/")) {
    const parts = str.split("/").map((p) => p.trim()).filter(Boolean);
    str = parts[parts.length - 1];
  } else if (str.includes("_")) {
    const parts = str.split("_").map((p) => p.trim()).filter(Boolean);
    str = parts[parts.length - 1];
  } else if (str.includes("-")) {
    const parts = str.split("-").map((p) => p.trim()).filter(Boolean);
    str = parts[parts.length - 1];
  }

  // Determine Plot Type Tag (LR, RS, CS)
  let tag = "LR";

  if (plotTy) {
    if (plotTy === "1" || plotTy.toUpperCase().includes("LR")) tag = "LR";
    else if (plotTy === "2" || plotTy.toUpperCase().includes("RS")) tag = "RS";
    else if (plotTy === "3" || plotTy.toUpperCase().includes("CS")) tag = "CS";
  }

  // 4. Check if text starts with explicit LR, RS, CS
  const matchTag = str.match(/^(LR|RS|CS)[\s_\-]*0*(\d+.*)$/i);
  if (matchTag) {
    tag = matchTag[1].toUpperCase();
    str = matchTag[2];
  } else if (/^[123]\d+$/.test(str) && str.length >= 3) {
    // 5. Embedded numeric plot_ty prefix (1 = LR, 2 = RS, 3 = CS)
    const code = str[0];
    if (code === "1") tag = "LR";
    else if (code === "2") tag = "RS";
    else if (code === "3") tag = "CS";
    str = str.slice(1);
  }

  // 6. Strip leading zeros if purely numeric (e.g. 0012 -> 12)
  if (/^0+\d+$/.test(str)) {
    str = str.replace(/^0+/, "");
  }

  const cleanNum = str || rawStr;
  return `${tag} ${cleanNum}`;
}

export function ClaimStatusBadge({
  claim,
}: {
  claim: { signed_form_i_doc_id?: string; state?: string; ecl_approval_status?: string };
}) {
  const isApproved =
    claim.ecl_approval_status === "APPROVED" || claim.state === "APPROVED";
  const isSignedUploaded = !!claim.signed_form_i_doc_id;

  if (isApproved) {
    return (
      <Badge
        variant="outline"
        className="bg-emerald-100 text-emerald-950 border-emerald-400 font-bold gap-1 text-[11px] shadow-2xs"
        title="Form-I Claim Title Approved & Finalized under CBA Act 1957"
      >
        <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
        Approved
      </Badge>
    );
  }

  if (isSignedUploaded) {
    return (
      <Badge
        variant="outline"
        className="bg-blue-50 text-blue-800 border-blue-300 font-bold gap-1 text-[11px] shadow-2xs"
        title="Signed Form-I Submitted · Under Legal Title Scrutiny & Approval"
      >
        <CheckCircle2 className="h-3 w-3 text-blue-600 shrink-0" />
        Submitted
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="bg-amber-50 text-amber-800 border-amber-300 font-semibold gap-1 text-[11px] shadow-2xs"
      title="Form-I Data Recorded · Pending Physical Signed Copy Upload"
    >
      <Clock className="h-3 w-3 text-amber-600 shrink-0 animate-pulse" />
      Pending Signed Copy
    </Badge>
  );
}

export function FormIWizardView() {
  const [mode, setMode] = React.useState<"list" | "wizard" | "view" | "ecl_view">("list");
  const [viewingClaim, setViewingClaim] = React.useState<Claim | null>(null);
  const [editingClaim, setEditingClaim] = React.useState<Claim | null>(null);
  const [uploadingClaim, setUploadingClaim] = React.useState<Claim | null>(
    null,
  );
  const [workspaceClaimId, setWorkspaceClaimId] = React.useState<string | null>(
    null,
  );
  const [isWorkspaceOpen, setIsWorkspaceOpen] = React.useState(false);

  const { data: claims, isLoading } = useQuery({
    queryKey: ["claims"],
    queryFn: fetchClaims,
  });
  const { data: plots } = useQuery({
    queryKey: ["plots"],
    queryFn: fetchPlots,
  });

  if (mode === "view" && viewingClaim) {
    return (
      <ClaimReviewCertifyView
        claim={viewingClaim}
        onDone={() => {
          setViewingClaim(null);
          setMode("list");
        }}
        onEdit={() => {
          setEditingClaim(viewingClaim);
          setViewingClaim(null);
          setMode("wizard");
        }}
      />
    );
  }

  if (mode === "ecl_view" && viewingClaim) {
    return (
      <ClaimECLView
        claim={viewingClaim}
        onDone={() => {
          setViewingClaim(null);
          setMode("list");
        }}
        onEdit={() => {
          setEditingClaim(viewingClaim);
          setViewingClaim(null);
          setMode("wizard");
        }}
      />
    );
  }

  if (mode === "wizard") {
    return (
      <Wizard
        plots={plots ?? []}
        initialClaim={editingClaim}
        onDone={() => {
          setEditingClaim(null);
          setMode("list");
        }}
        onOpenWorkspace={(claimId) => {
          setWorkspaceClaimId(claimId);
          setIsWorkspaceOpen(true);
          setMode("list");
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight">
            Form-I Claim Registry
          </h2>
          <p className="text-sm text-muted-foreground">
            Module M3 · Public portal · 21-day transparency window · spec §1.2.2
            Journey B
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingClaim(null);
            setMode("wizard");
          }}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <FileText className="h-4 w-4 mr-2" /> New Form-I Claim
        </Button>
      </div>

      <SectionCard
        title="Submitted Claims"
        icon={FileText}
        description="Landowner claims with workflow state + statutory Form-I sheet & Document Workspace"
      >
        <DataTable
          loading={isLoading}
          columns={
            [
              {
                key: "claim_code",
                header: "Code",
                sortable: true,
                render: (r) => (
                  <span className="font-mono text-xs font-bold">
                    {r.claim_code}
                  </span>
                ),
              },
              {
                key: "claimant_name",
                header: "Land Loser",
                sortable: true,
                render: (r) => (
                  <div>
                    <div className="font-medium text-sm">{r.claimant_name}</div>
                    {r.epic_no && (
                      <div className="text-[10px] text-muted-foreground font-mono">
                        EPIC: {r.epic_no}
                      </div>
                    )}
                  </div>
                ),
              },
              {
                key: "plot_count",
                header: "Plot Count",
                align: "center",
                sortable: true,
                render: (r) => {
                  const count =
                    r.plot_count ||
                    (Array.isArray(r.plots) && r.plots.length > 0
                      ? r.plots.length
                      : Array.isArray(r.form_i_claim_plot) && r.form_i_claim_plot.length > 0
                      ? r.form_i_claim_plot.length
                      : 1);
                  return (
                    <Badge
                      variant="outline"
                      className="font-mono font-bold text-xs bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300"
                    >
                      {count} plot(s)
                    </Badge>
                  );
                },
              },
              {
                key: "own_share_acres",
                header: "Share (ac)",
                align: "right",
                sortable: true,
                render: (r) => (
                  <span className="tabular-nums font-semibold">
                    {formatNumber(r.own_share_acres, 4)}
                  </span>
                ),
              },
              {
                key: "state",
                header: "Status",
                sortable: true,
                render: (r) => <ClaimStatusBadge claim={r} />,
              },
              {
                key: "sla",
                header: "21-day SLA",
                align: "right",
                render: (r) => {
                  if (!r.transparency_window_ends_at)
                    return (
                      <span className="text-xs text-muted-foreground">—</span>
                    );
                  const days = r.daysRemaining ?? 0;
                  return (
                    <Badge
                      variant="outline"
                      className={
                        days < 0
                          ? "border-rose-300 bg-rose-100 text-rose-700"
                          : days < 5
                            ? "border-amber-300 bg-amber-100 text-amber-700"
                            : "border-emerald-300 bg-emerald-50 text-emerald-700"
                      }
                    >
                      <Clock className="mr-1 h-2.5 w-2.5" />
                      {days < 0 ? `expired ${-days}d ago` : `${days}d left`}
                    </Badge>
                  );
                },
              },
              {
                key: "actions",
                header: "Action",
                align: "center",
                render: (r) => {
                  const isSignedSubmitted = !!r.signed_form_i_doc_id;
                  return (
                    <div className="flex items-center justify-center gap-1.5 flex-wrap">
                      {!isSignedSubmitted && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingClaim(r);
                              setMode("wizard");
                            }}
                            className="h-8 gap-1.5 text-xs border-amber-600 text-amber-700 hover:bg-amber-50 shadow-xs"
                          >
                            <Pencil className="h-3.5 w-3.5" /> Edit
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setUploadingClaim(r)}
                            className="h-8 gap-1.5 text-xs border-emerald-600 text-emerald-700 hover:bg-emerald-50 shadow-xs"
                          >
                            <UploadCloud className="h-3.5 w-3.5" /> Upload
                          </Button>
                        </>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setViewingClaim(r);
                          setMode("view");
                        }}
                        className="h-8 gap-1.5 text-xs border-indigo-600 text-indigo-700 hover:bg-indigo-50 shadow-xs font-medium"
                        title="Normal View (Review & Certify Summary)"
                      >
                        <Eye className="h-3.5 w-3.5" /> View
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setViewingClaim(r);
                          setMode("ecl_view");
                        }}
                        className="h-8 gap-1.5 text-xs border-purple-600 text-purple-700 hover:bg-purple-50 shadow-xs font-medium"
                        title="ECL View (Detailed 5-Section Profile)"
                      >
                        <FileText className="h-3.5 w-3.5" /> ECL View
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setWorkspaceClaimId(r.id);
                          setIsWorkspaceOpen(true);
                        }}
                        className="h-8 gap-1.5 text-xs border-blue-600 text-blue-700 hover:bg-blue-50 shadow-xs"
                      >
                        <PenTool className="h-3.5 w-3.5" /> Workspace
                      </Button>
                    </div>
                  );
                },
              },
            ] as Column<Claim>[]
          }
          data={claims ?? []}
          getRowId={(r) => r.id}
          pageSize={10}
        />
      </SectionCard>

      {/* Form-I Generation & Signature Upload Dialog */}
      <Dialog
        open={!!uploadingClaim}
        onOpenChange={(open) => !open && setUploadingClaim(null)}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-5">
          {uploadingClaim && (
            <FormIUploadWorkspaceModal
              claim={uploadingClaim}
              onClose={() => setUploadingClaim(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Claim Dialog */}
      <EditClaimModal
        claim={editingClaim}
        onClose={() => setEditingClaim(null)}
      />

      {/* Full-Screen Document Engine Workspace for Form-I Preview, Editing & Vetting Signatures */}
      {workspaceClaimId && (
        <DocumentWorkspaceModal
          isOpen={isWorkspaceOpen}
          onOpenChange={setIsWorkspaceOpen}
          templateCode="FORM_I"
          businessId={workspaceClaimId}
        />
      )}
    </div>
  );
}

function FormIUploadWorkspaceModal({
  claim,
  onClose,
}: {
  claim: Claim;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = React.useState(false);
  const [instanceId, setInstanceId] = React.useState<string | null>(null);
  const [fileId, setFileId] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [signedDoc, setSignedDoc] = React.useState<UploadedDoc[]>([]);

  // Pre-populate signed doc if already uploaded
  React.useEffect(() => {
    if (claim.signed_form_i_doc_id) {
      setSignedDoc([
        {
          id: claim.signed_form_i_doc_id,
          file_name: `Signed_Form_I_${claim.claim_code}.pdf`,
          file_size_kb: 512,
          mime_type: "application/pdf",
          virus_scan_status: "clean",
        },
      ]);
    }
  }, [claim.signed_form_i_doc_id, claim.claim_code]);

  // Check on mount if a generated Form-I document already exists (READ-ONLY instance check)
  React.useEffect(() => {
    if (!claim.id) return;
    fetch("/api/document-engine/workspace", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        templateCode: "FORM_I",
        applicationId: claim.id,
      }),
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.success && res.instance) {
          setInstanceId(res.instance.id);
          if (res.instance.generated_docx_path) {
            setFileId(res.instance.generated_docx_path);
          }
        }
      })
      .catch(() => {});
  }, [claim.id]);

  // Real Document Engine Generation — ONLY on explicit user button click!
  const handleRealGenerate = async () => {
    try {
      setIsGenerating(true);
      let targetInstanceId = instanceId;

      if (!targetInstanceId) {
        const wsRes = await fetch("/api/document-engine/workspace", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            templateCode: "FORM_I",
            applicationId: claim.id,
          }),
        });
        const wsText = await wsRes.text();
        let wsData: any = {};
        try {
          wsData = wsText ? JSON.parse(wsText) : {};
        } catch {
          throw new Error(`Workspace server error (${wsRes.status})`);
        }
        if (wsRes.ok && wsData.instance) {
          targetInstanceId = wsData.instance.id;
          setInstanceId(targetInstanceId);
        } else {
          throw new Error(
            wsData.error ||
              `Failed to initialize document engine (${wsRes.status})`,
          );
        }
      }

      const genRes = await fetch("/api/document-engine/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instanceId: targetInstanceId }),
      });
      const genText = await genRes.text();
      let genData: any = {};
      try {
        genData = genText ? JSON.parse(genText) : {};
      } catch {
        throw new Error(`Generation server error (${genRes.status})`);
      }

      if (genRes.ok && (genData.success || genData.fileId)) {
        const generatedFileId =
          genData.fileId || genData.instance?.generated_docx_path;
        setFileId(generatedFileId);
        toast.success(
          `Form-I Statutory Document ${fileId ? "Re-Generated" : "Generated"} for ${claim.claim_code}`,
        );
      } else {
        throw new Error(
          genData.error ||
            genData.details ||
            `Document generation failed (${genRes.status})`,
        );
      }
    } catch (e: any) {
      toast.error("Document Engine Generation failed: " + e.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Real PDF Download
  const handleDownloadPdf = async () => {
    if (!fileId) {
      window.open(
        `/api/claims/${claim.id || claim.claim_code}/download?format=pdf`,
        "_blank",
      );
      return;
    }
    try {
      setIsDownloadingPdf(true);
      const response = await fetch(`/api/files/${fileId}/download?format=pdf`);
      if (!response.ok) {
        throw new Error("Failed to download PDF");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Form-I_${claim.claim_code}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("PDF downloaded successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to download PDF.");
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Save/Submit Signed Document
  const handleSaveSignedDocument = async () => {
    const docIdToSave = signedDoc[0]?.id || signedDoc[0]?.file_name;
    if (!docIdToSave) {
      toast.error("Please upload the signed Form-I document first");
      return;
    }
    try {
      setSubmitting(true);
      const payload = {
        signed_form_i_doc_id: docIdToSave,
      };

      const res = await fetch(`/api/claims/${claim.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to save signed document");
      }

      toast.success(
        `Signed Form-I document for ${claim.claim_code} saved successfully!`,
      );
      qc.invalidateQueries({ queryKey: ["claims"] });
      onClose();
    } catch (e: any) {
      toast.error("Failed to save document", { description: e.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="border-b pb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <UploadCloud className="h-5 w-5 text-emerald-600" />
            Form-I Document Generation & Signed File Upload
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Claim Code:{" "}
            <code className="font-mono bg-emerald-100 text-emerald-950 px-1.5 py-0.5 rounded font-bold text-xs">
              {claim.claim_code}
            </code>{" "}
            · Claimant:{" "}
            <span className="font-semibold text-slate-800">
              {claim.claimant_name}
            </span>
          </p>
        </div>
        <ClaimStatusBadge claim={claim} />
      </div>

      {/* Step 1: Official Statutory Form-I Generation & Download */}
      <div className="rounded-lg border bg-slate-50/70 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-emerald-600" />
              1. Official Statutory Form-I Generation
            </h4>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Generate and download the official Form-I document for physical
              signature.
            </p>
          </div>

          <Button
            onClick={handleRealGenerate}
            disabled={isGenerating}
            className="h-8 gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 font-bold shadow-xs"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating...
              </>
            ) : (
              <>
                <PenTool className="h-3.5 w-3.5" />{" "}
                {fileId ? "Regenerate Form-I" : "Generate Form-I"}
              </>
            )}
          </Button>
        </div>

        {/* Action Status & Download Form-I Button */}
        <div className="flex items-center justify-between bg-white p-3 rounded border border-slate-200 text-xs">
          <span className="font-bold text-slate-900 flex items-center gap-1.5 text-[11px]">
            {fileId ? (
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Form-I Ready
                for Download
              </span>
            ) : (
              <span className="text-slate-500">Document not generated yet</span>
            )}
          </span>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPdf}
              disabled={!fileId || isDownloadingPdf}
              className="h-8 text-xs gap-1.5 border-emerald-600 text-emerald-700 hover:bg-emerald-50 font-bold shadow-xs"
            >
              {isDownloadingPdf ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5 text-emerald-600" />
              )}
              Download Form-I
            </Button>
          </div>
        </div>
      </div>

      {/* Step 2: Upload Signed & Self-Attested Form-I */}
      <div className="rounded-lg border bg-card p-4 space-y-3">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
            <Paperclip className="h-4 w-4 text-emerald-600" />
            2. Upload Signed & Self-Attested Form-I Copy{" "}
            <span className="text-red-500">*</span>
          </h4>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Upload the physically signed & scanned copy of Form-I (PDF or Image).
          </p>
        </div>

        {claim.signed_form_i_doc_id && (
          <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-md text-xs font-semibold">
            <Lock className="h-4 w-4 text-amber-600 shrink-0" />
            Signed Form-I document has already been uploaded & submitted. Re-uploading is locked.
          </div>
        )}

        <div className="rounded-lg border-2 border-dashed border-emerald-400 bg-emerald-50/40 p-3">
          <DocumentUploader
            checklist_item_key="SIGNED_FORM_I"
            label="Signed Form-I Document (PDF/JPG)"
            mode="single"
            entity_type="form_i_claim"
            entity_id={claim.id}
            module="SIGNED_FORM_I"
            disabled={!!claim.signed_form_i_doc_id}
            documents={signedDoc}
            onChange={(docs: any) => {
              const docArr = Array.isArray(docs) ? docs : [docs];
              setSignedDoc(docArr);
              toast.success("Signed Form-I file uploaded & selected");
            }}
          />
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex justify-end gap-2 pt-3 border-t">
        <Button
          variant="outline"
          size="sm"
          onClick={onClose}
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleSaveSignedDocument}
          disabled={submitting || !!claim.signed_form_i_doc_id}
          className={cn(
            "font-bold gap-1.5 text-xs shadow-xs",
            claim.signed_form_i_doc_id
              ? "bg-slate-200 text-slate-500 cursor-not-allowed hover:bg-slate-200"
              : "bg-emerald-600 hover:bg-emerald-700 text-white"
          )}
        >
          {submitting ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...
            </>
          ) : claim.signed_form_i_doc_id ? (
            <>
              <Lock className="h-3.5 w-3.5" /> Signed Copy Submitted (Locked)
            </>
          ) : (
            <>
              <CheckCircle2 className="h-3.5 w-3.5" /> Submit Signed Document
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function ClaimReviewCertifyView({
  claim,
  onDone,
  onEdit,
}: {
  claim: Claim;
  onDone: () => void;
  onEdit: () => void;
}) {
  const plotsList =
    claim.plots && claim.plots.length > 0
      ? claim.plots
      : claim.form_i_claim_plot && claim.form_i_claim_plot.length > 0
      ? claim.form_i_claim_plot
      : [
          {
            plot_id: claim.plot_id,
            plot_no: claim.plot_number,
            mouza_name: claim.mouza,
            khatian_no: claim.khatian_no,
            own_share_acres: claim.own_share_acres,
            total_ror_area: claim.own_share_acres,
            opted_monetary_in_lieu_of_employment:
              claim.opted_monetary_in_lieu_of_employment,
          },
        ];

  const totalAcres = plotsList.reduce(
    (sum: number, p: any) => sum + (Number(p.own_share_acres) || 0),
    0
  );

  const docItems = [
    { label: "Passport Size Photograph", docId: claim.photo_doc_id },
    { label: "Magistrate Affidavit", docId: claim.magistrate_affidavit_doc_id },
    { label: "Bank Passbook / Cancelled Cheque", docId: claim.passbook_doc_id },
    { label: "Title Deed / ROR Parcha", docId: claim.title_deed_doc_id },
    { label: "Signed Form-I Copy", docId: claim.signed_form_i_doc_id },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onDone}
            className="gap-1.5 text-xs font-semibold"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Claims List
          </Button>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Form-I Summary View —{" "}
              <code className="font-mono bg-emerald-100 text-emerald-950 px-2 py-0.5 rounded text-sm">
                {claim.claim_code}
              </code>
              <ClaimStatusBadge claim={claim} />
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Land Loser:{" "}
              <span className="font-bold text-slate-900">
                {claim.claimant_name}
              </span>{" "}
              · Submitted:{" "}
              {claim.submitted_at
                ? new Date(claim.submitted_at).toLocaleDateString("en-IN")
                : "Draft"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!claim.signed_form_i_doc_id && (
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="h-8 gap-1.5 text-xs border-amber-600 text-amber-700 hover:bg-amber-50 font-semibold shadow-xs"
            >
              <Pencil className="h-3.5 w-3.5" /> Edit Claim
            </Button>
          )}
        </div>
      </div>

      <Alert className="border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 py-2">
        <ShieldCheck className="h-4 w-4 text-emerald-600" />
        <AlertDescription className="text-emerald-900 dark:text-emerald-200 text-xs">
          <strong>Review & Statutory Certification:</strong> Particulars recorded below for Form-I claim code <strong>{claim.claim_code}</strong>.
        </AlertDescription>
      </Alert>

      {/* 1. Land Loser Personal & Identity Profile */}
      <div className="rounded-lg border bg-card p-4 space-y-3 shadow-xs">
        <div className="flex items-center justify-between border-b pb-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <FileText className="h-4 w-4 text-emerald-600" />
            1. Land Loser Personal & Identity Profile
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          <div>
            <span className="text-muted-foreground block text-[11px]">Full Name</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {claim.claimant_name || "N/A"}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[11px]">Father / Husband Name</span>
            <span className="font-medium text-slate-800 dark:text-slate-200">
              {claim.father_husband_name || "N/A"}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[11px]">Identity Instrument</span>
            <span className="font-mono font-bold text-emerald-800 dark:text-emerald-300">
              EPIC / Aadhaar: {claim.epic_no || claim.citizen_id_hash || "N/A"}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[11px]">Occupation</span>
            <span className="font-medium">{claim.occupation || "N/A"}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[11px]">Gender / Caste Category</span>
            <span className="font-medium">
              {claim.gender || "Male"} ({claim.caste_category || "General"})
            </span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[11px]">Nationality / Religion</span>
            <span className="font-medium">
              {claim.nationality || "Indian"} / {claim.religion || "N/A"}
            </span>
          </div>
          <div className="sm:col-span-2 md:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-dashed">
            <div>
              <span className="text-muted-foreground block text-[11px]">Present Address</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {claim.present_address || "N/A"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Permanent Address</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {claim.permanent_address || "N/A"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Land Acquisition Plot Schedule Table */}
      <div className="rounded-lg border bg-card p-4 space-y-3 shadow-xs">
        <div className="flex items-center justify-between border-b pb-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-emerald-600" />
            2. Land Acquisition Plot Schedule ({plotsList.length} plot(s))
          </h4>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-emerald-50/60 dark:bg-emerald-950/40 rounded border border-emerald-200 text-xs">
          <div>
            <span className="text-muted-foreground">Total Claimed Land Share: </span>
            <strong className="font-mono text-emerald-800 dark:text-emerald-300 font-bold text-sm">
              {totalAcres.toFixed(4)} acres
            </strong>
          </div>
          <div>
            <span className="text-muted-foreground">R&R Scheme Benefit: </span>
            <Badge
              variant="outline"
              className={cn(
                "text-xs font-bold font-mono ml-1",
                totalAcres >= 2.0
                  ? "border-emerald-600 bg-emerald-100 text-emerald-800"
                  : "border-amber-600 bg-amber-50 text-amber-900"
              )}
            >
              {totalAcres >= 2.0
                ? "Form-V Employment Eligible (2.0+ acres)"
                : "One-Time Cash Compensation (Under 2.0 acres)"}
            </Badge>
          </div>
        </div>

        <div className="overflow-x-auto rounded border border-border">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-muted/60 text-muted-foreground uppercase text-[10px] font-bold tracking-wider border-b">
                <th className="p-2">Sl</th>
                <th className="p-2">Mouza / LGD</th>
                <th className="p-2">Plot No</th>
                <th className="p-2">Khatian No</th>
                <th className="p-2">Total ROR Area</th>
                <th className="p-2">Own Share (Acres)</th>
                <th className="p-2">Compensation Preference</th>
                <th className="p-2 text-center">Title Scrutiny Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {plotsList.map((p: any, idx: number) => {
                const status = p.title_approval_status || "PENDING";
                return (
                  <tr key={idx} className="hover:bg-muted/20">
                    <td className="p-2 font-mono text-center">{idx + 1}</td>
                    <td className="p-2 font-medium">
                      {p.mouza_name || p.mouza || claim.mouza || "MADHAIPUR"}
                    </td>
                    <td className="p-2 font-bold font-mono text-slate-900 dark:text-slate-100">
                      {getCleanOnlyPlotNo(
                        p.plot_no || p.plot_number || claim.plot_number,
                        p.state_lgd || claim.state_lgd,
                        p.mouza_lgd || claim.mouza_lgd
                      )}
                    </td>
                    <td className="p-2 font-mono">
                      {p.khatian_no || claim.khatian_no || "Kh-102"}
                    </td>
                    <td className="p-2 font-mono">
                      {p.total_ror_area || p.own_share_acres || claim.own_share_acres} ac
                    </td>
                    <td className="p-2 font-mono font-bold text-emerald-700 dark:text-emerald-300">
                      {p.own_share_acres || claim.own_share_acres} ac
                    </td>
                    <td className="p-2">
                      {(p.opted_monetary_in_lieu_of_employment ?? claim.opted_monetary_in_lieu_of_employment) ? (
                        <span className="text-[11px] text-amber-800 font-medium">
                          One-Time Cash Preferred
                        </span>
                      ) : (
                        <span className="text-[11px] text-emerald-800 font-medium">
                          Employment Nomination
                        </span>
                      )}
                    </td>
                    <td className="p-2 text-center">
                      {status === "APPROVED" ? (
                        <Badge
                          variant="outline"
                          className="bg-emerald-100 text-emerald-800 border-emerald-300 font-bold gap-1 text-[10px]"
                        >
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Approved
                        </Badge>
                      ) : status === "MODIFY_REQUIRED" ? (
                        <Badge
                          variant="outline"
                          className="bg-amber-100 text-amber-900 border-amber-300 font-bold gap-1 text-[10px]"
                          title={p.scrutiny_remarks}
                        >
                          <AlertCircle className="h-3 w-3 text-amber-600" /> Modify Required
                        </Badge>
                      ) : status === "REJECTED" ? (
                        <Badge
                          variant="outline"
                          className="bg-rose-100 text-rose-800 border-rose-300 font-bold gap-1 text-[10px]"
                          title={p.scrutiny_remarks}
                        >
                          <X className="h-3 w-3 text-rose-600" /> Rejected
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-blue-50 text-blue-800 border-blue-200 font-semibold text-[10px]"
                        >
                          <Clock className="h-3 w-3 text-blue-600" /> Under Review
                        </Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Bank Account & Direct Disbursement Details */}
      <div className="rounded-lg border bg-card p-4 space-y-3 shadow-xs">
        <div className="flex items-center justify-between border-b pb-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <IndianRupee className="h-4 w-4 text-emerald-600" />
            3. Bank Account for Cash Compensation & Direct Payments
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-muted-foreground block text-[11px]">Bank Name</span>
            <span className="font-semibold">{claim.bank_name || "N/A"}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[11px]">Branch Name</span>
            <span className="font-medium">{claim.bank_branch || "N/A"}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[11px]">Account Number</span>
            <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
              {claim.bank_account_number || "N/A"}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[11px]">IFSC Code</span>
            <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">
              {claim.bank_ifsc || "N/A"}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Statutory Declarations (Questions 9 - 15) */}
      <div className="rounded-lg border bg-card p-4 space-y-3 shadow-xs">
        <div className="flex items-center justify-between border-b pb-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            4. Statutory Declarations & Answers (Questions 9 - 15)
          </h4>
        </div>

        <div className="grid grid-cols-1 gap-2 text-xs">
          <div className="p-2.5 rounded bg-muted/30 border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="font-medium">
              9. Prior compensation received from ECL or other Authority?
            </span>
            <div className="shrink-0 font-bold font-mono">
              {claim.prior_compensation_received ? (
                <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  YES ({claim.prior_compensation_details || "Details provided"})
                </span>
              ) : (
                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  NO
                </span>
              )}
            </div>
          </div>

          <div className="p-2.5 rounded bg-muted/30 border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="font-medium">
              11. Any part of plots included in another employment in ECL?
            </span>
            <div className="shrink-0 font-bold font-mono">
              {claim.prior_employment_linked ? (
                <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  YES ({claim.prior_employment_details || "Details provided"})
                </span>
              ) : (
                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  NO
                </span>
              )}
            </div>
          </div>

          <div className="p-2.5 rounded bg-muted/30 border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="font-medium">
              12. Plots free from any disputes / court cases with co-sharers or bargadars?
            </span>
            <div className="shrink-0 font-bold font-mono">
              {claim.is_free_from_disputes !== false ? (
                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  YES
                </span>
              ) : (
                <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  NO ({claim.dispute_details || "Dispute exists"})
                </span>
              )}
            </div>
          </div>

          <div className="p-2.5 rounded bg-muted/30 border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="font-medium">
              13. Plots free from any encumbrances?
            </span>
            <div className="shrink-0 font-bold font-mono">
              {claim.is_free_from_encumbrances !== false ? (
                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  YES
                </span>
              ) : (
                <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  NO ({claim.encumbrance_details || "Encumbrance exists"})
                </span>
              )}
            </div>
          </div>

          <div className="p-2.5 rounded bg-muted/30 border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="font-medium">
              14. Able to handover peaceful & encumbrance-free possession to ECL?
            </span>
            <div className="shrink-0 font-bold font-mono">
              {claim.can_handover_possession !== false ? (
                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  YES
                </span>
              ) : (
                <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  NO ({claim.possession_reason || "Reason provided"})
                </span>
              )}
            </div>
          </div>

          <div className="p-2.5 rounded bg-muted/30 border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="font-medium">
              15. Agreed to accept One-Time Cash Compensation in lieu of employment?
            </span>
            <div className="shrink-0 font-bold font-mono">
              {claim.opted_monetary_in_lieu_of_employment ? (
                <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  YES (Accept One-Time Cash)
                </span>
              ) : (
                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  NO (Prefer Employment Nomination via Form-V)
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Attached Self-Attested Mandatory Documents */}
      <div className="rounded-lg border bg-card p-4 space-y-3 shadow-xs">
        <div className="flex items-center justify-between border-b pb-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <FileCheck className="h-4 w-4 text-emerald-600" />
            5. Attached Self-Attested Mandatory Documents
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          {docItems.map((item, idx) => (
            <div
              key={idx}
              className="p-3 rounded border bg-muted/20 flex items-center justify-between"
            >
              <div className="flex items-center gap-2 truncate pr-2">
                <CheckCircle2
                  className={cn(
                    "h-4 w-4 shrink-0",
                    item.docId ? "text-emerald-600" : "text-slate-300"
                  )}
                />
                <span className="font-medium truncate">{item.label}</span>
              </div>
              {item.docId ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    window.open(`/api/files/${item.docId}/download`, "_blank")
                  }
                  className="h-6 text-[10px] font-mono border-emerald-600 text-emerald-700 hover:bg-emerald-50 gap-1 px-2 shrink-0"
                >
                  <Eye className="h-3 w-3" /> View
                </Button>
              ) : (
                <span className="text-[10px] text-rose-600 font-mono italic shrink-0">
                  Not Attached
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Statutory Certification Box */}
      <div className="rounded-lg border-2 border-emerald-600/40 bg-emerald-50/40 p-4 space-y-2">
        <div className="flex items-start gap-2.5">
          <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600 shrink-0" />
          <span className="text-xs text-slate-800 leading-relaxed font-medium">
            <strong>Statutory Certification Verified:</strong> The particulars mentioned above for Form-I claim code <strong>{claim.claim_code}</strong> have been certified as genuine & authentic under Coal Bearer's Areas (Acquisition and Development) Act 1957 and Coal India Ltd R&R Policy.
          </span>
        </div>
      </div>
    </div>
  );
}

function ClaimECLView({
  claim,
  onDone,
  onEdit,
}: {
  claim: Claim;
  onDone: () => void;
  onEdit: () => void;
}) {
  const qc = useQueryClient();
  const [selectedPlotIds, setSelectedPlotIds] = React.useState<string[]>([]);
  const [certifyingPlots, setCertifyingPlots] = React.useState<any[] | null>(null);
  const [decision, setDecision] = React.useState<"Approved" | "Modify Required" | "Rejected">("Approved");
  const [remarks, setRemarks] = React.useState("");
  const [legalSearchingDocs, setLegalSearchingDocs] = React.useState<UploadedDoc[]>([]);
  const [savingCert, setSavingCert] = React.useState(false);

  const initialPlotsList = React.useMemo(() => {
    return Array.isArray(claim.plots) && claim.plots.length > 0
      ? claim.plots
      : Array.isArray(claim.form_i_claim_plot) && claim.form_i_claim_plot.length > 0
      ? claim.form_i_claim_plot
      : [
          {
            id: claim.id + "_plot",
            plot_id: claim.plot_id,
            plot_no: claim.plot_number,
            mouza: claim.mouza,
            khatian_no: claim.khatian_no,
            own_share_acres: claim.own_share_acres,
            title_approval_status: "PENDING",
          },
        ];
  }, [claim]);

  const [rawPlotsList, setRawPlotsList] = React.useState<any[]>(initialPlotsList);

  React.useEffect(() => {
    setRawPlotsList(initialPlotsList);
  }, [initialPlotsList]);

  const toggleSelectAll = () => {
    if (selectedPlotIds.length === rawPlotsList.length) {
      setSelectedPlotIds([]);
    } else {
      setSelectedPlotIds(rawPlotsList.map((p: any) => p.id || p.plot_id));
    }
  };

  const toggleSelectPlot = (id: string) => {
    setSelectedPlotIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleOpenBatchCertification = () => {
    const selectedPlots = rawPlotsList.filter((p: any) =>
      selectedPlotIds.includes(p.id || p.plot_id)
    );
    if (selectedPlots.length === 0) {
      toast.error("Please select at least one plot using the checkboxes");
      return;
    }
    setCertifyingPlots(selectedPlots);
    setDecision("Approved");
    setRemarks("");
    setLegalSearchingDocs([]);
  };

  const handleOpenSingleCertification = (plot: any) => {
    setCertifyingPlots([plot]);
    const rawStatus = plot.title_approval_status || "APPROVED";
    const mappedDecision =
      rawStatus === "APPROVED"
        ? "Approved"
        : rawStatus === "MODIFY_REQUIRED"
        ? "Modify Required"
        : rawStatus === "REJECTED"
        ? "Rejected"
        : "Approved";

    setDecision(mappedDecision);
    setRemarks(plot.scrutiny_remarks || "");
    if (plot.legal_searching_doc_id) {
      setLegalSearchingDocs([
        {
          id: plot.legal_searching_doc_id,
          file_name: `Legal_Searching_Certificate_${plot.plot_no || "Plot"}.pdf`,
          file_size_kb: 1024,
          mime_type: "application/pdf",
          virus_scan_status: "clean",
        },
      ]);
    } else {
      setLegalSearchingDocs([]);
    }
  };

  const handleSaveCertification = async () => {
    if (!certifyingPlots || certifyingPlots.length === 0) return;
    if (decision === "Approved" && legalSearchingDocs.length === 0) {
      toast.error("Please upload the Legal Searching Certificate (PDF) before approving.");
      return;
    }
    if ((decision === "Modify Required" || decision === "Rejected") && !remarks.trim()) {
      toast.error(`Please enter ${decision === "Modify Required" ? "modification remarks" : "rejection reasons"}.`);
      return;
    }

    setSavingCert(true);
    try {
      const plotIds = certifyingPlots.map((p) => p.id || p.plot_id);
      const newStatus = decision === "Approved" ? "APPROVED" : decision === "Modify Required" ? "MODIFY_REQUIRED" : "REJECTED";
      const docId = legalSearchingDocs[0]?.id || legalSearchingDocs[0]?.file_name || null;

      const res = await fetch(`/api/claims/${claim.id}/certify-plot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plot_ids: plotIds,
          title_approval_status: newStatus,
          legal_searching_doc_id: docId,
          scrutiny_remarks: remarks,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to update title certification");
      }

      toast.success(`Title Certification updated to ${decision} for ${plotIds.length} plot(s)!`);

      // Update local state immediately so badge and action update instantly
      setRawPlotsList((prev) =>
        prev.map((p: any) =>
          plotIds.includes(p.id || p.plot_id)
            ? {
                ...p,
                title_approval_status: newStatus,
                legal_searching_doc_id: docId,
                scrutiny_remarks: remarks,
              }
            : p
        )
      );

      qc.invalidateQueries({ queryKey: ["claims"] });
      setCertifyingPlots(null);
    } catch (e: any) {
      toast.error(e.message || "Failed to save title certification");
    } finally {
      setSavingCert(false);
    }
  };

  const [approvingClaim, setApprovingClaim] = React.useState(false);
  const [claimApproved, setClaimApproved] = React.useState(
    claim.ecl_approval_status === "APPROVED" || claim.state === "APPROVED"
  );

  const allPlotsApproved =
    rawPlotsList.length > 0 &&
    rawPlotsList.every((p: any) => p.title_approval_status === "APPROVED");

  const handleApproveEntireClaim = async () => {
    setApprovingClaim(true);
    try {
      const res = await fetch(`/api/claims/${claim.id}/approve-claim`, {
        method: "POST",
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to approve Form-I claim");
      }
      toast.success(`Form-I Claim ${claim.claim_code} has been successfully APPROVED!`);
      setClaimApproved(true);
      qc.invalidateQueries({ queryKey: ["claims"] });
    } catch (e: any) {
      toast.error(e.message || "Failed to approve claim");
    } finally {
      setApprovingClaim(false);
    }
  };

  const totalAcres = rawPlotsList.reduce(
    (sum: number, p: any) => sum + (Number(p.own_share_acres) || 0),
    0
  );

  const approvedCount = rawPlotsList.filter(
    (p: any) => p.title_approval_status === "APPROVED"
  ).length;

  return (
    <div className="space-y-3">
      {/* Top Navigation Bar (Outside Card) */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={onDone}
          className="gap-1.5 text-xs font-semibold h-8 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Claims List
        </Button>
      </div>

      {/* Header Info & Stats Summary Card */}
      <div className="rounded-lg border bg-card p-3 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2.5">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
                ECL Scrutiny View —{" "}
                <code className="font-mono bg-emerald-100 dark:bg-emerald-950 text-emerald-950 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800 px-2 py-0.5 rounded text-xs font-bold">
                  {claim.claim_code}
                </code>
              </h2>
              <ClaimStatusBadge claim={claim} />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
              <span>Land Loser: <strong className="text-slate-900 dark:text-slate-100">{claim.claimant_name}</strong></span>
              <span>·</span>
              <span>Submitted: {claim.submitted_at ? new Date(claim.submitted_at).toLocaleDateString("en-IN") : "Draft"}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="h-7 gap-1.5 text-xs border-amber-600 text-amber-700 hover:bg-amber-50 font-semibold cursor-pointer shadow-2xs"
            >
              <Pencil className="h-3.5 w-3.5" /> Edit Claim
            </Button>
          </div>
        </div>

        {/* Quick Executive Metric Chips (Tight Gap) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2 rounded border bg-muted/20">
            <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider">Total Schedule Plots</span>
            <span className="text-sm font-bold font-mono text-emerald-800 dark:text-emerald-300">{rawPlotsList.length} plot(s)</span>
          </div>
          <div className="p-2 rounded border bg-muted/20">
            <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider">Total Claim Share</span>
            <span className="text-sm font-bold font-mono text-emerald-800 dark:text-emerald-300">{totalAcres.toFixed(4)} acres</span>
          </div>
          <div className="p-2 rounded border bg-muted/20">
            <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider">Title Certification</span>
            <span className="text-sm font-bold font-mono text-amber-800 dark:text-amber-300">
              {approvedCount} / {rawPlotsList.length} Approved
            </span>
          </div>
          <div className="p-2 rounded border bg-muted/20">
            <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider">R&R Policy Benefit</span>
            <span className={cn("text-xs font-bold block mt-0.5", totalAcres >= 2.0 ? "text-emerald-700 dark:text-emerald-300" : "text-amber-800 dark:text-amber-300")}>
              {totalAcres >= 2.0 ? "Form-V Employment Eligible" : "Cash Compensation"}
            </span>
          </div>
        </div>
      </div>

      {/* Section 1: Citizen Profile & Demographics */}
      <div className="rounded-lg border border-border bg-card p-3 space-y-2.5 shadow-2xs border-l-4 border-l-emerald-600">
        <div className="flex items-center justify-between border-b pb-1.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <div className="p-1 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
              <ShieldCheck className="h-3.5 w-3.5" />
            </div>
            1. Land Loser Profile & Demographics (Q1 - Q7)
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
          <div className="p-2 rounded border bg-muted/20">
            <span className="text-muted-foreground font-medium block text-[10px]">Full Name</span>
            <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">{claim.claimant_name}</span>
          </div>
          <div className="p-2 rounded border bg-muted/20">
            <span className="text-muted-foreground font-medium block text-[10px]">Father / Husband Name</span>
            <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">{claim.father_husband_name || "—"}</span>
          </div>
          <div className="p-2 rounded border bg-muted/20">
            <span className="text-muted-foreground font-medium block text-[10px]">EPIC / Aadhaar ID</span>
            <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300 text-xs">{claim.epic_no || claim.citizen_id_hash || "—"}</span>
          </div>
          <div className="p-2 rounded border bg-muted/20">
            <span className="text-muted-foreground font-medium block text-[10px]">Gender & Category</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100 text-xs">{claim.gender || "Male"} · {claim.caste_category || "General"}</span>
          </div>
          <div className="p-2 rounded border bg-muted/20 md:col-span-2">
            <span className="text-muted-foreground font-medium block text-[10px]">Present Address</span>
            <span className="font-medium text-slate-900 dark:text-slate-100 text-xs">{claim.present_address || "—"}</span>
          </div>
          <div className="p-2 rounded border bg-muted/20 md:col-span-2">
            <span className="text-muted-foreground font-medium block text-[10px]">Permanent Address</span>
            <span className="font-medium text-slate-900 dark:text-slate-100 text-xs">{claim.permanent_address || "—"}</span>
          </div>
        </div>
      </div>

      {/* Section 2: Land & Plot Schedule (Q8 Multi-Plot Table) */}
      <div className="rounded-lg border border-border bg-card p-3 space-y-2.5 shadow-2xs border-l-4 border-l-blue-600">
        <div className="flex items-center justify-between border-b pb-1.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <div className="p-1 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
              <MapPin className="h-3.5 w-3.5" />
            </div>
            2. Land & Plot Schedule (Q8 Multi-Plot Table)
          </h4>
        </div>

        <div className="space-y-3">
          {/* Selection Action Bar (Shown ONLY when 2 or more plots are selected) */}
          {selectedPlotIds.length >= 2 && (
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 rounded-lg shadow-2xs">
              <div className="flex items-center gap-2 text-xs text-emerald-950 dark:text-emerald-200 font-semibold">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{selectedPlotIds.length} Plot(s) Selected for Title Certification</span>
              </div>
              <Button
                size="sm"
                onClick={handleOpenBatchCertification}
                className="h-8 gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs cursor-pointer"
              >
                <UploadCloud className="h-3.5 w-3.5" /> Upload Legal Searching & Certification →
              </Button>
            </div>
          )}

          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-b font-bold">
                <tr>
                  <th className="p-2.5 text-center w-10">
                    <input
                      type="checkbox"
                      checked={
                        rawPlotsList.length > 0 &&
                        selectedPlotIds.length === rawPlotsList.length
                      }
                      onChange={toggleSelectAll}
                      className="h-3.5 w-3.5 rounded border-border text-emerald-600 accent-emerald-600 cursor-pointer"
                    />
                  </th>
                  <th className="p-2.5 text-left">#</th>
                  <th className="p-2.5 text-left">Mouza</th>
                  <th className="p-2.5 text-left">Plot No</th>
                  <th className="p-2.5 text-left">Khatian No</th>
                  <th className="p-2.5 text-right">Own Share (Acres)</th>
                  <th className="p-2.5 text-center">Title Scrutiny Status</th>
                  <th className="p-2.5 text-center">Title Certification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rawPlotsList.map((p: any, idx: number) => {
                  const pId = p.id || p.plot_id || `plot_${idx}`;
                  const isChecked = selectedPlotIds.includes(pId);
                  const status = p.title_approval_status || "PENDING";
                  return (
                    <tr
                      key={idx}
                      className={cn(
                        "hover:bg-muted/30 transition-colors",
                        isChecked && "bg-emerald-50/40"
                      )}
                    >
                      <td className="p-2.5 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectPlot(pId)}
                          className="h-3.5 w-3.5 rounded border-border text-emerald-600 accent-emerald-600 cursor-pointer"
                        />
                      </td>
                      <td className="p-2.5 font-mono">{idx + 1}</td>
                      <td className="p-2.5 font-semibold">
                        {p.mouza || claim.mouza || "MADHAIPUR"}
                      </td>
                      <td className="p-2.5 font-mono font-bold text-emerald-800 dark:text-emerald-300">
                        {getCleanOnlyPlotNo(
                          p.plot_no || p.display_plot_no || claim.plot_number,
                          p.state_lgd || claim.state_lgd,
                          p.mouza_lgd || claim.mouza_lgd
                        )}
                      </td>
                      <td className="p-2.5 font-mono">
                        {p.khatian_no || claim.khatian_no || "—"}
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                        {p.own_share_acres || claim.own_share_acres} ac
                      </td>
                      <td className="p-2.5 text-center">
                        {status === "APPROVED" ? (
                          <Badge
                            variant="outline"
                            className="bg-emerald-100 text-emerald-800 border-emerald-300 font-bold gap-1 text-[10px]"
                          >
                            <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Approved
                          </Badge>
                        ) : status === "MODIFY_REQUIRED" ? (
                          <Badge
                            variant="outline"
                            className="bg-amber-100 text-amber-900 border-amber-300 font-bold gap-1 text-[10px]"
                            title={p.scrutiny_remarks}
                          >
                            <AlertCircle className="h-3 w-3 text-amber-600" /> Modify Required
                          </Badge>
                        ) : status === "REJECTED" ? (
                          <Badge
                            variant="outline"
                            className="bg-rose-100 text-rose-800 border-rose-300 font-bold gap-1 text-[10px]"
                            title={p.scrutiny_remarks}
                          >
                            <X className="h-3 w-3 text-rose-600" /> Rejected
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-blue-50 text-blue-800 border-blue-200 font-semibold text-[10px]"
                          >
                            <Clock className="h-3 w-3 text-blue-600" /> Under Review
                          </Badge>
                        )}
                      </td>
                      <td className="p-2.5 text-center">
                        {p.legal_searching_doc_id || status === "APPROVED" ? (
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (p.legal_searching_doc_id) {
                                  window.open(`/api/files/${p.legal_searching_doc_id}/download`, "_blank");
                                } else {
                                  toast.info("No certificate file attached.");
                                }
                              }}
                              className="h-7 text-[11px] gap-1 border-blue-600 text-blue-700 hover:bg-blue-50 font-semibold cursor-pointer"
                            >
                              <Download className="h-3.5 w-3.5" /> Download
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Edit Certification / Re-upload"
                              onClick={() => handleOpenSingleCertification(p)}
                              className="h-7 w-7 p-0 text-slate-500 hover:text-slate-900 cursor-pointer"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenSingleCertification(p)}
                            className="h-7 text-[11px] gap-1 border-emerald-600 text-emerald-700 hover:bg-emerald-50 font-semibold cursor-pointer"
                          >
                            <UploadCloud className="h-3.5 w-3.5" /> Upload
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Step 2.2 Title Certification Dialog Workspace */}
      <Dialog
        open={!!certifyingPlots}
        onOpenChange={(open) => !open && setCertifyingPlots(null)}
      >
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto p-5 space-y-4">
          {certifyingPlots && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                  Title Certification & Legal Searching
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Certifying {certifyingPlots.length} plot(s) for Claim Code{" "}
                  <strong>{claim.claim_code}</strong>
                </p>
              </div>

              {/* Selected Plots List */}
              <div className="p-2.5 bg-muted/30 border rounded-md text-xs space-y-1">
                <span className="font-semibold text-slate-700 block">Plots to Certify:</span>
                <div className="flex flex-wrap gap-1.5">
                  {certifyingPlots.map((p, idx) => (
                    <Badge key={idx} variant="secondary" className="font-mono text-[11px]">
                      {getCleanOnlyPlotNo(
                        p.plot_no || p.display_plot_no || claim.plot_number,
                        p.state_lgd || claim.state_lgd,
                        p.mouza_lgd || claim.mouza_lgd
                      )}{" "}
                      ({p.mouza || claim.mouza})
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Decision Selection Dropdown */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-900 block">
                  Select Title Certification Decision:
                </Label>
                <select
                  value={decision}
                  onChange={(e) => setDecision(e.target.value as any)}
                  className="w-full text-xs font-semibold p-2.5 rounded-lg border-2 border-slate-300 bg-background text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="Approved">🟢 Approved (Clear Title & Upload Legal Searching Certificate)</option>
                  <option value="Modify Required">🟠 Modify Required (Request Correction / Additional Documents)</option>
                  <option value="Rejected">🔴 Rejected (Legal Title Encumbered / Dispute Found)</option>
                </select>
              </div>

              {/* Dynamic Content based on Decision */}
              {decision === "Approved" ? (
                <div className="space-y-2 p-3 bg-emerald-50/50 border border-emerald-200 rounded-lg">
                  <Label className="text-xs font-bold text-emerald-950 block">
                    Upload Legal Searching Certificate (PDF):
                  </Label>
                  <DocumentUploader
                    checklist_item_key="LEGAL_SEARCHING_CERT"
                    label="Legal Searching Certificate (PDF)"
                    module="LEGAL_SEARCHING_CERT"
                    documents={legalSearchingDocs}
                    onChange={(docs: any) => {
                      const docArr = Array.isArray(docs) ? docs : [docs];
                      setLegalSearchingDocs(docArr);
                    }}
                  />
                  <p className="text-[11px] text-emerald-800 italic">
                    Upload the formally signed Legal Searching Certificate issued by the advocate clearing the title.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 p-3 bg-amber-50/50 border border-amber-200 rounded-lg">
                  <Label className="text-xs font-bold text-slate-900 block">
                    {decision === "Modify Required" ? "Modification Remarks / Rectification Instructions:" : "Rejection Reasons:"}
                  </Label>
                  <textarea
                    rows={3}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder={
                      decision === "Modify Required"
                        ? "Specify missing documents or unrecorded mutation required from applicant..."
                        : "Specify legal title encumbrance or dispute rationale..."
                    }
                    className="w-full text-xs p-2 rounded-md border border-slate-300 bg-background font-sans focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 border-t pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCertifyingPlots(null)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveCertification}
                  disabled={savingCert}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  {savingCert ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> Saving...
                    </>
                  ) : (
                    "Save & Update Title Certification"
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Section 3: Financial & Bank Details */}
      <div className="rounded-lg border border-border bg-card p-3 space-y-2.5 shadow-2xs border-l-4 border-l-amber-600">
        <div className="flex items-center justify-between border-b pb-1.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <div className="p-1 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
              <IndianRupee className="h-3.5 w-3.5" />
            </div>
            3. Financial & Bank RTGS Details (Q10)
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-xs">
          <div className="p-2 rounded border bg-muted/20">
            <span className="text-muted-foreground font-medium block text-[10px]">Bank Name</span>
            <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">{claim.bank_name || "—"}</span>
          </div>
          <div className="p-2 rounded border bg-muted/20">
            <span className="text-muted-foreground font-medium block text-[10px]">Branch Name</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100 text-xs">{claim.bank_branch || "—"}</span>
          </div>
          <div className="p-2 rounded border bg-muted/20">
            <span className="text-muted-foreground font-medium block text-[10px]">Account Number</span>
            <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs">{claim.bank_account_number || "—"}</span>
          </div>
          <div className="p-2 rounded border bg-muted/20">
            <span className="text-muted-foreground font-medium block text-[10px]">IFSC Code</span>
            <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300 text-xs">{claim.bank_ifsc || "—"}</span>
          </div>
        </div>
      </div>

      {/* Section 4: Statutory Declarations */}
      <div className="rounded-lg border border-border bg-card p-3 space-y-2.5 shadow-2xs border-l-4 border-l-purple-600">
        <div className="flex items-center justify-between border-b pb-1.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <div className="p-1 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
              <FileCheck className="h-3.5 w-3.5" />
            </div>
            4. Statutory Declarations (Questions 9, 11 - 15)
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
          <div className="p-2 rounded border bg-muted/20 flex flex-col justify-between">
            <div className="font-semibold text-slate-800 dark:text-slate-200 text-[11px]">Q9. Prior Compensation Received</div>
            <div className="mt-1 font-bold text-emerald-700 dark:text-emerald-300 text-xs">{claim.prior_compensation_received ? "YES" : "NO"}</div>
            {claim.prior_compensation_details && <p className="text-muted-foreground text-[10px] mt-0.5">{claim.prior_compensation_details}</p>}
          </div>
          <div className="p-2 rounded border bg-muted/20 flex flex-col justify-between">
            <div className="font-semibold text-slate-800 dark:text-slate-200 text-[11px]">Q11. Prior Employment Linked</div>
            <div className="mt-1 font-bold text-emerald-700 dark:text-emerald-300 text-xs">{claim.prior_employment_linked ? "YES" : "NO"}</div>
          </div>
          <div className="p-2 rounded border bg-muted/20 flex flex-col justify-between">
            <div className="font-semibold text-slate-800 dark:text-slate-200 text-[11px]">Q12. Free from Disputes</div>
            <div className="mt-1 font-bold text-emerald-700 dark:text-emerald-300 text-xs">{claim.is_free_from_disputes !== false ? "YES" : "NO"}</div>
          </div>
          <div className="p-2 rounded border bg-muted/20 flex flex-col justify-between">
            <div className="font-semibold text-slate-800 dark:text-slate-200 text-[11px]">Q13. Free from Encumbrances</div>
            <div className="mt-1 font-bold text-emerald-700 dark:text-emerald-300 text-xs">{claim.is_free_from_encumbrances !== false ? "YES" : "NO"}</div>
          </div>
          <div className="p-2 rounded border bg-muted/20 flex flex-col justify-between">
            <div className="font-semibold text-slate-800 dark:text-slate-200 text-[11px]">Q14. Peaceful Possession Handover</div>
            <div className="mt-1 font-bold text-emerald-700 dark:text-emerald-300 text-xs">{claim.can_handover_possession !== false ? "YES" : "NO"}</div>
          </div>
          <div className="p-2 rounded border bg-muted/20 flex flex-col justify-between">
            <div className="font-semibold text-slate-800 dark:text-slate-200 text-[11px]">Q15. Opted Monetary Compensation</div>
            <div className="mt-1 font-bold text-emerald-700 dark:text-emerald-300 text-xs">{claim.opted_monetary_in_lieu_of_employment ? "YES" : "NO"}</div>
          </div>
        </div>
      </div>

      {/* Section 5: Submitted Proof Documents */}
      <div className="rounded-lg border border-border bg-card p-3 space-y-2.5 shadow-2xs border-l-4 border-l-rose-600">
        <div className="flex items-center justify-between border-b pb-1.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <div className="p-1 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
              <Paperclip className="h-3.5 w-3.5" />
            </div>
            5. Submitted Proof Documents (Read-Only File Viewer)
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 text-xs">
          {[
            { label: "Passport Size Photo", docId: claim.photo_doc_id },
            { label: "Magistrate Affidavit", docId: claim.magistrate_affidavit_doc_id },
            { label: "Bank Passbook / Cheque", docId: claim.passbook_doc_id },
            { label: "Title Deed / Parcha", docId: claim.title_deed_doc_id },
            { label: "Signed Form-I Copy", docId: claim.signed_form_i_doc_id },
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-2.5 rounded-lg border bg-muted/20 shadow-2xs flex flex-col justify-between gap-2"
            >
              <div>
                <span className="font-bold text-slate-900 dark:text-slate-100 block text-xs truncate">
                  {item.label}
                </span>
                <span className="text-[10px] font-mono text-muted-foreground block truncate mt-0.5">
                  {item.docId ? `ID: ${item.docId}` : "Not Uploaded"}
                </span>
              </div>
              {item.docId ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    window.open(`/api/files/${item.docId}/download`, "_blank")
                  }
                  className="h-7 text-[11px] gap-1 border-emerald-600 text-emerald-700 hover:bg-emerald-50 font-semibold w-full cursor-pointer"
                >
                  <Eye className="h-3.5 w-3.5" /> View / Download
                </Button>
              ) : (
                <Badge
                  variant="outline"
                  className="text-[10px] text-slate-400 border-slate-300 w-fit"
                >
                  Missing File
                </Badge>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Section 6: Overall ECL Claim Final Approval */}
      <div className="rounded-lg border border-border bg-card p-3.5 space-y-3 shadow-xs border-l-4 border-l-emerald-600">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <div className="p-1 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                <ShieldCheck className="h-4 w-4" />
              </div>
              6. Overall Form-I Claim Approval & Legal Finalization
            </h4>
            <p className="text-xs text-muted-foreground mt-1">
              {claimApproved
                ? `Form-I Claim Code ${claim.claim_code} is APPROVED & finalized in public.form_i_claim database table.`
                : allPlotsApproved
                ? `All ${rawPlotsList.length} plot(s) have been verified & Title-Certified. Click below to approve the entire claim.`
                : `Currently ${approvedCount} of ${rawPlotsList.length} plot(s) are Title-Approved. Approve all plots to unlock overall claim approval.`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {claimApproved ? (
              <Badge variant="outline" className="bg-emerald-100 text-emerald-950 border-emerald-300 font-bold px-3 py-1.5 text-xs gap-1.5 shadow-2xs">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Form-I Claim Approved
              </Badge>
            ) : allPlotsApproved ? (
              <Button
                onClick={handleApproveEntireClaim}
                disabled={approvingClaim}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-2 px-4 py-2 shadow-xs cursor-pointer"
              >
                {approvingClaim ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Approving Claim...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" /> Approve & Finalize Form-I Claim
                  </>
                )}
              </Button>
            ) : (
              <Badge variant="outline" className="bg-amber-50 text-amber-900 border-amber-300 font-semibold px-3 py-1 text-xs gap-1">
                <Clock className="h-3.5 w-3.5 text-amber-600 animate-pulse" /> Pending All Plot Title Certifications ({approvedCount}/{rawPlotsList.length})
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Wizard({
  plots,
  initialClaim,
  onDone,
  onOpenWorkspace,
}: {
  plots: PlotItem[];
  initialClaim?: Claim | null;
  onDone: () => void;
  onOpenWorkspace?: (claimId: string) => void;
}) {
  const qc = useQueryClient();
  const [step, setStep] = React.useState(0);
  const [maxVisited, setMaxVisited] = React.useState(0);
  const [submitting, setSubmitting] = React.useState(false);

  // Auth State (Step 1.1)
  const [authType, setAuthType] = React.useState<"aadhaar" | "epic">("aadhaar");
  const [identifier, setIdentifier] = React.useState("");
  const [otpVerified, setOtpVerified] = React.useState(false);

  // Search by Notification & Location Filters (State ➔ District ➔ Block ➔ Mouza)
  const [plotFilterNotification, setPlotFilterNotification] =
    React.useState("");
  const [plotFilterState, setPlotFilterState] = React.useState("");
  const [plotFilterDistrict, setPlotFilterDistrict] = React.useState("");
  const [plotFilterBlock, setPlotFilterBlock] = React.useState("");
  const [plotFilterMouza, setPlotFilterMouza] = React.useState("");
  const [plotSearchQuery, setPlotSearchQuery] = React.useState("");

  // Multiple Plot Entries State (Hidden initially until user picks a plot)
  const [plotEntries, setPlotEntries] = React.useState<PlotEntry[]>([]);

  // Form State (Demographics Q1-Q7 & Declarations Q9-Q15)
  const [form, setForm] = React.useState({
    authType: "aadhaar" as "aadhaar" | "epic",
    aadhaarNumber: "",
    epicNo: "",
    claimant_name: "",
    father_husband_name: "",

    // Location & Master Selection for Land Loser
    state_lgd: "",
    district_lgd: "",
    block_lgd: "",
    mouza_lgd: "",
    pincode: "",

    present_address: "",
    same_as_present: false,
    permanent_address: "",

    occupation: "Agriculture",
    gender: "Male",
    nationality: "Indian",
    religion: "Hindu",
    caste_category: "GENERAL",
    primary_mobile_no: "",

    // Q9: Prior Compensation
    prior_compensation_received: false,
    prior_compensation_details: "",

    // Q10: Financial / Bank RTGS
    bank_name: "State Bank of India",
    bank_branch: "ECL Main Branch",
    bank_account_number: "",
    bank_ifsc: "",

    // Q11: Prior Employment Linked
    prior_employment_linked: false,
    prior_employment_details: "",

    // Q12: Free from Disputes
    is_free_from_disputes: true,
    dispute_details: "",

    // Q13: Free from Encumbrances
    is_free_from_encumbrances: true,
    encumbrance_details: "",

    // Q14: Peaceful Handover Possession
    can_handover_possession: true,
    possession_handover_reasons: "",

    // Q15: Monetary Compensation Option
    opted_monetary_in_lieu_of_employment: false,
    monetary_opt_reason: "",

    // Certification Signature Agreement
    certified_accurate: false,
  });

  // Pre-fill form state when initialClaim is provided for inline editing
  React.useEffect(() => {
    if (!initialClaim) return;

    setForm((prev) => ({
      ...prev,
      claimant_name: initialClaim.claimant_name || "",
      father_husband_name: initialClaim.father_husband_name || "",
      state_lgd: initialClaim.state_lgd || "19",
      district_lgd: initialClaim.district_lgd || "704",
      block_lgd: initialClaim.block_lgd || "2802",
      mouza_lgd: initialClaim.mouza_lgd || "2802004",
      pincode: initialClaim.pincode || "713363",
      present_address: initialClaim.present_address || "",
      permanent_address: initialClaim.permanent_address || "",
      epic_no: initialClaim.epic_no || "",
      occupation: initialClaim.occupation || "Agriculture",
      gender: initialClaim.gender || "Male",
      nationality: initialClaim.nationality || "Indian",
      religion: initialClaim.religion || "Hindu",
      caste_category: initialClaim.caste_category || "GENERAL",
      bank_name: initialClaim.bank_name || "State Bank of India",
      bank_branch: initialClaim.bank_branch || "ECL Main Branch",
      bank_account_number: initialClaim.bank_account_number || "",
      bank_ifsc: initialClaim.bank_ifsc || "",
      prior_compensation_received:
        initialClaim.prior_compensation_received ?? false,
      prior_compensation_details: initialClaim.prior_compensation_details || "",
      prior_employment_linked: initialClaim.prior_employment_linked ?? false,
      prior_employment_details: initialClaim.prior_employment_details || "",
      is_free_from_disputes: initialClaim.is_free_from_disputes ?? true,
      dispute_details: initialClaim.dispute_details || "",
      is_free_from_encumbrances: initialClaim.is_free_from_encumbrances ?? true,
      encumbrance_details: initialClaim.encumbrance_details || "",
      can_handover_possession: initialClaim.can_handover_possession ?? true,
      possession_handover_reasons: initialClaim.possession_reason || "",
      opted_monetary_in_lieu_of_employment:
        initialClaim.opted_monetary_in_lieu_of_employment ?? false,
      monetary_opt_reason: initialClaim.monetary_opt_reason || "",
      certified_accurate: true,
    }));

    setOtpVerified(true);

    if (initialClaim.epic_no) {
      setAuthType("epic");
      setIdentifier(initialClaim.epic_no);
    } else if (initialClaim.citizen_id_hash) {
      setAuthType("aadhaar");
      setIdentifier(initialClaim.citizen_id_hash);
    }

    const existingPlots =
      initialClaim.plots || initialClaim.form_i_claim_plot || [];
    if (existingPlots.length > 0) {
      setPlotEntries(
        existingPlots.map((p: any) => ({
          plot_id: String(
            p.plot_schedule_id || p.plot_id || initialClaim.plot_id,
          ),
          plot_no: p.plot_no || p.display_plot_no || initialClaim.plot_number,
          khatian_no: p.khatian_no || initialClaim.khatian_no || "",
          own_share_acres: String(
            p.own_share_acres ?? initialClaim.own_share_acres ?? "0",
          ),
          total_ror_area: String(p.total_ror_area ?? "0"),
          opted_monetary_in_lieu_of_employment:
            initialClaim.opted_monetary_in_lieu_of_employment ?? false,
        })),
      );
    } else if (initialClaim.plot_id) {
      setPlotEntries([
        {
          plot_id: String(initialClaim.plot_id),
          plot_no: initialClaim.plot_number,
          khatian_no: initialClaim.khatian_no || "",
          own_share_acres: String(initialClaim.own_share_acres || "0"),
          total_ror_area: String(initialClaim.own_share_acres || "0"),
          opted_monetary_in_lieu_of_employment:
            initialClaim.opted_monetary_in_lieu_of_employment ?? false,
        },
      ]);
    }

    if (initialClaim.photo_doc_id) {
      setUploadedDocs((prev) => ({
        ...prev,
        LAND_LOSER_PHOTO: [
          {
            id: initialClaim.photo_doc_id!,
            file_name: initialClaim.photo_doc_id!,
            size_bytes: 1024,
            file_size_kb: 1,
            mime_type: "image/jpeg",
            uploaded_at: new Date().toISOString(),
            virus_scan_status: "clean",
          },
        ],
      }));
    }
  }, [initialClaim]);

  // Master Data Lookup Hooks for Demographics
  const { data: casteMaster } = useMasterQuery({ master: "caste" });

  const [uploadedDocs, setUploadedDocs] = React.useState<
    Record<string, UploadedDoc[]>
  >({});
  const [selectedUploadDocType, setSelectedUploadDocType] =
    React.useState<string>("");

  const DOC_TYPES = React.useMemo(
    () => [
      {
        key: "LAND_LOSER_PHOTO",
        label: "Passport Size Photo",
        isMandatory: true,
      },
      {
        key: "MAG_AFFIDAVIT",
        label: "First-Class Magistrate Affidavit",
        isMandatory: true,
      },
      {
        key: "BANK_PASSBOOK",
        label: "Bank Passbook / Cheque",
        isMandatory: true,
      },
      {
        key: "LINK_DEED",
        label: "Parcha / Title Deed Proof",
        isMandatory: false,
      },
    ],
    [],
  );

  const steps = [
    {
      key: "identity",
      title: "Identity & Demographics",
      description: "Q1 - Q7 Profile & Master Lookup",
      icon: ShieldCheck,
    },
    {
      key: "plot",
      title: "Plot Schedule (Q8)",
      description: "Location & Multi-Plot Table",
      icon: MapPin,
    },
    {
      key: "bank",
      title: "Financial & Bank (Q10)",
      description: "RTGS Compensation Payout",
      icon: IndianRupee,
    },
    {
      key: "declarations_docs",
      title: "Declarations & Uploads",
      description: "Q9-Q15 Declarations & Mandatory Docs",
      icon: Camera,
    },
    {
      key: "review",
      title: "Review & Certify",
      description: "Digital Signature & Submit",
      icon: CheckCircle2,
    },
  ];

  const handleProfileDetected = (profile: any) => {
    setForm((prev) => ({
      ...prev,
      claimant_name: profile.full_name || prev.claimant_name,
      father_husband_name:
        profile.father_husband_name || prev.father_husband_name,
      present_address: profile.present_address || prev.present_address,
      permanent_address: profile.permanent_address || prev.permanent_address,
      occupation: profile.occupation || prev.occupation,
      gender: profile.gender || prev.gender,
      religion: profile.religion || prev.religion,
      caste_category: profile.caste_category || prev.caste_category,
      bank_name: profile.bank_name || prev.bank_name,
      bank_branch: profile.bank_branch || prev.bank_branch,
      bank_account_number:
        profile.bank_account_number || prev.bank_account_number,
      bank_ifsc: profile.bank_ifsc || prev.bank_ifsc,
    }));
  };

  const removePlotEntry = (index: number) => {
    setPlotEntries((prev) => prev.filter((_, i) => i !== index));
  };

  const updatePlotEntry = (
    index: number,
    field: keyof PlotEntry,
    value: any,
  ) => {
    setPlotEntries((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Add plot by selecting from search dropdown
  const handleSelectPlotFromSearch = (plot: PlotItem) => {
    const rawPlotNo = plot.plot_no || plot.plot_number;
    const cleanNo = getDisplayPlotNo(rawPlotNo, plot.state_lgd, plot.mouza_lgd);

    if (
      plotEntries.some((p) => p.plot_id === plot.id || p.plot_no === rawPlotNo)
    ) {
      toast.warning(`${cleanNo} is already added in the schedule table`);
      return;
    }

    setPlotEntries((prev) => [
      ...prev,
      {
        plot_id: plot.id,
        plot_no: rawPlotNo,
        mouza_name: plot.mouza,
        state_lgd: plot.state_lgd,
        mouza_lgd: plot.mouza_lgd,
        khatian_no: "",
        own_share_acres: plot.area_acres,
        total_ror_area: plot.area_acres,
        opted_monetary_in_lieu_of_employment: false,
      },
    ]);
    toast.success(`${cleanNo} Added`);
  };

  const onStepChange = (next: number) => {
    setStep(next);
    setMaxVisited((m) => Math.max(m, next));
    toast.info("Step auto-saved", {
      description: `Draft persisted at step ${next + 1}`,
    });
  };

  const submit = useMutation({
    mutationFn: async () => {
      setSubmitting(true);
      const primaryPlot = plotEntries[0] || {};
      const primaryOwnShare = Number(primaryPlot.own_share_acres) || 0;
      const totalOwnShareAcres = plotEntries
        .reduce((sum, p) => sum + (Number(p.own_share_acres) || 0), 0)
        .toFixed(4);

      const payload = {
        ...form,
        authType,
        aadhaarNumber: authType === "aadhaar" ? identifier : undefined,
        epicNo: authType === "epic" ? identifier : undefined,
        plot_id: primaryPlot.plot_id,
        khatian_no: primaryPlot.khatian_no,
        own_share_acres: (primaryOwnShare > 0
          ? primaryOwnShare
          : Number(totalOwnShareAcres)
        ).toFixed(4),
        total_claim_share_acres: totalOwnShareAcres,
        plot_entries: plotEntries,
        plots: plotEntries.map((p) => ({
          plot_schedule_id: p.plot_id,
          plot_no: p.plot_no,
          khatian_no: p.khatian_no,
          own_share_acres: p.own_share_acres,
          total_ror_area: p.total_ror_area,
        })),
        opted_monetary_in_lieu_of_employment:
          primaryPlot.opted_monetary_in_lieu_of_employment ||
          form.opted_monetary_in_lieu_of_employment,
        photo_doc_id:
          uploadedDocs.LAND_LOSER_PHOTO?.[0]?.id ||
          uploadedDocs.LAND_LOSER_PHOTO?.[0]?.file_name,
        magistrate_affidavit_doc_id:
          uploadedDocs.MAG_AFFIDAVIT?.[0]?.id ||
          uploadedDocs.MAG_AFFIDAVIT?.[0]?.file_name,
        title_deed_doc_id:
          uploadedDocs.LINK_DEED?.[0]?.id ||
          uploadedDocs.LINK_DEED?.[0]?.file_name,
        passbook_doc_id:
          uploadedDocs.BANK_PASSBOOK?.[0]?.id ||
          uploadedDocs.BANK_PASSBOOK?.[0]?.file_name,
      };

      const isEdit = !!initialClaim?.id;
      const url = isEdit ? `/api/claims/${initialClaim.id}` : "/api/claims";
      const method = isEdit ? "PUT" : "POST";

      const r = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await r.json();
      if (!r.ok)
        throw new Error(
          data.error ?? (isEdit ? "Update failed" : "Submission failed"),
        );
      return { ...data, isEdit };
    },
    onSuccess: (data) => {
      const claimId = data.id || data.claim_code || initialClaim?.id;
      if (data.isEdit) {
        toast.success(
          `Claim ${initialClaim?.claim_code || claimId} Updated Successfully!`,
        );
      } else {
        toast.success(
          `Form-I Claim ${data.claim_code} Submitted Successfully!`,
        );
      }
      qc.invalidateQueries({ queryKey: ["claims"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      if (claimId && onOpenWorkspace && !data.isEdit) {
        onOpenWorkspace(claimId);
      } else {
        onDone();
      }
    },
    onError: (e: Error) =>
      toast.error("Save failed", { description: e.message }),
    onSettled: () => setSubmitting(false),
  });

  const isPlotStepValid =
    plotEntries.length > 0 &&
    plotEntries.every((p) => p.plot_id && p.own_share_acres);

  const filteredPlots = plots.filter((p) => {
    if (
      plotFilterNotification &&
      p.notification_no &&
      !p.notification_no
        .toLowerCase()
        .includes(plotFilterNotification.toLowerCase())
    ) {
      return false;
    }
    if (plotFilterState && p.state_lgd && p.state_lgd !== plotFilterState) {
      return false;
    }
    if (
      plotFilterDistrict &&
      p.district_lgd &&
      p.district_lgd !== plotFilterDistrict
    ) {
      return false;
    }
    if (plotFilterBlock && p.block_lgd && p.block_lgd !== plotFilterBlock) {
      return false;
    }
    if (plotFilterMouza && p.mouza_lgd && p.mouza_lgd !== plotFilterMouza) {
      return false;
    }
    if (
      plotSearchQuery &&
      !(p.plot_no || p.plot_number)
        .toLowerCase()
        .includes(plotSearchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {initialClaim && (
        <Alert className="bg-amber-50 border-amber-300 text-amber-900 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PenTool className="h-5 w-5 text-amber-600 animate-pulse" />
            <div>
              <span className="font-bold text-sm">Editing Existing Claim:</span>{" "}
              <code className="font-mono bg-amber-200/80 text-amber-950 font-bold px-2 py-0.5 rounded text-xs">
                {initialClaim.claim_code}
              </code>{" "}
              <span className="text-xs text-amber-800 ml-1">
                (Form pre-filled. Update any fields and click 'Update Claim'.)
              </span>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onDone}
            className="h-8 border-amber-600 text-amber-700 hover:bg-amber-100 font-semibold"
          >
            Cancel Edit & Return to List
          </Button>
        </Alert>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">
            {initialClaim
              ? `Edit Form-I Claim (${initialClaim.claim_code})`
              : "Form-I Claim Submission Wizard"}
          </h2>
          <p className="text-sm text-muted-foreground">
            Official Land Loser Application for Transfer of Land · Statutory
            15-Question Flow
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onDone}>
          ← Back to list
        </Button>
      </div>

      <WizardShell
        steps={steps}
        currentStep={step}
        onStepChange={onStepChange}
        maxVisitedStep={maxVisited}
        onSubmit={() => submit.mutate()}
        submitting={submitting}
        submitLabel={
          initialClaim
            ? `Update Claim (${initialClaim.claim_code})`
            : "Submit Form-I Claim"
        }
      >
        {/* Step 0: Radio Auth (Aadhaar / EPIC) + Demographics (Q1 - Q7) */}
        {step === 0 && (
          <div className="space-y-4">
            {!initialClaim && (
              <LandLoserKycStep
                authType={authType}
                setAuthType={setAuthType}
                identifier={identifier}
                setIdentifier={setIdentifier}
                onProfileDetected={handleProfileDetected}
                otpVerified={otpVerified}
                setOtpVerified={setOtpVerified}
              />
            )}

            {(otpVerified || !!initialClaim) && (
              <div className="space-y-4 rounded-lg border p-4 bg-card">
                <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50/70 p-3 text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200 shadow-xs mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xs">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold flex items-center gap-1.5">
                        Verified via{" "}
                        {authType === "epic"
                          ? "EPIC Identity Card"
                          : "Aadhaar e-KYC"}
                        <Badge
                          variant="outline"
                          className="border-emerald-600 bg-emerald-100/90 text-emerald-800 text-[10px] py-0 px-1.5 font-bold"
                        >
                          Authenticated
                        </Badge>
                      </div>
                      <div className="text-[11px] text-emerald-800/90 dark:text-emerald-300">
                        Citizen identity authenticated for land acquisition
                        claim records.
                      </div>
                    </div>
                  </div>
                </div>

                <h4 className="text-sm font-semibold border-b pb-2">
                  Step 1.2: Land Loser Demographic Details (Questions 1 - 7)
                </h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="1. Name of Land Loser (Full Name)">
                    <Input
                      value={form.claimant_name}
                      onChange={(e) =>
                        setForm({ ...form, claimant_name: e.target.value })
                      }
                      placeholder="Full Name as per Aadhaar/EPIC"
                    />
                  </Field>
                  <Field label="2. Name of Father / Husband">
                    <Input
                      value={form.father_husband_name}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          father_husband_name: e.target.value,
                        })
                      }
                      placeholder="Father or Husband name"
                    />
                  </Field>

                  {/* Location Master Dropdowns: State ➔ District ➔ Block ➔ Mouza */}
                  <div className="col-span-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 bg-muted/20 p-3 rounded-lg border border-border/60">
                    <Field label="State (Master)">
                      <StateSelect
                        value={form.state_lgd}
                        onChange={(val) => {
                          const v = Array.isArray(val)
                            ? val[0] || ""
                            : val || "";
                          setForm({
                            ...form,
                            state_lgd: v,
                            district_lgd: "",
                            block_lgd: "",
                            mouza_lgd: "",
                          });
                        }}
                        placeholder="— Select State —"
                      />
                    </Field>

                    <Field label="District (Master)">
                      <DistrictSelect
                        stateLgd={form.state_lgd}
                        value={form.district_lgd}
                        disabled={!form.state_lgd}
                        onChange={(val) => {
                          const v = Array.isArray(val)
                            ? val[0] || ""
                            : val || "";
                          setForm({
                            ...form,
                            district_lgd: v,
                            block_lgd: "",
                            mouza_lgd: "",
                          });
                        }}
                        placeholder="— Select District —"
                      />
                    </Field>

                    <Field label="Block (Master)">
                      <BlockSelect
                        districtLgd={form.district_lgd}
                        value={form.block_lgd}
                        disabled={!form.district_lgd}
                        onChange={(val) => {
                          const v = Array.isArray(val)
                            ? val[0] || ""
                            : val || "";
                          setForm({
                            ...form,
                            block_lgd: v,
                            mouza_lgd: "",
                          });
                        }}
                        placeholder="— Select Block —"
                      />
                    </Field>

                    <Field label="Mouza (Master)">
                      <MouzaSelect
                        blockLgd={form.block_lgd}
                        value={form.mouza_lgd}
                        disabled={!form.block_lgd}
                        onChange={(val) => {
                          const v = Array.isArray(val)
                            ? val[0] || ""
                            : val || "";
                          setForm({ ...form, mouza_lgd: v });
                        }}
                        placeholder="— Select Mouza —"
                      />
                    </Field>
                  </div>

                  <Field label="3. Present Address">
                    <textarea
                      rows={2}
                      value={form.present_address}
                      onChange={(e) => {
                        const val = e.target.value;
                        setForm({
                          ...form,
                          present_address: val,
                          permanent_address: form.same_as_present
                            ? val
                            : form.permanent_address,
                        });
                      }}
                      placeholder="Enter full present address"
                      className="w-full min-h-[64px] rounded-md border border-border bg-background p-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  </Field>

                  <Field label="3. Permanent Address">
                    <textarea
                      rows={2}
                      value={form.permanent_address}
                      disabled={form.same_as_present}
                      onChange={(e) =>
                        setForm({ ...form, permanent_address: e.target.value })
                      }
                      placeholder="Enter full permanent address"
                      className="w-full min-h-[64px] rounded-md border border-border bg-background p-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
                    />
                  </Field>

                  {/* Same Address Checkbox */}
                  <label className="col-span-2 flex items-center gap-2 text-xs font-medium cursor-pointer py-1">
                    <input
                      type="checkbox"
                      checked={form.same_as_present}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setForm({
                          ...form,
                          same_as_present: checked,
                          permanent_address: checked
                            ? form.present_address
                            : form.permanent_address,
                        });
                      }}
                      className="h-4 w-4 rounded border-border text-emerald-600 accent-emerald-600"
                    />
                    <span>Permanent address is same as Present address</span>
                  </label>

                  <Field label="4. Voter (EPIC) & Aadhaar Status">
                    <Input
                      disabled
                      value={`${authType.toUpperCase()}: ${identifier}`}
                      className="bg-muted font-mono text-xs"
                    />
                  </Field>

                  <Field label="6. Gender, Nationality & Religion">
                    <div className="grid grid-cols-3 gap-2">
                      <select
                        value={form.gender}
                        onChange={(e) =>
                          setForm({ ...form, gender: e.target.value })
                        }
                        className="h-9 rounded-md border border-border bg-background px-2 text-xs"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Transgender">Transgender</option>
                      </select>
                      <Input
                        value={form.nationality}
                        onChange={(e) =>
                          setForm({ ...form, nationality: e.target.value })
                        }
                        placeholder="Nationality"
                        className="text-xs"
                      />
                      <select
                        value={form.religion}
                        onChange={(e) =>
                          setForm({ ...form, religion: e.target.value })
                        }
                        className="h-9 rounded-md border border-border bg-background px-2 text-xs"
                      >
                        <option value="Hindu">Hindu</option>
                        <option value="Muslim">Muslim</option>
                        <option value="Sikh">Sikh</option>
                        <option value="Christian">Christian</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </Field>

                  {/* Single Row: PIN Code + Occupation + Caste Category (Master Only) */}
                  <div className="col-span-2 grid gap-3 grid-cols-1 sm:grid-cols-3 pt-1">
                    <Field label="PIN Code">
                      <Input
                        value={form.pincode}
                        onChange={(e) =>
                          setForm({ ...form, pincode: e.target.value })
                        }
                        placeholder="6-digit PIN"
                        maxLength={6}
                      />
                    </Field>

                    <Field label="5. Occupation">
                      <Input
                        value={form.occupation}
                        onChange={(e) =>
                          setForm({ ...form, occupation: e.target.value })
                        }
                        placeholder="e.g. Cultivator / Agriculture"
                      />
                    </Field>

                    <Field label="7. Caste / Category (Master Fetched)">
                      <CasteSelect
                        value={form.caste_category}
                        onChange={(val) =>
                          setForm({
                            ...form,
                            caste_category: Array.isArray(val)
                              ? val[0]
                              : val || "",
                          })
                        }
                        placeholder="— Select Caste Category —"
                        className="w-full text-sm font-medium"
                      />
                    </Field>
                  </div>
                </div>
              </div>
            )}

            <Button
              onClick={() => onStepChange(1)}
              disabled={!otpVerified || !form.claimant_name}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Next: Select Plot Schedule(s) (Q8) →
            </Button>
          </div>
        )}

        {/* Step 1: Multi-Plot Selection (Q8) */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-semibold flex items-center gap-2">
                <MapPin className="h-5 w-5 text-emerald-600" />
                Step 2: Multi-Plot Schedule Selection (Q8)
              </h3>
              <p className="text-xs text-muted-foreground">
                Filter by location (State ➔ District ➔ Block ➔ Mouza) and
                search/select plot numbers to populate the schedule.
              </p>
            </div>

            {/* Location Filter & Multi-Plot Search Box */}
            <div className="rounded-lg border bg-amber-50/60 dark:bg-amber-950/20 p-4 space-y-3 border-amber-200 shadow-sm">
              <div className="flex items-center justify-between border-b pb-2 border-amber-200">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider">
                  <Search className="h-4 w-4 text-amber-600" />
                  Search & Select Approved Plots (Master Location Filter)
                </div>
                {(plotFilterNotification ||
                  plotFilterState ||
                  plotFilterDistrict ||
                  plotFilterBlock ||
                  plotFilterMouza ||
                  plotSearchQuery) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setPlotFilterNotification("");
                      setPlotFilterState("");
                      setPlotFilterDistrict("");
                      setPlotFilterBlock("");
                      setPlotFilterMouza("");
                      setPlotSearchQuery("");
                    }}
                    className="h-6 text-[11px] text-amber-800 hover:bg-amber-100"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <Field label="State (Master)">
                  <StateSelect
                    value={plotFilterState}
                    showAllOption
                    onChange={(val) => {
                      const v = Array.isArray(val) ? val[0] || "" : val || "";
                      setPlotFilterState(v === "ALL" ? "" : v);
                      setPlotFilterDistrict("");
                      setPlotFilterBlock("");
                      setPlotFilterMouza("");
                    }}
                    placeholder="— All States —"
                  />
                </Field>

                <Field label="District (Master)">
                  <DistrictSelect
                    stateLgd={plotFilterState}
                    value={plotFilterDistrict}
                    disabled={!plotFilterState}
                    showAllOption
                    onChange={(val) => {
                      const v = Array.isArray(val) ? val[0] || "" : val || "";
                      setPlotFilterDistrict(v === "ALL" ? "" : v);
                      setPlotFilterBlock("");
                      setPlotFilterMouza("");
                    }}
                    placeholder="— All Districts —"
                  />
                </Field>

                <Field label="Block (Master)">
                  <BlockSelect
                    districtLgd={plotFilterDistrict}
                    value={plotFilterBlock}
                    disabled={!plotFilterDistrict}
                    showAllOption
                    onChange={(val) => {
                      const v = Array.isArray(val) ? val[0] || "" : val || "";
                      setPlotFilterBlock(v === "ALL" ? "" : v);
                      setPlotFilterMouza("");
                    }}
                    placeholder="— All Blocks —"
                  />
                </Field>

                <Field label="Mouza (Master)">
                  <MouzaSelect
                    blockLgd={plotFilterBlock}
                    value={plotFilterMouza}
                    disabled={!plotFilterBlock}
                    showAllOption
                    onChange={(val) => {
                      const v = Array.isArray(val) ? val[0] || "" : val || "";
                      setPlotFilterMouza(v === "ALL" ? "" : v);
                    }}
                    placeholder="— All Mouzas —"
                  />
                </Field>

                <Field label="Search & Add Approved Plot">
                  <div className="relative w-full">
                    <Input
                      type="text"
                      value={plotSearchQuery}
                      onChange={(e) => setPlotSearchQuery(e.target.value)}
                      placeholder="Type plot number or mouza to search..."
                      className="h-9 w-full rounded-md border border-emerald-600 bg-emerald-50/50 px-3 text-xs font-mono font-medium text-emerald-900 placeholder:text-muted-foreground/50 placeholder:font-normal placeholder:font-sans focus:bg-background"
                    />
                    {plotSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setPlotSearchQuery("")}
                        className="absolute right-2 top-2.5 text-xs text-muted-foreground hover:text-foreground font-bold"
                        title="Clear search input"
                      >
                        ✕
                      </button>
                    )}

                    {/* Auto-suggest dropdown when typing or focused */}
                    {plotSearchQuery.trim() && (
                      <div className="absolute z-50 left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-md border border-emerald-600 bg-popover p-1 shadow-lg divide-y divide-border">
                        {filteredPlots.length === 0 ? (
                          <div className="p-2.5 text-center text-xs text-muted-foreground italic">
                            No matching approved plot found for "
                            {plotSearchQuery}"
                          </div>
                        ) : (
                          filteredPlots.map((p) => {
                            const displayNo = getDisplayPlotNo(
                              p.plot_no || p.plot_number,
                              p.state_lgd,
                              p.mouza_lgd,
                            );
                            const isAlreadySelected = plotEntries.some(
                              (entry) => entry.plot_id === p.id,
                            );
                            return (
                              <button
                                key={p.id}
                                type="button"
                                disabled={isAlreadySelected}
                                onClick={() => {
                                  handleSelectPlotFromSearch(p);
                                  setPlotSearchQuery("");
                                }}
                                className={cn(
                                  "w-full text-left p-2 text-xs flex items-center justify-between rounded transition-colors font-mono",
                                  isAlreadySelected
                                    ? "opacity-50 cursor-not-allowed bg-muted/40"
                                    : "hover:bg-emerald-50 dark:hover:bg-emerald-950/60 cursor-pointer",
                                )}
                              >
                                <div>
                                  <span className="font-medium text-slate-900 dark:text-slate-100">
                                    {displayNo}
                                  </span>
                                  <span className="text-[11px] text-muted-foreground ml-2 font-sans">
                                    ({p.mouza || "Mouza"})
                                  </span>
                                </div>
                                <div className="text-right">
                                  <span className="font-bold text-emerald-700 dark:text-emerald-300">
                                    {formatNumber(p.area_acres, 4)} ac
                                  </span>
                                  {isAlreadySelected && (
                                    <span className="text-[10px] text-amber-700 ml-1.5 font-sans italic">
                                      (Added)
                                    </span>
                                  )}
                                </div>
                              </button>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                </Field>
              </div>

              {/* Selected Plot Tag Chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-amber-200/80">
                <span className="text-[11px] font-bold text-amber-900 dark:text-amber-300 mr-1">
                  Selected Plots:
                </span>
                {plotEntries.length === 0 ? (
                  <span className="text-[11px] italic text-muted-foreground">
                    No plot selected yet. Select a plot from the box above to
                    generate schedule table.
                  </span>
                ) : (
                  plotEntries.map((entry, idx) => {
                    const cleanNo = getDisplayPlotNo(
                      entry.plot_no,
                      entry.state_lgd,
                      entry.mouza_lgd,
                    );
                    return (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className="bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 border-emerald-300 gap-1 font-mono text-xs py-1 px-2.5 rounded-full"
                      >
                        {cleanNo}{" "}
                        {entry.mouza_name ? `(${entry.mouza_name})` : ""}
                        <button
                          type="button"
                          onClick={() => removePlotEntry(idx)}
                          className="text-emerald-800 hover:text-rose-600 font-bold ml-1 text-sm focus:outline-none"
                          title="Remove plot"
                        >
                          ×
                        </button>
                      </Badge>
                    );
                  })
                )}
              </div>
            </div>

            {/* Q8 Selected Plot Schedule Table */}
            {plotEntries.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-emerald-600" />
                    Q8 Selected Plot Schedule Table ({plotEntries.length} plot
                    line items)
                  </h4>
                  <span className="text-xs font-mono text-muted-foreground">
                    Total Share:{" "}
                    <strong className="text-emerald-700">
                      {plotEntries
                        .reduce(
                          (sum, p) => sum + (Number(p.own_share_acres) || 0),
                          0,
                        )
                        .toFixed(4)}{" "}
                      Acres
                    </strong>
                  </span>
                </div>

                <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-sm">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-muted/60 text-muted-foreground uppercase text-[10px] font-bold tracking-wider border-b border-border">
                        <th className="p-2.5 text-center w-10">#</th>
                        <th className="p-2.5 min-w-[220px]">
                          Plot No & Mouza (Selected)
                        </th>
                        <th className="p-2.5 min-w-[140px]">Khatian Number</th>
                        <th className="p-2.5 min-w-[140px]">
                          Own Share (Acres)
                        </th>
                        <th className="p-2.5 min-w-[130px]">Total ROR Area</th>
                        <th className="p-2.5 min-w-[320px]">
                          Opted Monetary Compensation in Lieu of Employment
                        </th>
                        <th className="p-2.5 text-center w-12">Remove</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {plotEntries.map((entry, idx) => {
                        const cleanNo = getDisplayPlotNo(
                          entry.plot_no,
                          entry.state_lgd,
                          entry.mouza_lgd,
                        );
                        return (
                          <tr
                            key={idx}
                            className="hover:bg-muted/30 transition-colors"
                          >
                            {/* Sl No */}
                            <td className="p-2.5 text-center font-mono font-bold text-muted-foreground">
                              {idx + 1}
                            </td>

                            {/* Clean Plot No & Mouza Display (No Plot# prefix, No StateCode/Mouza_LGD prefix) */}
                            <td className="p-2.5">
                              <Input
                                disabled
                                value={`${cleanNo} · ${entry.mouza_name || "Approved Mouza"}`}
                                className="h-8 bg-muted font-mono font-medium text-xs text-slate-800 dark:text-slate-200 border-slate-300"
                              />
                            </td>

                            {/* Khatian Number Input */}
                            <td className="p-2.5">
                              <Input
                                value={entry.khatian_no}
                                onChange={(e) =>
                                  updatePlotEntry(
                                    idx,
                                    "khatian_no",
                                    e.target.value,
                                  )
                                }
                                placeholder="e.g. Kh-104/A"
                                className="h-8 text-xs"
                              />
                            </td>

                            {/* Own Share in Acres Input */}
                            <td className="p-2.5">
                              <Input
                                type="number"
                                step="0.0001"
                                value={entry.own_share_acres}
                                onChange={(e) =>
                                  updatePlotEntry(
                                    idx,
                                    "own_share_acres",
                                    e.target.value,
                                  )
                                }
                                placeholder="e.g. 0.5000"
                                className="h-8 text-xs font-mono font-bold text-emerald-800"
                              />
                            </td>

                            {/* Total ROR Area (Disabled Display) */}
                            <td className="p-2.5 font-mono text-xs text-muted-foreground font-semibold">
                              {entry.total_ror_area
                                ? `${entry.total_ror_area} ac`
                                : "—"}
                            </td>

                            {/* Side Checkbox / Tic */}
                            <td className="p-2.5">
                              <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer text-emerald-900 dark:text-emerald-300">
                                <input
                                  type="checkbox"
                                  checked={
                                    entry.opted_monetary_in_lieu_of_employment
                                  }
                                  onChange={(e) =>
                                    updatePlotEntry(
                                      idx,
                                      "opted_monetary_in_lieu_of_employment",
                                      e.target.checked,
                                    )
                                  }
                                  className="h-4 w-4 rounded border-border text-emerald-600 accent-emerald-600"
                                />
                                <span className="font-semibold text-emerald-800 dark:text-emerald-300 leading-tight">
                                  Agreed to accept &lsquo;One Time Monetary
                                  Compensation in lieu of employment&rsquo;
                                  against this land
                                </span>
                              </label>
                            </td>

                            {/* Delete Icon / Cross Button */}
                            <td className="p-2.5 text-center">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removePlotEntry(idx)}
                                className="h-7 w-7 p-0 text-rose-600 hover:bg-rose-50 rounded"
                                title="Delete line item"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <Button
              onClick={() => onStepChange(2)}
              disabled={!isPlotStepValid}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Next: Financial & Bank Details (Q10) →
            </Button>
          </div>
        )}

        {/* Step 2: Financial & Bank Details (Q10 ONLY) */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-semibold flex items-center gap-2">
                <IndianRupee className="h-5 w-5 text-emerald-600" />
                Step 3: Financial & Bank Account Details (Question 10)
              </h3>
              <p className="text-xs text-muted-foreground">
                Details of Bank Account for Direct RTGS Compensation Payout.
              </p>
            </div>

            <div className="space-y-4 rounded-lg border p-4 bg-card shadow-sm">
              <div className="space-y-3">
                <Label className="text-xs font-bold text-slate-800">
                  10. Details of Bank Account for Direct RTGS Compensation
                  Payout
                </Label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Bank Name">
                    <Input
                      value={form.bank_name}
                      onChange={(e) =>
                        setForm({ ...form, bank_name: e.target.value })
                      }
                      placeholder="e.g. State Bank of India"
                    />
                  </Field>
                  <Field label="Bank Branch Name">
                    <Input
                      value={form.bank_branch}
                      onChange={(e) =>
                        setForm({ ...form, bank_branch: e.target.value })
                      }
                      placeholder="e.g. ECL Area Branch"
                    />
                  </Field>
                  <Field label="Account Number">
                    <Input
                      value={form.bank_account_number}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          bank_account_number: e.target.value,
                        })
                      }
                      placeholder="Enter Bank Account number"
                    />
                  </Field>
                  <Field label="IFSC Code (11 characters)">
                    <Input
                      value={form.bank_ifsc}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          bank_ifsc: e.target.value.toUpperCase(),
                        })
                      }
                      placeholder="e.g. SBIN0001234"
                      maxLength={11}
                    />
                  </Field>
                </div>
              </div>
            </div>

            <Button
              onClick={() => onStepChange(3)}
              disabled={!form.bank_account_number || !form.bank_ifsc}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Next: Declarations & Mandatory Uploads →
            </Button>
          </div>
        )}

        {/* Step 3: Statutory Declarations (Q9, Q11 - Q15) AND Mandatory Uploads */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-semibold flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-emerald-600" />
                Step 4: Statutory Declarations & Mandatory Document Uploads
              </h3>
              <p className="text-xs text-muted-foreground">
                Answer statutory declarations (Questions 9, 11-15) and upload
                mandatory self-attested documents.
              </p>
            </div>

            {/* Statutory Declarations Q9, Q11 - Q15 */}
            <div className="space-y-4 rounded-lg border p-4 bg-card shadow-sm">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900 border-b pb-2">
                Statutory Declarations (Questions 9, 11 - 15)
              </h4>

              {/* Q9: Prior Compensation Received */}
              <div className="space-y-2 border-b pb-3">
                <Label className="text-xs font-bold text-slate-800">
                  9. If any compensation has been received earlier for these
                  plots of lands from ECL or any other Authority by him/her or
                  his/her family? If so, give details:
                </Label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="q9"
                      checked={form.prior_compensation_received === true}
                      onChange={() =>
                        setForm({ ...form, prior_compensation_received: true })
                      }
                      className="accent-emerald-600"
                    />
                    <span>YES</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="q9"
                      checked={form.prior_compensation_received === false}
                      onChange={() =>
                        setForm({
                          ...form,
                          prior_compensation_received: false,
                          prior_compensation_details: "",
                        })
                      }
                      className="accent-emerald-600"
                    />
                    <span>NO</span>
                  </label>
                </div>
                {form.prior_compensation_received && (
                  <Input
                    value={form.prior_compensation_details}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        prior_compensation_details: e.target.value,
                      })
                    }
                    placeholder="Provide details of prior compensation received..."
                    className="text-xs mt-1"
                  />
                )}
              </div>

              {/* Q11: Prior Employment Linked */}
              <div className="space-y-2 border-b pb-3">
                <Label className="text-xs font-bold text-slate-800">
                  11. If any part of these plots was included in another
                  employment in ECL? If so, give details:
                </Label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="q11"
                      checked={form.prior_employment_linked === true}
                      onChange={() =>
                        setForm({ ...form, prior_employment_linked: true })
                      }
                      className="accent-emerald-600"
                    />
                    <span>YES</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="q11"
                      checked={form.prior_employment_linked === false}
                      onChange={() =>
                        setForm({
                          ...form,
                          prior_employment_linked: false,
                          prior_employment_details: "",
                        })
                      }
                      className="accent-emerald-600"
                    />
                    <span>NO</span>
                  </label>
                </div>
                {form.prior_employment_linked && (
                  <Input
                    value={form.prior_employment_details}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        prior_employment_details: e.target.value,
                      })
                    }
                    placeholder="Provide details of prior employment..."
                    className="text-xs mt-1"
                  />
                )}
              </div>

              {/* Q12: Free from Disputes */}
              <div className="space-y-2 border-b pb-3">
                <Label className="text-xs font-bold text-slate-800">
                  12. Whether these plots/lands are presently free from any
                  disputes or court case with the co-shares, bargadar or
                  adjacent landowners? If not so, give detail:
                </Label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="q12"
                      checked={form.is_free_from_disputes === true}
                      onChange={() =>
                        setForm({
                          ...form,
                          is_free_from_disputes: true,
                          dispute_details: "",
                        })
                      }
                      className="accent-emerald-600"
                    />
                    <span>YES</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="q12"
                      checked={form.is_free_from_disputes === false}
                      onChange={() =>
                        setForm({ ...form, is_free_from_disputes: false })
                      }
                      className="accent-emerald-600"
                    />
                    <span>NO</span>
                  </label>
                </div>
                {!form.is_free_from_disputes && (
                  <Input
                    value={form.dispute_details}
                    onChange={(e) =>
                      setForm({ ...form, dispute_details: e.target.value })
                    }
                    placeholder="Describe dispute or court case details..."
                    className="text-xs mt-1"
                  />
                )}
              </div>

              {/* Q13: Free from Encumbrances */}
              <div className="space-y-2 border-b pb-3">
                <Label className="text-xs font-bold text-slate-800">
                  13. Whether these plots/lands are presently free from any
                  encumbrances? If not, give details:
                </Label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="q13"
                      checked={form.is_free_from_encumbrances === true}
                      onChange={() =>
                        setForm({
                          ...form,
                          is_free_from_encumbrances: true,
                          encumbrance_details: "",
                        })
                      }
                      className="accent-emerald-600"
                    />
                    <span>YES</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="q13"
                      checked={form.is_free_from_encumbrances === false}
                      onChange={() =>
                        setForm({ ...form, is_free_from_encumbrances: false })
                      }
                      className="accent-emerald-600"
                    />
                    <span>NO</span>
                  </label>
                </div>
                {!form.is_free_from_encumbrances && (
                  <Input
                    value={form.encumbrance_details}
                    onChange={(e) =>
                      setForm({ ...form, encumbrance_details: e.target.value })
                    }
                    placeholder="Describe encumbrance details..."
                    className="text-xs mt-1"
                  />
                )}
              </div>

              {/* Q14: Peaceful Handover Possession */}
              <div className="space-y-2 border-b pb-3">
                <Label className="text-xs font-bold text-slate-800">
                  14. Whether he/she has able to handover peaceful and
                  encumbrance-free possession of above lands to the ECL? If not,
                  give reasons:
                </Label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="q14"
                      checked={form.can_handover_possession === true}
                      onChange={() =>
                        setForm({
                          ...form,
                          can_handover_possession: true,
                          possession_handover_reasons: "",
                        })
                      }
                      className="accent-emerald-600"
                    />
                    <span>YES</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="q14"
                      checked={form.can_handover_possession === false}
                      onChange={() =>
                        setForm({ ...form, can_handover_possession: false })
                      }
                      className="accent-emerald-600"
                    />
                    <span>NO</span>
                  </label>
                </div>
                {!form.can_handover_possession && (
                  <Input
                    value={form.possession_handover_reasons}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        possession_handover_reasons: e.target.value,
                      })
                    }
                    placeholder="Provide reasons if unable to handover possession..."
                    className="text-xs mt-1"
                  />
                )}
              </div>

              {/* Q15: Official Form-I Question 15 Wording */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-800">
                  15. Has he/she agreed to accept &lsquo;One time Monetary
                  compensation of CIL R&R Policy / One Time lumpsum / modified
                  annuity scheme of ECL in lieu of employment&rsquo; against
                  above land? If not, give reason:
                </Label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="q15"
                      checked={
                        form.opted_monetary_in_lieu_of_employment === true
                      }
                      onChange={() =>
                        setForm({
                          ...form,
                          opted_monetary_in_lieu_of_employment: true,
                          monetary_opt_reason: "",
                        })
                      }
                      className="accent-emerald-600"
                    />
                    <span>YES</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="q15"
                      checked={
                        form.opted_monetary_in_lieu_of_employment === false
                      }
                      onChange={() =>
                        setForm({
                          ...form,
                          opted_monetary_in_lieu_of_employment: false,
                        })
                      }
                      className="accent-emerald-600"
                    />
                    <span>NO</span>
                  </label>
                </div>
                {!form.opted_monetary_in_lieu_of_employment && (
                  <Input
                    value={form.monetary_opt_reason}
                    onChange={(e) =>
                      setForm({ ...form, monetary_opt_reason: e.target.value })
                    }
                    placeholder="Reason for preferring employment over cash..."
                    className="text-xs mt-1"
                  />
                )}
              </div>
            </div>

            {/* Dynamic Dropdown File Upload Selection & Uploaded Files List */}
            <div className="space-y-4">
              <Alert className="border-sky-200 bg-sky-50 dark:bg-sky-950/30">
                <ShieldCheck className="h-4 w-4 text-sky-600" />
                <AlertDescription className="text-sky-800 dark:text-sky-300">
                  Select a document type from the dropdown below to open the
                  file uploader. Upload self-attested Passport Photo, Magistrate
                  Affidavit, Bank Passbook, and Title Deeds.
                </AlertDescription>
              </Alert>

              {/* Document Type Dropdown Selector */}
              <div className="rounded-lg border bg-card p-4 space-y-4 shadow-sm border-border/80">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b pb-3">
                  <div>
                    <Label className="text-xs font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-300">
                      Select Document Category to Upload
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Choose document type to activate file browse box.
                    </p>
                  </div>

                  <select
                    value={selectedUploadDocType}
                    onChange={(e) => setSelectedUploadDocType(e.target.value)}
                    className="h-9 w-full sm:w-80 rounded-md border border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/40 px-3 text-xs font-bold text-emerald-900 dark:text-emerald-200"
                  >
                    <option value="">— Select Document Type to Upload —</option>
                    {DOC_TYPES.map((type) => {
                      const count = uploadedDocs[type.key]?.length ?? 0;
                      return (
                        <option key={type.key} value={type.key}>
                          {type.label}{" "}
                          {type.isMandatory ? "(Mandatory)" : "(Optional)"}{" "}
                          {count > 0 ? `✓ (${count} uploaded)` : ""}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Opened Compact & Aesthetic DocumentUploader Box for Selected Dropdown Item */}
                {selectedUploadDocType ? (
                  <div className="group relative overflow-hidden rounded-xl border-2 border-dashed border-emerald-400/80 dark:border-emerald-700/60 bg-gradient-to-r from-emerald-50/80 via-teal-50/40 to-background p-3 sm:p-3.5 shadow-sm hover:shadow-md transition-all duration-200">
                    {(() => {
                      const activeType = DOC_TYPES.find(
                        (d) => d.key === selectedUploadDocType,
                      );
                      if (!activeType) return null;
                      return (
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm group-hover:scale-105 transition-transform">
                              <UploadCloud className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                                  {activeType.label}
                                </span>
                                {activeType.isMandatory ? (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] border-rose-300 bg-rose-50 text-rose-700 font-mono py-0 h-4"
                                  >
                                    Mandatory
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] border-slate-300 text-slate-600 font-mono py-0 h-4"
                                  >
                                    Optional
                                  </Badge>
                                )}
                              </div>
                              <p className="text-[11px] text-muted-foreground mt-0.5">
                                PDF, JPG, PNG, DOCX (Self-Attested Max 10MB)
                              </p>
                            </div>
                          </div>

                          <div className="shrink-0 w-full sm:w-auto">
                            {(uploadedDocs[activeType.key]?.length ?? 0) > 0 ? (
                              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                                <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-3 py-1.5 rounded-md border border-emerald-300 dark:border-emerald-800 flex items-center gap-1.5 shadow-xs">
                                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                                  1 File Uploaded
                                </span>
                                <span className="text-[10px] text-muted-foreground italic">
                                  (Delete in table below to re-upload)
                                </span>
                              </div>
                            ) : (
                              <DocumentUploader
                                checklist_item_key={activeType.key}
                                label=""
                                mode="single"
                                documents={uploadedDocs[activeType.key] ?? []}
                                onChange={(docs) => {
                                  const newDocs = Array.isArray(docs)
                                    ? docs
                                    : [docs];
                                  setUploadedDocs((prev) => ({
                                    ...prev,
                                    [activeType.key]: [
                                      newDocs[newDocs.length - 1],
                                    ],
                                  }));
                                  toast.success(
                                    `${activeType.label} uploaded successfully`,
                                  );
                                }}
                                onRemove={(doc) =>
                                  setUploadedDocs((prev) => ({
                                    ...prev,
                                    [activeType.key]: (
                                      prev[activeType.key] ?? []
                                    ).filter(
                                      (d) => d.file_name !== doc.file_name,
                                    ),
                                  }))
                                }
                              />
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="p-3 text-center text-xs italic text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                    Select a document category from the dropdown menu above to
                    activate file browser.
                  </div>
                )}
              </div>

              {/* Uploaded Documents Row List / Table (With Green Tick, View, & Delete Cross Sign) */}
              <div className="rounded-lg border bg-card p-4 space-y-3 shadow-sm border-border/80">
                <div className="flex items-center justify-between border-b pb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <FileCheck className="h-4 w-4 text-emerald-600" />
                    Uploaded Documents Checklist Table
                  </h4>
                  <span className="text-xs font-mono text-muted-foreground">
                    Total Files Uploaded:{" "}
                    <strong className="text-emerald-700">
                      {DOC_TYPES.reduce(
                        (sum, t) => sum + (uploadedDocs[t.key]?.length || 0),
                        0,
                      )}{" "}
                      file(s)
                    </strong>
                  </span>
                </div>

                {DOC_TYPES.every(
                  (t) => (uploadedDocs[t.key]?.length || 0) === 0,
                ) ? (
                  <div className="p-4 text-center text-xs text-muted-foreground italic border border-dashed rounded-md bg-muted/20">
                    No documents uploaded yet. Choose a document category from
                    the dropdown above to upload.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-md border border-border">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-muted/60 text-muted-foreground uppercase text-[10px] font-bold tracking-wider border-b border-border">
                          <th className="p-2.5 text-center w-12">Status</th>
                          <th className="p-2.5 min-w-[220px]">Document Type</th>
                          <th className="p-2.5 min-w-[220px]">
                            File Name & Size
                          </th>
                          <th className="p-2.5 text-center min-w-[100px]">
                            View
                          </th>
                          <th className="p-2.5 text-center w-14">Remove</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {DOC_TYPES.map((type) => {
                          const docs = uploadedDocs[type.key] || [];
                          if (docs.length === 0) return null;
                          return docs.map((doc, idx) => (
                            <tr
                              key={`${type.key}-${idx}`}
                              className="hover:bg-muted/30 transition-colors"
                            >
                              {/* Green Tick Status Icon */}
                              <td className="p-2.5 text-center">
                                <div
                                  className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600"
                                  title="Self-Attested Upload Verified"
                                >
                                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                </div>
                              </td>

                              {/* Document Type Label & Mandatory Badge */}
                              <td className="p-2.5">
                                <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                                  {type.label}
                                  {type.isMandatory ? (
                                    <Badge
                                      variant="outline"
                                      className="text-[10px] border-rose-300 bg-rose-50 text-rose-700 font-mono"
                                    >
                                      Mandatory
                                    </Badge>
                                  ) : (
                                    <Badge
                                      variant="outline"
                                      className="text-[10px] border-slate-300 text-slate-600 font-mono"
                                    >
                                      Optional
                                    </Badge>
                                  )}
                                </div>
                                <span className="font-mono text-[10px] text-muted-foreground">
                                  {type.key}
                                </span>
                              </td>

                              {/* File Name & Size */}
                              <td className="p-2.5 font-mono text-xs">
                                <div
                                  className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[240px]"
                                  title={doc.file_name}
                                >
                                  {doc.file_name}
                                </div>
                                <span className="text-[11px] text-muted-foreground">
                                  {doc.file_size_kb || 0} KB
                                </span>
                              </td>

                              {/* View Button */}
                              <td className="p-2.5 text-center">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    if (doc.id) {
                                      window.open(
                                        `/api/files/${doc.id}/download`,
                                        "_blank",
                                      );
                                    } else {
                                      window.open(
                                        `/api/files/download/${doc.file_name}`,
                                        "_blank",
                                      );
                                    }
                                  }}
                                  className="h-7 text-xs border-emerald-600 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950 gap-1 font-medium"
                                >
                                  <Eye className="h-3.5 w-3.5" /> View
                                </Button>
                              </td>

                              {/* Remove / Delete Cross Sign Button */}
                              <td className="p-2.5 text-center">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    setUploadedDocs((prev) => ({
                                      ...prev,
                                      [type.key]: (prev[type.key] ?? []).filter(
                                        (d) => d.file_name !== doc.file_name,
                                      ),
                                    }))
                                  }
                                  className="h-7 w-7 p-0 text-rose-600 hover:bg-rose-50 rounded"
                                  title="Delete uploaded file"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          ));
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <Button
              onClick={() => onStepChange(4)}
              disabled={
                (uploadedDocs.MAG_AFFIDAVIT?.length ?? 0) === 0 ||
                (uploadedDocs.BANK_PASSBOOK?.length ?? 0) === 0
              }
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Next: Review & Statutory Certification →
            </Button>
          </div>
        )}

        {/* Step 4: Final Review & Certification Agreement */}
        {step === 4 && (
          <div className="space-y-3">
            <Alert className="border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 py-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <AlertDescription className="text-emerald-900 dark:text-emerald-200 text-xs">
                <strong>Final Review Before Submission:</strong> Please
                carefully review all entered particulars below from Step 1
                through Step 4 before certifying & locking your digital Form-I
                claim.
              </AlertDescription>
            </Alert>

            {/* 1. Land Loser Personal & Identity Details */}
            <div className="rounded-lg border bg-card p-3 space-y-2 shadow-xs">
              <div className="flex items-center justify-between border-b pb-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-emerald-600" />
                  1. Land Loser Personal & Identity Profile
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onStepChange(0)}
                  className="h-6 text-[11px] text-emerald-700 hover:bg-emerald-50"
                >
                  Edit Profile →
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[11px]">
                    Full Name
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {form.claimant_name || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">
                    Father / Husband Name
                  </span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {form.father_husband_name || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">
                    Identity Instrument
                  </span>
                  <span className="font-mono font-bold text-emerald-800 dark:text-emerald-300">
                    {authType.toUpperCase()}: {identifier || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">
                    Occupation
                  </span>
                  <span className="font-medium">
                    {form.occupation || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">
                    Gender / Caste Category
                  </span>
                  <span className="font-medium">
                    {form.gender || "N/A"} ({form.caste_category || "General"})
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">
                    Nationality / Religion
                  </span>
                  <span className="font-medium">
                    {form.nationality || "Indian"} / {form.religion || "N/A"}
                  </span>
                </div>
                <div className="sm:col-span-2 md:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-dashed">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">
                      Present Address
                    </span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {form.present_address || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">
                      Permanent Address
                    </span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {form.permanent_address || "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Land Acquisition Plot Schedule Table */}
            <div className="rounded-lg border bg-card p-3 space-y-2 shadow-xs">
              <div className="flex items-center justify-between border-b pb-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-emerald-600" />
                  2. Land Acquisition Plot Schedule ({plotEntries.length}{" "}
                  plot(s))
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onStepChange(1)}
                  className="h-6 text-[11px] text-emerald-700 hover:bg-emerald-50"
                >
                  Edit Plots →
                </Button>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-emerald-50/60 dark:bg-emerald-950/40 rounded border border-emerald-200 text-xs">
                <div>
                  <span className="text-muted-foreground">
                    Total Claimed Land Share:{" "}
                  </span>
                  <strong className="font-mono text-emerald-800 dark:text-emerald-300 font-bold text-sm">
                    {plotEntries
                      .reduce(
                        (sum, p) => sum + (Number(p.own_share_acres) || 0),
                        0,
                      )
                      .toFixed(4)}{" "}
                    acres
                  </strong>
                </div>
                <div>
                  <span className="text-muted-foreground">
                    R&R Scheme Benefit:{" "}
                  </span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs font-bold font-mono ml-1",
                      plotEntries.reduce(
                        (sum, p) => sum + (Number(p.own_share_acres) || 0),
                        0,
                      ) >= 2.0
                        ? "border-emerald-600 bg-emerald-100 text-emerald-800"
                        : "border-amber-600 bg-amber-50 text-amber-900",
                    )}
                  >
                    {plotEntries.reduce(
                      (sum, p) => sum + (Number(p.own_share_acres) || 0),
                      0,
                    ) >= 2.0
                      ? "Form-V Employment Eligible (2.0+ acres)"
                      : "One-Time Cash Compensation (Under 2.0 acres)"}
                  </Badge>
                </div>
              </div>

              <div className="overflow-x-auto rounded border border-border">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-muted/60 text-muted-foreground uppercase text-[10px] font-bold tracking-wider border-b">
                      <th className="p-2">Sl</th>
                      <th className="p-2">Mouza / LGD</th>
                      <th className="p-2">Plot No</th>
                      <th className="p-2">Khatian No</th>
                      <th className="p-2">Total ROR Area</th>
                      <th className="p-2">Own Share (Acres)</th>
                      <th className="p-2">Compensation Preference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {plotEntries.map((p, idx) => (
                      <tr key={idx} className="hover:bg-muted/20">
                        <td className="p-2 font-mono text-center">{idx + 1}</td>
                        <td className="p-2 font-medium">
                          {p.mouza_name || "Mouza"}
                        </td>
                        <td className="p-2 font-bold font-mono text-slate-900 dark:text-slate-100">
                          {getDisplayPlotNo(p.plot_no)}
                        </td>
                        <td className="p-2 font-mono">
                          {p.khatian_no || "Kh-102"}
                        </td>
                        <td className="p-2 font-mono">
                          {p.total_ror_area || p.own_share_acres} ac
                        </td>
                        <td className="p-2 font-mono font-bold text-emerald-700 dark:text-emerald-300">
                          {p.own_share_acres} ac
                        </td>
                        <td className="p-2">
                          {p.opted_monetary_in_lieu_of_employment ? (
                            <span className="text-[11px] text-amber-800 font-medium">
                              One-Time Cash Preferred
                            </span>
                          ) : (
                            <span className="text-[11px] text-emerald-800 font-medium">
                              Employment Nomination
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 3. Bank Account & Direct Disbursement Details */}
            <div className="rounded-lg border bg-card p-3 space-y-2 shadow-xs">
              <div className="flex items-center justify-between border-b pb-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <IndianRupee className="h-4 w-4 text-emerald-600" />
                  3. Bank Account for Cash Compensation & Direct Payments
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onStepChange(2)}
                  className="h-6 text-[11px] text-emerald-700 hover:bg-emerald-50"
                >
                  Edit Bank →
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[11px]">
                    Bank Name
                  </span>
                  <span className="font-semibold">
                    {form.bank_name || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">
                    Branch Name
                  </span>
                  <span className="font-medium">
                    {form.bank_branch || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">
                    Account Number
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                    {form.bank_account_number || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">
                    IFSC Code
                  </span>
                  <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">
                    {form.bank_ifsc || "N/A"}
                  </span>
                </div>
              </div>
            </div>

            {/* 4. Statutory Declarations (Questions 9 - 15) */}
            <div className="rounded-lg border bg-card p-3 space-y-2 shadow-xs">
              <div className="flex items-center justify-between border-b pb-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  4. Statutory Declarations & Answers (Questions 9 - 15)
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onStepChange(3)}
                  className="h-6 text-[11px] text-emerald-700 hover:bg-emerald-50"
                >
                  Edit Declarations →
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-2 text-xs">
                <div className="p-2 rounded bg-muted/30 border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="font-medium">
                    9. Prior compensation received from ECL or other Authority?
                  </span>
                  <div className="shrink-0 font-bold font-mono">
                    {form.prior_compensation_received ? (
                      <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        YES (
                        {form.prior_compensation_details || "Details provided"})
                      </span>
                    ) : (
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        NO
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-2 rounded bg-muted/30 border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="font-medium">
                    11. Any part of plots included in another employment in ECL?
                  </span>
                  <div className="shrink-0 font-bold font-mono">
                    {form.prior_employment_linked ? (
                      <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        YES (
                        {form.prior_employment_details || "Details provided"})
                      </span>
                    ) : (
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        NO
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-2 rounded bg-muted/30 border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="font-medium">
                    12. Plots free from any disputes / court cases with
                    co-sharers or bargadars?
                  </span>
                  <div className="shrink-0 font-bold font-mono">
                    {form.is_free_from_disputes !== false ? (
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        YES
                      </span>
                    ) : (
                      <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        NO ({form.dispute_details || "Dispute exists"})
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-2 rounded bg-muted/30 border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="font-medium">
                    13. Plots free from any encumbrances?
                  </span>
                  <div className="shrink-0 font-bold font-mono">
                    {form.is_free_from_encumbrances !== false ? (
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        YES
                      </span>
                    ) : (
                      <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        NO ({form.encumbrance_details || "Encumbrance exists"})
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-2 rounded bg-muted/30 border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="font-medium">
                    14. Able to handover peaceful & encumbrance-free possession
                    to ECL?
                  </span>
                  <div className="shrink-0 font-bold font-mono">
                    {form.can_handover_possession !== false ? (
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        YES
                      </span>
                    ) : (
                      <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        NO (
                        {form.possession_handover_reasons || "Reason provided"})
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-2 rounded bg-muted/30 border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="font-medium">
                    15. Agreed to accept One-Time Cash Compensation in lieu of
                    employment?
                  </span>
                  <div className="shrink-0 font-bold font-mono">
                    {form.opted_monetary_in_lieu_of_employment ? (
                      <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        YES (Accept One-Time Cash)
                      </span>
                    ) : (
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        NO (Prefer Employment Nomination via Form-V)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 5. Attached Self-Attested Documents */}
            <div className="rounded-lg border bg-card p-3 space-y-2 shadow-xs">
              <div className="flex items-center justify-between border-b pb-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <FileCheck className="h-4 w-4 text-emerald-600" />
                  5. Attached Self-Attested Mandatory Documents (
                  {DOC_TYPES.reduce(
                    (sum, t) => sum + (uploadedDocs[t.key]?.length || 0),
                    0,
                  )}{" "}
                  file(s))
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onStepChange(3)}
                  className="h-6 text-[11px] text-emerald-700 hover:bg-emerald-50"
                >
                  Manage Files →
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {DOC_TYPES.map((type) => {
                  const docs = uploadedDocs[type.key] || [];
                  const doc = docs[0];
                  return (
                    <div
                      key={type.key}
                      className="p-2 rounded border bg-muted/20 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2 truncate pr-2">
                        <CheckCircle2
                          className={cn(
                            "h-4 w-4 shrink-0",
                            doc ? "text-emerald-600" : "text-slate-300",
                          )}
                        />
                        <span className="font-medium truncate">
                          {type.label}
                        </span>
                      </div>
                      {doc ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (doc.id) {
                              window.open(
                                `/api/files/${doc.id}/download`,
                                "_blank",
                              );
                            } else {
                              window.open(
                                `/api/files/download/${doc.file_name}`,
                                "_blank",
                              );
                            }
                          }}
                          className="h-6 text-[10px] font-mono border-emerald-600 text-emerald-700 hover:bg-emerald-50 gap-1 px-2 shrink-0"
                        >
                          <Eye className="h-3 w-3" /> View
                        </Button>
                      ) : (
                        <span className="text-[10px] text-rose-600 font-mono italic shrink-0">
                          Not Attached
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Certification Agreement Checkbox */}
            <div className="rounded-lg border-2 border-emerald-600/40 bg-emerald-50/40 p-4 space-y-2">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.certified_accurate}
                  onChange={(e) =>
                    setForm({ ...form, certified_accurate: e.target.checked })
                  }
                  className="mt-1 h-4 w-4 rounded border-border text-emerald-600 accent-emerald-600"
                />
                <span className="text-xs text-slate-800 leading-relaxed font-medium">
                  <strong>Statutory Certification:</strong> I certify to the
                  best of my knowledge and belief that the particulars mentioned
                  above by me are genuine & authentic. Moreover, if any of the
                  particulars is found incorrect or suppressed at any time, my
                  nominee, if appointed, may be dismissed as per your company's
                  norms and regulation.
                </span>
              </label>
            </div>

            {submitting && (
              <div className="flex items-center justify-center gap-2 rounded-lg bg-amber-50 px-3 py-6 text-amber-800 dark:bg-amber-950/30">
                <Loader2 className="h-5 w-5 animate-spin" />
                Submitting Form-I Claim — please do not refresh…
              </div>
            )}
          </div>
        )}
      </WizardShell>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground/70">{hint}</p>}
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/60 bg-muted/30 p-2.5">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-medium">{value}</p>
    </div>
  );
}

function EditClaimModal({
  claim,
  onClose,
}: {
  claim: Claim | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [form, setForm] = React.useState<Partial<Claim>>({});
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (claim) {
      setForm({
        claimant_name: claim.claimant_name || "",
        father_husband_name: claim.father_husband_name || "",
        epic_no: claim.epic_no || "",
        caste_category: claim.caste_category || "GENERAL",
        occupation: claim.occupation || "",
        gender: claim.gender || "Male",
        religion: claim.religion || "",
        present_address: claim.present_address || "",
        permanent_address: claim.permanent_address || "",
        bank_name: claim.bank_name || "",
        bank_branch: claim.bank_branch || "",
        bank_account_number: claim.bank_account_number || "",
        bank_ifsc: claim.bank_ifsc || "",
      });
    }
  }, [claim]);

  if (!claim) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/claims/${claim.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update claim");
      toast.success(`Claim ${claim.claim_code} updated successfully!`);
      qc.invalidateQueries({ queryKey: ["claims"] });
      onClose();
    } catch (err: any) {
      toast.error("Failed to update claim: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={!!claim} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between border-b pb-3 mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Edit Form-I Claim
            </h3>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">
              {claim.claim_code}
            </p>
          </div>
          <Badge variant="outline" className="font-mono text-xs">
            {claim.state}
          </Badge>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold">Claimant Name *</Label>
              <Input
                value={form.claimant_name || ""}
                onChange={(e) =>
                  setForm({ ...form, claimant_name: e.target.value })
                }
                className="h-9 mt-1 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">
                Father / Husband Name
              </Label>
              <Input
                value={form.father_husband_name || ""}
                onChange={(e) =>
                  setForm({ ...form, father_husband_name: e.target.value })
                }
                className="h-9 mt-1 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold">Voter EPIC Number</Label>
              <Input
                value={form.epic_no || ""}
                onChange={(e) =>
                  setForm({ ...form, epic_no: e.target.value.toUpperCase() })
                }
                className="h-9 mt-1 text-sm font-mono"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">
                Caste / Category (Master)
              </Label>
              <div className="mt-1">
                <CasteSelect
                  value={form.caste_category}
                  onChange={(val) =>
                    setForm({
                      ...form,
                      caste_category: Array.isArray(val) ? val[0] : val || "",
                    })
                  }
                  placeholder="Select Caste Category"
                  className="w-full text-sm font-medium"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-xs font-semibold">Gender</Label>
              <Input
                value={form.gender || ""}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                className="h-9 mt-1 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">Religion</Label>
              <Input
                value={form.religion || ""}
                onChange={(e) => setForm({ ...form, religion: e.target.value })}
                className="h-9 mt-1 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">Occupation</Label>
              <Input
                value={form.occupation || ""}
                onChange={(e) =>
                  setForm({ ...form, occupation: e.target.value })
                }
                className="h-9 mt-1 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold">Present Address</Label>
              <Input
                value={form.present_address || ""}
                onChange={(e) =>
                  setForm({ ...form, present_address: e.target.value })
                }
                className="h-9 mt-1 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">Permanent Address</Label>
              <Input
                value={form.permanent_address || ""}
                onChange={(e) =>
                  setForm({ ...form, permanent_address: e.target.value })
                }
                className="h-9 mt-1 text-sm"
              />
            </div>
          </div>

          <div className="border-t pt-3">
            <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">
              Bank Details
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold">Bank Name</Label>
                <Input
                  value={form.bank_name || ""}
                  onChange={(e) =>
                    setForm({ ...form, bank_name: e.target.value })
                  }
                  className="h-9 mt-1 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Branch Name</Label>
                <Input
                  value={form.bank_branch || ""}
                  onChange={(e) =>
                    setForm({ ...form, bank_branch: e.target.value })
                  }
                  className="h-9 mt-1 text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <Label className="text-xs font-semibold">Account Number</Label>
                <Input
                  value={form.bank_account_number || ""}
                  onChange={(e) =>
                    setForm({ ...form, bank_account_number: e.target.value })
                  }
                  className="h-9 mt-1 text-sm font-mono"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">IFSC Code</Label>
                <Input
                  value={form.bank_ifsc || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      bank_ifsc: e.target.value.toUpperCase(),
                    })
                  }
                  className="h-9 mt-1 text-sm font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {claim.signed_form_i_doc_id && (
          <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-900 text-xs font-semibold mb-4">
            <Lock className="h-4 w-4 text-amber-600 shrink-0" />
            Signed Form-I document has already been uploaded & submitted for this claim. Editing is locked.
          </div>
        )}

        <div className="flex items-center justify-end gap-3 border-t pt-4 mt-6">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving || !!claim.signed_form_i_doc_id}
            className={cn(
              "font-medium",
              claim.signed_form_i_doc_id
                ? "bg-slate-200 text-slate-500 cursor-not-allowed hover:bg-slate-200"
                : "bg-emerald-600 hover:bg-emerald-700 text-white"
            )}
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : claim.signed_form_i_doc_id ? (
              <>
                <Lock className="w-3.5 h-3.5 mr-1.5" /> Editing Locked
              </>
            ) : null}
            {!claim.signed_form_i_doc_id && "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default FormIWizardView;
