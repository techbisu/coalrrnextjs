"use client";

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
  Plus,
  Trash2,
  Camera,
  Search,
  FileCheck,
  UploadCloud,
  X,
} from "lucide-react";
import { useMasterQuery } from "@/core/master-lookup";

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
  plot_id: string;
  plot_number: string;
  mouza: string;
  land_type: string;
  own_share_acres: string;
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
  can_handover_possession?: boolean;
  form_v_eligible?: boolean;
  state: string;
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

export function FormIWizardView() {
  const [mode, setMode] = React.useState<"list" | "wizard">("list");
  const [viewingClaim, setViewingClaim] = React.useState<Claim | null>(null);

  const { data: claims, isLoading } = useQuery({
    queryKey: ["claims"],
    queryFn: fetchClaims,
  });
  const { data: plots } = useQuery({
    queryKey: ["plots"],
    queryFn: fetchPlots,
  });

  if (mode === "wizard") {
    return <Wizard plots={plots ?? []} onDone={() => setMode("list")} />;
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
          onClick={() => setMode("wizard")}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <FileText className="h-4 w-4 mr-2" /> New Form-I Claim
        </Button>
      </div>

      <SectionCard
        title="Submitted Claims"
        icon={FileText}
        description="Landowner claims with workflow state + statutory Form-I sheet view"
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
                key: "plot_number",
                header: "Plot Schedule",
                render: (r) => (
                  <span className="font-mono text-xs font-semibold">
                    {getDisplayPlotNo(r.plot_number)} · {r.mouza}
                  </span>
                ),
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
                header: "State",
                render: (r) => <StateBadge state={r.state} />,
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
                header: "Official Sheet",
                align: "center",
                render: (r) => (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewingClaim(r)}
                    className="h-8 gap-1.5 text-xs border-emerald-600 text-emerald-700 hover:bg-emerald-50"
                  >
                    <Eye className="h-3.5 w-3.5" /> View Form-I
                  </Button>
                ),
              },
            ] as Column<Claim>[]
          }
          data={claims ?? []}
          getRowId={(r) => r.id}
          pageSize={10}
        />
      </SectionCard>

      {/* Pre-filled Statutory Form-I Sheet Dialog */}
      <Dialog
        open={!!viewingClaim}
        onOpenChange={(open) => !open && setViewingClaim(null)}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-4">
          {viewingClaim && (
            <FormIStatutoryDocumentView
              claim={viewingClaim}
              onClose={() => setViewingClaim(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Wizard({
  plots,
  onDone,
}: {
  plots: PlotItem[];
  onDone: () => void;
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
  const [plotFilterNotification, setPlotFilterNotification] = React.useState("");
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

  // Master Data Lookup Hooks for Demographics
  const { data: casteMaster } = useMasterQuery({ master: "caste" });
  const { data: stateMaster } = useMasterQuery({ master: "state" });
  const { data: districtMaster } = useMasterQuery(
    {
      master: "district",
      dependsOn: form.state_lgd ? { state_lgd: form.state_lgd } : undefined,
    },
    !!form.state_lgd
  );
  const { data: blockMaster } = useMasterQuery(
    {
      master: "block",
      dependsOn: form.district_lgd
        ? { district_lgd: form.district_lgd }
        : undefined,
    },
    !!form.district_lgd
  );
  const { data: mouzaMaster } = useMasterQuery(
    {
      master: "mouza",
      dependsOn: form.block_lgd ? { block_lgd: form.block_lgd } : undefined,
    },
    !!form.block_lgd
  );

  // Master Data Lookup Hooks for Plot Location Search Filter (State -> District -> Block -> Mouza)
  const { data: plotFilterStateMaster } = useMasterQuery({ master: "state" });
  const { data: plotFilterDistrictMaster } = useMasterQuery(
    {
      master: "district",
      dependsOn: plotFilterState ? { state_lgd: plotFilterState } : undefined,
    },
    !!plotFilterState
  );
  const { data: plotFilterBlockMaster } = useMasterQuery(
    {
      master: "block",
      dependsOn: plotFilterDistrict
        ? { district_lgd: plotFilterDistrict }
        : undefined,
    },
    !!plotFilterDistrict
  );
  const { data: plotFilterMouzaMaster } = useMasterQuery(
    {
      master: "mouza",
      dependsOn: plotFilterBlock ? { block_lgd: plotFilterBlock } : undefined,
    },
    !!plotFilterBlock
  );

  const [uploadedDocs, setUploadedDocs] = React.useState<
    Record<string, UploadedDoc[]>
  >({});
  const [selectedUploadDocType, setSelectedUploadDocType] = React.useState<string>("");

  const DOC_TYPES = React.useMemo(() => [
    { key: "LAND_LOSER_PHOTO", label: "Passport Size Photo", isMandatory: true },
    { key: "MAG_AFFIDAVIT", label: "First-Class Magistrate Affidavit", isMandatory: true },
    { key: "BANK_PASSBOOK", label: "Bank Passbook / Cheque", isMandatory: true },
    { key: "LINK_DEED", label: "Parcha / Title Deed Proof", isMandatory: false },
  ], []);

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

  const updatePlotEntry = (index: number, field: keyof PlotEntry, value: any) => {
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

    if (plotEntries.some((p) => p.plot_id === plot.id || p.plot_no === rawPlotNo)) {
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
        own_share_acres: (primaryOwnShare > 0 ? primaryOwnShare : Number(totalOwnShareAcres)).toFixed(4),
        total_claim_share_acres: totalOwnShareAcres,
        plot_entries: plotEntries,
        opted_monetary_in_lieu_of_employment:
          primaryPlot.opted_monetary_in_lieu_of_employment ||
          form.opted_monetary_in_lieu_of_employment,
        photo_doc_id: uploadedDocs.LAND_LOSER_PHOTO?.[0]?.file_name,
        magistrate_affidavit_doc_id: uploadedDocs.MAG_AFFIDAVIT?.[0]?.file_name,
        title_deed_doc_id: uploadedDocs.LINK_DEED?.[0]?.file_name,
        passbook_doc_id: uploadedDocs.BANK_PASSBOOK?.[0]?.file_name,
      };

      const r = await fetch("/api/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "Submission failed");
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Form-I Claim ${data.claim_code} Submitted Successfully!`, {
        description: `21-day statutory transparency window ends ${new Date(data.transparency_window_ends_at).toLocaleDateString("en-IN")}`,
      });
      qc.invalidateQueries({ queryKey: ["claims"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      onDone();
    },
    onError: (e: Error) =>
      toast.error("Submission failed", { description: e.message }),
    onSettled: () => setSubmitting(false),
  });

  const isPlotStepValid =
    plotEntries.length > 0 && plotEntries.every((p) => p.plot_id && p.own_share_acres);

  const filteredPlots = plots.filter((p) => {
    if (plotFilterNotification && p.notification_no && !p.notification_no.toLowerCase().includes(plotFilterNotification.toLowerCase())) {
      return false;
    }
    if (plotFilterState && p.state_lgd && p.state_lgd !== plotFilterState) {
      return false;
    }
    if (plotFilterDistrict && p.district_lgd && p.district_lgd !== plotFilterDistrict) {
      return false;
    }
    if (plotFilterBlock && p.block_lgd && p.block_lgd !== plotFilterBlock) {
      return false;
    }
    if (plotFilterMouza && p.mouza_lgd && p.mouza_lgd !== plotFilterMouza) {
      return false;
    }
    if (plotSearchQuery && !(p.plot_no || p.plot_number).toLowerCase().includes(plotSearchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">
            Form-I Claim Submission Wizard
          </h2>
          <p className="text-sm text-muted-foreground">
            Official Land Loser Application for Transfer of Land · Statutory 15-Question Flow
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
        submitLabel="Submit Form-I Claim"
      >
        {/* Step 0: Radio Auth (Aadhaar / EPIC) + Demographics (Q1 - Q7) */}
        {step === 0 && (
          <div className="space-y-4">
            <LandLoserKycStep
              authType={authType}
              setAuthType={setAuthType}
              identifier={identifier}
              setIdentifier={setIdentifier}
              onProfileDetected={handleProfileDetected}
              otpVerified={otpVerified}
              setOtpVerified={setOtpVerified}
            />

            {otpVerified && (
              <div className="space-y-4 rounded-lg border p-4 bg-card">
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
                      <select
                        value={form.state_lgd}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            state_lgd: e.target.value,
                            district_lgd: "",
                            block_lgd: "",
                            mouza_lgd: "",
                          })
                        }
                        className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
                      >
                        <option value="">— Select State —</option>
                        {stateMaster?.options?.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="District (Master)">
                      <select
                        value={form.district_lgd}
                        disabled={!form.state_lgd}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            district_lgd: e.target.value,
                            block_lgd: "",
                            mouza_lgd: "",
                          })
                        }
                        className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm disabled:opacity-50"
                      >
                        <option value="">— Select District —</option>
                        {districtMaster?.options?.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Block (Master)">
                      <select
                        value={form.block_lgd}
                        disabled={!form.district_lgd}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            block_lgd: e.target.value,
                            mouza_lgd: "",
                          })
                        }
                        className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm disabled:opacity-50"
                      >
                        <option value="">— Select Block —</option>
                        {blockMaster?.options?.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Mouza (Master)">
                      <select
                        value={form.mouza_lgd}
                        disabled={!form.block_lgd}
                        onChange={(e) =>
                          setForm({ ...form, mouza_lgd: e.target.value })
                        }
                        className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm disabled:opacity-50"
                      >
                        <option value="">— Select Mouza —</option>
                        {mouzaMaster?.options?.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
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
                        onChange={(e) => setForm({ ...form, gender: e.target.value })}
                        className="h-9 rounded-md border border-border bg-background px-2 text-xs"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Transgender">Transgender</option>
                      </select>
                      <Input
                        value={form.nationality}
                        onChange={(e) => setForm({ ...form, nationality: e.target.value })}
                        placeholder="Nationality"
                        className="text-xs"
                      />
                      <select
                        value={form.religion}
                        onChange={(e) => setForm({ ...form, religion: e.target.value })}
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
                      <select
                        value={form.caste_category}
                        onChange={(e) =>
                          setForm({ ...form, caste_category: e.target.value })
                        }
                        className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm font-medium"
                      >
                        <option value="">— Select Caste (Master) —</option>
                        {casteMaster?.options?.map((opt) => (
                          <option key={opt.value} value={opt.label || opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
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
                Filter by location (State ➔ District ➔ Block ➔ Mouza) and search/select plot numbers to populate the schedule.
              </p>
            </div>

            {/* Location Filter & Multi-Plot Search Box */}
            <div className="rounded-lg border bg-amber-50/60 dark:bg-amber-950/20 p-4 space-y-3 border-amber-200 shadow-sm">
              <div className="flex items-center justify-between border-b pb-2 border-amber-200">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider">
                  <Search className="h-4 w-4 text-amber-600" />
                  Search & Select Approved Plots (Master Location Filter)
                </div>
                {(plotFilterNotification || plotFilterState || plotFilterDistrict || plotFilterBlock || plotFilterMouza || plotSearchQuery) && (
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
                  <select
                    value={plotFilterState}
                    onChange={(e) => {
                      setPlotFilterState(e.target.value);
                      setPlotFilterDistrict("");
                      setPlotFilterBlock("");
                      setPlotFilterMouza("");
                    }}
                    className="h-9 w-full rounded-md border border-border bg-background px-2 text-xs"
                  >
                    <option value="">— All States —</option>
                    {plotFilterStateMaster?.options?.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="District (Master)">
                  <select
                    value={plotFilterDistrict}
                    disabled={!plotFilterState}
                    onChange={(e) => {
                      setPlotFilterDistrict(e.target.value);
                      setPlotFilterBlock("");
                      setPlotFilterMouza("");
                    }}
                    className="h-9 w-full rounded-md border border-border bg-background px-2 text-xs disabled:opacity-50"
                  >
                    <option value="">— All Districts —</option>
                    {plotFilterDistrictMaster?.options?.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Block (Master)">
                  <select
                    value={plotFilterBlock}
                    disabled={!plotFilterDistrict}
                    onChange={(e) => {
                      setPlotFilterBlock(e.target.value);
                      setPlotFilterMouza("");
                    }}
                    className="h-9 w-full rounded-md border border-border bg-background px-2 text-xs disabled:opacity-50"
                  >
                    <option value="">— All Blocks —</option>
                    {plotFilterBlockMaster?.options?.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Mouza (Master)">
                  <select
                    value={plotFilterMouza}
                    disabled={!plotFilterBlock}
                    onChange={(e) => setPlotFilterMouza(e.target.value)}
                    className="h-9 w-full rounded-md border border-border bg-background px-2 text-xs disabled:opacity-50 font-medium text-emerald-800"
                  >
                    <option value="">— All Mouzas —</option>
                    {plotFilterMouzaMaster?.options?.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
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
                            No matching approved plot found for "{plotSearchQuery}"
                          </div>
                        ) : (
                          filteredPlots.map((p) => {
                            const displayNo = getDisplayPlotNo(p.plot_no || p.plot_number, p.state_lgd, p.mouza_lgd);
                            const isAlreadySelected = plotEntries.some((entry) => entry.plot_id === p.id);
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
                                    : "hover:bg-emerald-50 dark:hover:bg-emerald-950/60 cursor-pointer"
                                )}
                              >
                                <div>
                                  <span className="font-medium text-slate-900 dark:text-slate-100">{displayNo}</span>
                                  <span className="text-[11px] text-muted-foreground ml-2 font-sans">({p.mouza || "Mouza"})</span>
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
                    No plot selected yet. Select a plot from the box above to generate schedule table.
                  </span>
                ) : (
                  plotEntries.map((entry, idx) => {
                    const cleanNo = getDisplayPlotNo(entry.plot_no, entry.state_lgd, entry.mouza_lgd);
                    return (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className="bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 border-emerald-300 gap-1 font-mono text-xs py-1 px-2.5 rounded-full"
                      >
                        {cleanNo} {entry.mouza_name ? `(${entry.mouza_name})` : ''}
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
                    Q8 Selected Plot Schedule Table ({plotEntries.length} plot line items)
                  </h4>
                  <span className="text-xs font-mono text-muted-foreground">
                    Total Share:{" "}
                    <strong className="text-emerald-700">
                      {plotEntries
                        .reduce((sum, p) => sum + (Number(p.own_share_acres) || 0), 0)
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
                        <th className="p-2.5 min-w-[220px]">Plot No & Mouza (Selected)</th>
                        <th className="p-2.5 min-w-[140px]">Khatian Number</th>
                        <th className="p-2.5 min-w-[140px]">Own Share (Acres)</th>
                        <th className="p-2.5 min-w-[130px]">Total ROR Area</th>
                        <th className="p-2.5 min-w-[320px]">Opted Monetary Compensation in Lieu of Employment</th>
                        <th className="p-2.5 text-center w-12">Remove</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {plotEntries.map((entry, idx) => {
                        const cleanNo = getDisplayPlotNo(entry.plot_no, entry.state_lgd, entry.mouza_lgd);
                        return (
                          <tr key={idx} className="hover:bg-muted/30 transition-colors">
                            {/* Sl No */}
                            <td className="p-2.5 text-center font-mono font-bold text-muted-foreground">
                              {idx + 1}
                            </td>

                            {/* Clean Plot No & Mouza Display (No Plot# prefix, No StateCode/Mouza_LGD prefix) */}
                            <td className="p-2.5">
                              <Input
                                disabled
                                value={`${cleanNo} · ${entry.mouza_name || 'Approved Mouza'}`}
                                className="h-8 bg-muted font-mono font-medium text-xs text-slate-800 dark:text-slate-200 border-slate-300"
                              />
                            </td>

                            {/* Khatian Number Input */}
                            <td className="p-2.5">
                              <Input
                                value={entry.khatian_no}
                                onChange={(e) =>
                                  updatePlotEntry(idx, "khatian_no", e.target.value)
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
                                  updatePlotEntry(idx, "own_share_acres", e.target.value)
                                }
                                placeholder="e.g. 0.5000"
                                className="h-8 text-xs font-mono font-bold text-emerald-800"
                              />
                            </td>

                            {/* Total ROR Area (Disabled Display) */}
                            <td className="p-2.5 font-mono text-xs text-muted-foreground font-semibold">
                              {entry.total_ror_area ? `${entry.total_ror_area} ac` : "—"}
                            </td>

                            {/* Side Checkbox / Tic */}
                            <td className="p-2.5">
                              <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer text-emerald-900 dark:text-emerald-300">
                                <input
                                  type="checkbox"
                                  checked={entry.opted_monetary_in_lieu_of_employment}
                                  onChange={(e) =>
                                    updatePlotEntry(idx, "opted_monetary_in_lieu_of_employment", e.target.checked)
                                  }
                                  className="h-4 w-4 rounded border-border text-emerald-600 accent-emerald-600"
                                />
                                <span className="font-semibold text-emerald-800 dark:text-emerald-300 leading-tight">
                                  Agreed to accept &lsquo;One Time Monetary Compensation in lieu of employment&rsquo; against this land
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
                  10. Details of Bank Account for Direct RTGS Compensation Payout
                </Label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Bank Name">
                    <Input
                      value={form.bank_name}
                      onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
                      placeholder="e.g. State Bank of India"
                    />
                  </Field>
                  <Field label="Bank Branch Name">
                    <Input
                      value={form.bank_branch}
                      onChange={(e) => setForm({ ...form, bank_branch: e.target.value })}
                      placeholder="e.g. ECL Area Branch"
                    />
                  </Field>
                  <Field label="Account Number">
                    <Input
                      value={form.bank_account_number}
                      onChange={(e) => setForm({ ...form, bank_account_number: e.target.value })}
                      placeholder="Enter Bank Account number"
                    />
                  </Field>
                  <Field label="IFSC Code (11 characters)">
                    <Input
                      value={form.bank_ifsc}
                      onChange={(e) => setForm({ ...form, bank_ifsc: e.target.value.toUpperCase() })}
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
                Answer statutory declarations (Questions 9, 11-15) and upload mandatory self-attested documents.
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
                  9. If any compensation has been received earlier for these plots of lands from ECL or any other Authority by him/her or his/her family? If so, give details:
                </Label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="q9"
                      checked={form.prior_compensation_received === true}
                      onChange={() => setForm({ ...form, prior_compensation_received: true })}
                      className="accent-emerald-600"
                    />
                    <span>YES</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="q9"
                      checked={form.prior_compensation_received === false}
                      onChange={() => setForm({ ...form, prior_compensation_received: false, prior_compensation_details: "" })}
                      className="accent-emerald-600"
                    />
                    <span>NO</span>
                  </label>
                </div>
                {form.prior_compensation_received && (
                  <Input
                    value={form.prior_compensation_details}
                    onChange={(e) => setForm({ ...form, prior_compensation_details: e.target.value })}
                    placeholder="Provide details of prior compensation received..."
                    className="text-xs mt-1"
                  />
                )}
              </div>

              {/* Q11: Prior Employment Linked */}
              <div className="space-y-2 border-b pb-3">
                <Label className="text-xs font-bold text-slate-800">
                  11. If any part of these plots was included in another employment in ECL? If so, give details:
                </Label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="q11"
                      checked={form.prior_employment_linked === true}
                      onChange={() => setForm({ ...form, prior_employment_linked: true })}
                      className="accent-emerald-600"
                    />
                    <span>YES</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="q11"
                      checked={form.prior_employment_linked === false}
                      onChange={() => setForm({ ...form, prior_employment_linked: false, prior_employment_details: "" })}
                      className="accent-emerald-600"
                    />
                    <span>NO</span>
                  </label>
                </div>
                {form.prior_employment_linked && (
                  <Input
                    value={form.prior_employment_details}
                    onChange={(e) => setForm({ ...form, prior_employment_details: e.target.value })}
                    placeholder="Provide details of prior employment..."
                    className="text-xs mt-1"
                  />
                )}
              </div>

              {/* Q12: Free from Disputes */}
              <div className="space-y-2 border-b pb-3">
                <Label className="text-xs font-bold text-slate-800">
                  12. Whether these plots/lands are presently free from any disputes or court case with the co-shares, bargadar or adjacent landowners? If not so, give detail:
                </Label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="q12"
                      checked={form.is_free_from_disputes === true}
                      onChange={() => setForm({ ...form, is_free_from_disputes: true, dispute_details: "" })}
                      className="accent-emerald-600"
                    />
                    <span>YES</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="q12"
                      checked={form.is_free_from_disputes === false}
                      onChange={() => setForm({ ...form, is_free_from_disputes: false })}
                      className="accent-emerald-600"
                    />
                    <span>NO</span>
                  </label>
                </div>
                {!form.is_free_from_disputes && (
                  <Input
                    value={form.dispute_details}
                    onChange={(e) => setForm({ ...form, dispute_details: e.target.value })}
                    placeholder="Describe dispute or court case details..."
                    className="text-xs mt-1"
                  />
                )}
              </div>

              {/* Q13: Free from Encumbrances */}
              <div className="space-y-2 border-b pb-3">
                <Label className="text-xs font-bold text-slate-800">
                  13. Whether these plots/lands are presently free from any encumbrances? If not, give details:
                </Label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="q13"
                      checked={form.is_free_from_encumbrances === true}
                      onChange={() => setForm({ ...form, is_free_from_encumbrances: true, encumbrance_details: "" })}
                      className="accent-emerald-600"
                    />
                    <span>YES</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="q13"
                      checked={form.is_free_from_encumbrances === false}
                      onChange={() => setForm({ ...form, is_free_from_encumbrances: false })}
                      className="accent-emerald-600"
                    />
                    <span>NO</span>
                  </label>
                </div>
                {!form.is_free_from_encumbrances && (
                  <Input
                    value={form.encumbrance_details}
                    onChange={(e) => setForm({ ...form, encumbrance_details: e.target.value })}
                    placeholder="Describe encumbrance details..."
                    className="text-xs mt-1"
                  />
                )}
              </div>

              {/* Q14: Peaceful Handover Possession */}
              <div className="space-y-2 border-b pb-3">
                <Label className="text-xs font-bold text-slate-800">
                  14. Whether he/she has able to handover peaceful and encumbrance-free possession of above lands to the ECL? If not, give reasons:
                </Label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="q14"
                      checked={form.can_handover_possession === true}
                      onChange={() => setForm({ ...form, can_handover_possession: true, possession_handover_reasons: "" })}
                      className="accent-emerald-600"
                    />
                    <span>YES</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="q14"
                      checked={form.can_handover_possession === false}
                      onChange={() => setForm({ ...form, can_handover_possession: false })}
                      className="accent-emerald-600"
                    />
                    <span>NO</span>
                  </label>
                </div>
                {!form.can_handover_possession && (
                  <Input
                    value={form.possession_handover_reasons}
                    onChange={(e) => setForm({ ...form, possession_handover_reasons: e.target.value })}
                    placeholder="Provide reasons if unable to handover possession..."
                    className="text-xs mt-1"
                  />
                )}
              </div>

              {/* Q15: Official Form-I Question 15 Wording */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-800">
                  15. Has he/she agreed to accept &lsquo;One time Monetary compensation of CIL R&R Policy / One Time lumpsum / modified annuity scheme of ECL in lieu of employment&rsquo; against above land? If not, give reason:
                </Label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="q15"
                      checked={form.opted_monetary_in_lieu_of_employment === true}
                      onChange={() => setForm({ ...form, opted_monetary_in_lieu_of_employment: true, monetary_opt_reason: "" })}
                      className="accent-emerald-600"
                    />
                    <span>YES</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="q15"
                      checked={form.opted_monetary_in_lieu_of_employment === false}
                      onChange={() => setForm({ ...form, opted_monetary_in_lieu_of_employment: false })}
                      className="accent-emerald-600"
                    />
                    <span>NO</span>
                  </label>
                </div>
                {!form.opted_monetary_in_lieu_of_employment && (
                  <Input
                    value={form.monetary_opt_reason}
                    onChange={(e) => setForm({ ...form, monetary_opt_reason: e.target.value })}
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
                  Select a document type from the dropdown below to open the file uploader. Upload self-attested Passport Photo, Magistrate Affidavit, Bank Passbook, and Title Deeds.
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
                      const count = (uploadedDocs[type.key]?.length ?? 0);
                      return (
                        <option key={type.key} value={type.key}>
                          {type.label} {type.isMandatory ? "(Mandatory)" : "(Optional)"} {count > 0 ? `✓ (${count} uploaded)` : ""}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Opened Compact & Aesthetic DocumentUploader Box for Selected Dropdown Item */}
                {selectedUploadDocType ? (
                  <div className="group relative overflow-hidden rounded-xl border-2 border-dashed border-emerald-400/80 dark:border-emerald-700/60 bg-gradient-to-r from-emerald-50/80 via-teal-50/40 to-background p-3 sm:p-3.5 shadow-sm hover:shadow-md transition-all duration-200">
                    {(() => {
                      const activeType = DOC_TYPES.find((d) => d.key === selectedUploadDocType);
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
                                  <Badge variant="outline" className="text-[10px] border-rose-300 bg-rose-50 text-rose-700 font-mono py-0 h-4">
                                    Mandatory
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-[10px] border-slate-300 text-slate-600 font-mono py-0 h-4">
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
                                  const newDocs = Array.isArray(docs) ? docs : [docs];
                                  setUploadedDocs((prev) => ({
                                    ...prev,
                                    [activeType.key]: [newDocs[newDocs.length - 1]],
                                  }));
                                  toast.success(`${activeType.label} uploaded successfully`);
                                }}
                                onRemove={(doc) =>
                                  setUploadedDocs((prev) => ({
                                    ...prev,
                                    [activeType.key]: (prev[activeType.key] ?? []).filter(
                                      (d) => d.file_name !== doc.file_name
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
                    Select a document category from the dropdown menu above to activate file browser.
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
                      {DOC_TYPES.reduce((sum, t) => sum + (uploadedDocs[t.key]?.length || 0), 0)} file(s)
                    </strong>
                  </span>
                </div>

                {DOC_TYPES.every((t) => (uploadedDocs[t.key]?.length || 0) === 0) ? (
                  <div className="p-4 text-center text-xs text-muted-foreground italic border border-dashed rounded-md bg-muted/20">
                    No documents uploaded yet. Choose a document category from the dropdown above to upload.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-md border border-border">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-muted/60 text-muted-foreground uppercase text-[10px] font-bold tracking-wider border-b border-border">
                          <th className="p-2.5 text-center w-12">Status</th>
                          <th className="p-2.5 min-w-[220px]">Document Type</th>
                          <th className="p-2.5 min-w-[220px]">File Name & Size</th>
                          <th className="p-2.5 text-center min-w-[100px]">View</th>
                          <th className="p-2.5 text-center w-14">Remove</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {DOC_TYPES.map((type) => {
                          const docs = uploadedDocs[type.key] || [];
                          if (docs.length === 0) return null;
                          return docs.map((doc, idx) => (
                            <tr key={`${type.key}-${idx}`} className="hover:bg-muted/30 transition-colors">
                              {/* Green Tick Status Icon */}
                              <td className="p-2.5 text-center">
                                <div className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600" title="Self-Attested Upload Verified">
                                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                </div>
                              </td>

                              {/* Document Type Label & Mandatory Badge */}
                              <td className="p-2.5">
                                <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                                  {type.label}
                                  {type.isMandatory ? (
                                    <Badge variant="outline" className="text-[10px] border-rose-300 bg-rose-50 text-rose-700 font-mono">
                                      Mandatory
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-[10px] border-slate-300 text-slate-600 font-mono">
                                      Optional
                                    </Badge>
                                  )}
                                </div>
                                <span className="font-mono text-[10px] text-muted-foreground">{type.key}</span>
                              </td>

                              {/* File Name & Size */}
                              <td className="p-2.5 font-mono text-xs">
                                <div className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[240px]" title={doc.file_name}>
                                  {doc.file_name}
                                </div>
                                <span className="text-[11px] text-muted-foreground">{doc.file_size_kb || 0} KB</span>
                              </td>

                              {/* View Button */}
                              <td className="p-2.5 text-center">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    if (doc.id) {
                                      window.open(`/api/files/${doc.id}/download`, "_blank");
                                    } else {
                                      window.open(`/api/files/download/${doc.file_name}`, "_blank");
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
                                        (d) => d.file_name !== doc.file_name
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
                <strong>Final Review Before Submission:</strong> Please carefully review all entered particulars below from Step 1 through Step 4 before certifying & locking your digital Form-I claim.
              </AlertDescription>
            </Alert>

            {/* 1. Land Loser Personal & Identity Details */}
            <div className="rounded-lg border bg-card p-3 space-y-2 shadow-xs">
              <div className="flex items-center justify-between border-b pb-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-emerald-600" />
                  1. Land Loser Personal & Identity Profile
                </h4>
                <Button variant="ghost" size="sm" onClick={() => onStepChange(0)} className="h-6 text-[11px] text-emerald-700 hover:bg-emerald-50">
                  Edit Profile →
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Full Name</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{form.claimant_name || "N/A"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Father / Husband Name</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{form.father_husband_name || "N/A"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Identity Instrument</span>
                  <span className="font-mono font-bold text-emerald-800 dark:text-emerald-300">{authType.toUpperCase()}: {identifier || "N/A"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Occupation</span>
                  <span className="font-medium">{form.occupation || "N/A"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Gender / Caste Category</span>
                  <span className="font-medium">{form.gender || "N/A"} ({form.caste_category || "General"})</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Nationality / Religion</span>
                  <span className="font-medium">{form.nationality || "Indian"} / {form.religion || "N/A"}</span>
                </div>
                <div className="sm:col-span-2 md:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-dashed">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Present Address</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{form.present_address || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Permanent Address</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{form.permanent_address || "N/A"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Land Acquisition Plot Schedule Table */}
            <div className="rounded-lg border bg-card p-3 space-y-2 shadow-xs">
              <div className="flex items-center justify-between border-b pb-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-emerald-600" />
                  2. Land Acquisition Plot Schedule ({plotEntries.length} plot(s))
                </h4>
                <Button variant="ghost" size="sm" onClick={() => onStepChange(1)} className="h-6 text-[11px] text-emerald-700 hover:bg-emerald-50">
                  Edit Plots →
                </Button>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-emerald-50/60 dark:bg-emerald-950/40 rounded border border-emerald-200 text-xs">
                <div>
                  <span className="text-muted-foreground">Total Claimed Land Share: </span>
                  <strong className="font-mono text-emerald-800 dark:text-emerald-300 font-bold text-sm">
                    {plotEntries.reduce((sum, p) => sum + (Number(p.own_share_acres) || 0), 0).toFixed(4)} acres
                  </strong>
                </div>
                <div>
                  <span className="text-muted-foreground">R&R Scheme Benefit: </span>
                  <Badge variant="outline" className={cn(
                    "text-xs font-bold font-mono ml-1",
                    plotEntries.reduce((sum, p) => sum + (Number(p.own_share_acres) || 0), 0) >= 2.0
                      ? "border-emerald-600 bg-emerald-100 text-emerald-800"
                      : "border-amber-600 bg-amber-50 text-amber-900"
                  )}>
                    {plotEntries.reduce((sum, p) => sum + (Number(p.own_share_acres) || 0), 0) >= 2.0
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
                        <td className="p-2 font-medium">{p.mouza_name || "Mouza"}</td>
                        <td className="p-2 font-bold font-mono text-slate-900 dark:text-slate-100">{getDisplayPlotNo(p.plot_no)}</td>
                        <td className="p-2 font-mono">{p.khatian_no || "Kh-102"}</td>
                        <td className="p-2 font-mono">{p.total_ror_area || p.own_share_acres} ac</td>
                        <td className="p-2 font-mono font-bold text-emerald-700 dark:text-emerald-300">{p.own_share_acres} ac</td>
                        <td className="p-2">
                          {p.opted_monetary_in_lieu_of_employment ? (
                            <span className="text-[11px] text-amber-800 font-medium">One-Time Cash Preferred</span>
                          ) : (
                            <span className="text-[11px] text-emerald-800 font-medium">Employment Nomination</span>
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
                <Button variant="ghost" size="sm" onClick={() => onStepChange(2)} className="h-6 text-[11px] text-emerald-700 hover:bg-emerald-50">
                  Edit Bank →
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Bank Name</span>
                  <span className="font-semibold">{form.bank_name || "N/A"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Branch Name</span>
                  <span className="font-medium">{form.bank_branch || "N/A"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Account Number</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{form.bank_account_number || "N/A"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">IFSC Code</span>
                  <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">{form.bank_ifsc || "N/A"}</span>
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
                <Button variant="ghost" size="sm" onClick={() => onStepChange(3)} className="h-6 text-[11px] text-emerald-700 hover:bg-emerald-50">
                  Edit Declarations →
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-2 text-xs">
                <div className="p-2 rounded bg-muted/30 border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="font-medium">9. Prior compensation received from ECL or other Authority?</span>
                  <div className="shrink-0 font-bold font-mono">
                    {form.prior_compensation_received ? (
                      <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">YES ({form.prior_compensation_details || "Details provided"})</span>
                    ) : (
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">NO</span>
                    )}
                  </div>
                </div>

                <div className="p-2 rounded bg-muted/30 border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="font-medium">11. Any part of plots included in another employment in ECL?</span>
                  <div className="shrink-0 font-bold font-mono">
                    {form.prior_employment_linked ? (
                      <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">YES ({form.prior_employment_details || "Details provided"})</span>
                    ) : (
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">NO</span>
                    )}
                  </div>
                </div>

                <div className="p-2 rounded bg-muted/30 border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="font-medium">12. Plots free from any disputes / court cases with co-sharers or bargadars?</span>
                  <div className="shrink-0 font-bold font-mono">
                    {form.is_free_from_disputes !== false ? (
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">YES</span>
                    ) : (
                      <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">NO ({form.dispute_details || "Dispute exists"})</span>
                    )}
                  </div>
                </div>

                <div className="p-2 rounded bg-muted/30 border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="font-medium">13. Plots free from any encumbrances?</span>
                  <div className="shrink-0 font-bold font-mono">
                    {form.is_free_from_encumbrances !== false ? (
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">YES</span>
                    ) : (
                      <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">NO ({form.encumbrance_details || "Encumbrance exists"})</span>
                    )}
                  </div>
                </div>

                <div className="p-2 rounded bg-muted/30 border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="font-medium">14. Able to handover peaceful & encumbrance-free possession to ECL?</span>
                  <div className="shrink-0 font-bold font-mono">
                    {form.can_handover_possession !== false ? (
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">YES</span>
                    ) : (
                      <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">NO ({form.possession_handover_reasons || "Reason provided"})</span>
                    )}
                  </div>
                </div>

                <div className="p-2 rounded bg-muted/30 border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="font-medium">15. Agreed to accept One-Time Cash Compensation in lieu of employment?</span>
                  <div className="shrink-0 font-bold font-mono">
                    {form.opted_monetary_in_lieu_of_employment ? (
                      <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">YES (Accept One-Time Cash)</span>
                    ) : (
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">NO (Prefer Employment Nomination via Form-V)</span>
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
                  5. Attached Self-Attested Mandatory Documents ({DOC_TYPES.reduce((sum, t) => sum + (uploadedDocs[t.key]?.length || 0), 0)} file(s))
                </h4>
                <Button variant="ghost" size="sm" onClick={() => onStepChange(3)} className="h-6 text-[11px] text-emerald-700 hover:bg-emerald-50">
                  Manage Files →
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {DOC_TYPES.map((type) => {
                  const docs = uploadedDocs[type.key] || [];
                  const doc = docs[0];
                  return (
                    <div key={type.key} className="p-2 rounded border bg-muted/20 flex items-center justify-between">
                      <div className="flex items-center gap-2 truncate pr-2">
                        <CheckCircle2 className={cn("h-4 w-4 shrink-0", doc ? "text-emerald-600" : "text-slate-300")} />
                        <span className="font-medium truncate">{type.label}</span>
                      </div>
                      {doc ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (doc.id) {
                              window.open(`/api/files/${doc.id}/download`, "_blank");
                            } else {
                              window.open(`/api/files/download/${doc.file_name}`, "_blank");
                            }
                          }}
                          className="h-6 text-[10px] font-mono border-emerald-600 text-emerald-700 hover:bg-emerald-50 gap-1 px-2 shrink-0"
                        >
                          <Eye className="h-3 w-3" /> View
                        </Button>
                      ) : (
                        <span className="text-[10px] text-rose-600 font-mono italic shrink-0">Not Attached</span>
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
                  onChange={(e) => setForm({ ...form, certified_accurate: e.target.checked })}
                  className="mt-1 h-4 w-4 rounded border-border text-emerald-600 accent-emerald-600"
                />
                <span className="text-xs text-slate-800 leading-relaxed font-medium">
                  <strong>Statutory Certification:</strong> I certify to the best of my knowledge and belief that the particulars mentioned above by me are genuine & authentic. Moreover, if any of the particulars is found incorrect or suppressed at any time, my nominee, if appointed, may be dismissed as per your company's norms and regulation.
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

export default FormIWizardView;
