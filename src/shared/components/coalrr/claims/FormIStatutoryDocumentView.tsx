import React from "react";
import { Button } from "@/shared/components/ui/button";
import {
  Printer,
  FileText,
  User,
  Building2,
  Download,
  FileDown,
} from "lucide-react";
import { getDisplayPlotNo } from "@/shared/utils/plot.utils";

export interface FormIStatutoryDocumentViewProps {
  claim: {
    id?: string;
    claim_code: string;
    claimant_name: string;
    father_husband_name?: string;
    present_address?: string;
    permanent_address?: string;
    epic_no?: string;
    citizen_id_hash?: string;
    aadhaar_number?: string;
    occupation?: string;
    gender?: string;
    nationality?: string;
    religion?: string;
    caste_category?: string;
    photo_doc_id?: string;

    // Plot schedule Q8
    mouza?: string;
    plot_number?: string;
    total_area_acres?: string;
    own_share_acres: string;
    khatian_no?: string;
    link_deed_no?: string;
    ownership_date?: string;
    transferor_name?: string;
    acquisition_mode_offered?: string;

    // Q9-Q15
    prior_compensation_received?: boolean;
    prior_compensation_details?: string;
    bank_name?: string;
    bank_branch?: string;
    bank_account_number?: string;
    bank_ifsc?: string;
    prior_employment_linked?: boolean;
    prior_employment_details?: string;
    is_free_from_disputes?: boolean;
    dispute_details?: string;
    is_free_from_encumbrances?: boolean;
    encumbrance_details?: string;
    can_handover_possession?: boolean;
    possession_reason?: string;
    opted_monetary_in_lieu_of_employment?: boolean;
    monetary_opt_reason?: string;
    form_v_eligible?: boolean;
    submitted_at?: string | null;
    state?: string;
  };
  onClose?: () => void;
}

export function FormIStatutoryDocumentView({
  claim,
  onClose,
}: FormIStatutoryDocumentViewProps) {
  const handlePrint = () => {
    window.print();
  };

  const handleDownloadDocx = () => {
    const claimIdentifier = claim.id || claim.claim_code;
    window.open(`/api/claims/${claimIdentifier}/download?format=docx`, "_blank");
  };

  const handleDownloadPdf = () => {
    const claimIdentifier = claim.id || claim.claim_code;
    window.open(`/api/claims/${claimIdentifier}/download?format=pdf`, "_blank");
  };

  const mode = claim.acquisition_mode_offered || "CBA_ACT";
  const isDirect = mode === "DIRECT_PURCHASE";
  const isCBA = mode === "CBA_ACT" || mode === "LA_ACT";

  return (
    <div className="space-y-4 max-w-5xl mx-auto bg-background p-4 sm:p-6 rounded-lg border shadow-lg print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none">
      {/* Header action bar (hidden during print) */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b print:hidden">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <FileText className="h-5 w-5 text-emerald-600" />
            Official Form-I Statutory Application (Form-I-Template.docx Engine)
          </h2>
          <p className="text-xs text-muted-foreground">
            Claim Code:{" "}
            <span className="font-mono font-bold text-foreground">
              {claim.claim_code}
            </span>{" "}
            | Template:{" "}
            <span className="font-semibold text-emerald-600 font-mono">
              Form-I-Template.docx
            </span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={handleDownloadDocx}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium gap-1.5"
          >
            <Download className="h-4 w-4" /> Download DOCX
          </Button>
          <Button
            onClick={handleDownloadPdf}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium gap-1.5"
          >
            <FileDown className="h-4 w-4" /> Download PDF
          </Button>
          <Button
            onClick={handlePrint}
            variant="outline"
            className="gap-1.5 border-slate-400"
          >
            <Printer className="h-4 w-4" /> Print
          </Button>
          {onClose && (
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>

      {/* Official Print Document Layout */}
      <div className="bg-white text-slate-950 p-6 sm:p-8 rounded border border-slate-300 shadow-sm print:p-6 print:border-none print:shadow-none space-y-5 font-serif text-xs leading-relaxed">
        
        {/* Official Header */}
        <div className="text-center space-y-1.5 border-b-2 border-slate-900 pb-3">
          <div className="flex items-center justify-center gap-2 text-slate-800 font-sans text-xs font-bold uppercase tracking-widest">
            <Building2 className="h-4 w-4 text-emerald-700" />
            EASTERN COALFIELDS LIMITED (A Subsidiary of Coal India Limited)
          </div>
          <h1 className="text-lg sm:text-xl font-extrabold uppercase tracking-wider text-slate-950">
            FORM - I
          </h1>
          <h2 className="text-xs font-bold uppercase tracking-wide text-slate-800">
            (TO BE FILLED BY THE LAND LOSER’S)
          </h2>
          <p className="text-[11px] italic text-slate-600">
            (Separate Sheet for each land Loser)
          </p>
          <div className="flex items-center justify-between text-[11px] font-mono font-bold pt-2 border-t border-slate-300">
            <span>Claim Ref Code: {claim.claim_code}</span>
            <span>
              Date:{" "}
              {claim.submitted_at
                ? new Date(claim.submitted_at).toLocaleDateString("en-IN")
                : new Date().toLocaleDateString("en-IN")}
            </span>
          </div>
        </div>

        {/* Top Grid: Demographics Q1-Q7 + Passport Photo Frame */}
        <div className="grid grid-cols-4 gap-4 items-start pt-1">
          <div className="col-span-3 space-y-2">
            <div className="flex gap-2">
              <span className="font-bold min-w-[220px] text-slate-900">
                1. Name of the land loser:
              </span>
              <span className="font-semibold underline uppercase text-slate-950">
                {claim.claimant_name || "N/A"}
              </span>
            </div>

            <div className="flex gap-2">
              <span className="font-bold min-w-[220px] text-slate-900">
                2. Name of the Father/Husband:
              </span>
              <span className="underline">
                {claim.father_husband_name || "N/A"}
              </span>
            </div>

            <div className="flex gap-2">
              <span className="font-bold min-w-[220px] text-slate-900">
                3. Present & Permanent Address:
              </span>
              <span className="underline leading-tight">
                Present: {claim.present_address || "N/A"} | Permanent:{" "}
                {claim.permanent_address || "N/A"}
              </span>
            </div>

            <div className="flex gap-2">
              <span className="font-bold min-w-[220px] text-slate-900">
                4. Voter (EPIC) Card & Aadhaar No:
              </span>
              <span className="font-mono">
                {claim.epic_no || "N/A"} & {claim.citizen_id_hash || "LOCKED"}
              </span>
            </div>

            <div className="flex gap-2">
              <span className="font-bold min-w-[220px] text-slate-900">
                5. Occupation:
              </span>
              <span className="underline">
                {claim.occupation || "Agriculture"}
              </span>
            </div>

            <div className="flex gap-2">
              <span className="font-bold min-w-[220px] text-slate-900">
                6. Gender, Nationality & Religion:
              </span>
              <span>
                {claim.gender || "Male"}, {claim.nationality || "Indian"} &{" "}
                {claim.religion || "Hindu"}
              </span>
            </div>

            <div className="flex gap-2">
              <span className="font-bold min-w-[220px] text-slate-900">
                7. Whether he/she is belonging in S.C/S.T or OBC community:
              </span>
              <span className="font-semibold text-slate-900">
                {claim.caste_category || "GENERAL"}
              </span>
            </div>
          </div>

          {/* Self-Attested Passport Photo Frame */}
          <div className="border-2 border-slate-900 p-1 text-center h-36 w-28 mx-auto flex flex-col items-center justify-center bg-slate-50 rounded relative shadow-inner">
            {claim.photo_doc_id ? (
              <img
                src={`/api/files/download/${claim.photo_doc_id}`}
                alt="Land Loser Passport Photo"
                className="h-full w-full object-cover rounded"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            ) : (
              <div className="p-2 space-y-1">
                <User className="h-8 w-8 text-slate-400 mx-auto" />
                <span className="text-[9px] text-slate-600 block leading-tight font-sans">
                  Affix recent passport size self-attested photo
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Question 8: Full Template Plot Schedule Table */}
        <div className="space-y-1.5 pt-2">
          <h3 className="text-xs font-bold border-b-2 border-slate-900 pb-1 uppercase tracking-wider text-slate-950">
            8. Details of the land applying for purchase/ possession by ECL:
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-[10px] border-collapse border-2 border-slate-900">
              <thead>
                <tr className="bg-slate-100 text-center font-bold border-b-2 border-slate-900">
                  <th className="border border-slate-900 p-1">Mouza</th>
                  <th className="border border-slate-900 p-1">Plot No</th>
                  <th className="border border-slate-900 p-1">Total Area</th>
                  <th className="border border-slate-900 p-1">Khatian No</th>
                  <th className="border border-slate-900 p-1">Own Share (ac)</th>
                  <th className="border border-slate-900 p-1">Legal Instrument / Deed</th>
                  <th className="border border-slate-900 p-1">Ownership Date</th>
                  <th className="border border-slate-900 p-1">Transferor Name</th>
                  <th className="border border-slate-900 p-1">Direct Purchase (ac)</th>
                  <th className="border border-slate-900 p-1">CBA/LA Act (ac)</th>
                  <th className="border border-slate-900 p-1">Ref Notice No</th>
                </tr>
              </thead>
              <tbody>
                <tr className="text-center font-mono">
                  <td className="border border-slate-900 p-1 font-semibold font-sans">
                    {claim.mouza || "Approved Mouza"}
                  </td>
                  <td className="border border-slate-900 p-1 font-bold text-slate-950">
                    {getDisplayPlotNo(claim.plot_number)}
                  </td>
                  <td className="border border-slate-900 p-1">
                    {claim.total_area_acres || claim.own_share_acres} ac
                  </td>
                  <td className="border border-slate-900 p-1">
                    {claim.khatian_no || "Kh-102"}
                  </td>
                  <td className="border border-slate-900 p-1 font-bold text-emerald-900 font-sans">
                    {claim.own_share_acres} ac
                  </td>
                  <td className="border border-slate-900 p-1 font-sans">
                    {claim.link_deed_no
                      ? `Deed ${claim.link_deed_no}`
                      : "Inherited Deed"}
                  </td>
                  <td className="border border-slate-900 p-1">
                    {claim.ownership_date
                      ? new Date(claim.ownership_date).toLocaleDateString(
                          "en-IN"
                        )
                      : "N/A"}
                  </td>
                  <td className="border border-slate-900 p-1 font-sans">
                    {claim.transferor_name || "Ancestral"}
                  </td>
                  <td className="border border-slate-900 p-1 font-sans">
                    {isDirect ? `${claim.own_share_acres} ac` : "0.0000"}
                  </td>
                  <td className="border border-slate-900 p-1 font-sans">
                    {isCBA ? `${claim.own_share_acres} ac` : "0.0000"}
                  </td>
                  <td className="border border-slate-900 p-1 font-sans">
                    ECL/LA/2026/NOT-01
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Questions 9 to 15: Statutory Declarations */}
        <div className="space-y-2 pt-2 text-[11px]">
          <div className="p-2 border border-slate-400 rounded bg-slate-50/60">
            <span className="font-bold">
              9. If any compensation has been received earlier for these plots of lands from ECL or any other Authority by him/her or his/her family? If so, give details:
            </span>
            <span className="ml-2 font-bold uppercase text-slate-950">
              {claim.prior_compensation_received ? "YES" : "NO"}
            </span>
            {claim.prior_compensation_details && (
              <p className="text-slate-700 pl-4 mt-0.5 font-sans">
                Details: {claim.prior_compensation_details}
              </p>
            )}
          </div>

          <div className="p-2 border border-slate-400 rounded bg-slate-50/60">
            <span className="font-bold">
              10. In case no compensation has been received, Details of Bank Account like name and address of Bank, account no. etc. (Attach copy Pass book):
            </span>
            <div className="pl-4 grid grid-cols-2 gap-x-4 gap-y-1 font-mono mt-1 text-[11px]">
              <div>Bank Name: <span className="font-semibold font-sans">{claim.bank_name || "State Bank of India"}</span></div>
              <div>Branch: <span className="font-semibold font-sans">{claim.bank_branch || "ECL Main Branch"}</span></div>
              <div>Account No: <span className="font-bold">{claim.bank_account_number || "XXXXXXXXXXXX"}</span></div>
              <div>IFSC Code: <span className="font-bold">{claim.bank_ifsc || "SBIN0001234"}</span></div>
            </div>
          </div>

          <div className="p-2 border border-slate-400 rounded bg-slate-50/60">
            <span className="font-bold">
              11. If any part of these plots was included in another employment in ECL? If so, give details:
            </span>
            <span className="ml-2 font-bold uppercase text-slate-950">
              {claim.prior_employment_linked ? "YES" : "NO"}
            </span>
            {claim.prior_employment_details && (
              <p className="text-slate-700 pl-4 mt-0.5 font-sans">
                Details: {claim.prior_employment_details}
              </p>
            )}
          </div>

          <div className="p-2 border border-slate-400 rounded bg-slate-50/60">
            <span className="font-bold">
              12. Whether these plots/lands are presently free from any disputes or court case with the co-shares, bargadar or adjacent landowners? If not so, give detail:
            </span>
            <span className="ml-2 font-bold uppercase text-emerald-900">
              {claim.is_free_from_disputes !== false ? "YES (Free from disputes)" : "NO (Dispute Exists)"}
            </span>
            {claim.dispute_details && (
              <p className="text-slate-700 pl-4 mt-0.5 font-sans">
                Dispute Details: {claim.dispute_details}
              </p>
            )}
          </div>

          <div className="p-2 border border-slate-400 rounded bg-slate-50/60">
            <span className="font-bold">
              13. Whether these plots/lands are presently free from any encumbrances? If not, give details:
            </span>
            <span className="ml-2 font-bold uppercase text-emerald-900">
              {claim.is_free_from_encumbrances !== false ? "YES (Free from encumbrances)" : "NO (Encumbered)"}
            </span>
          </div>

          <div className="p-2 border border-slate-400 rounded bg-slate-50/60">
            <span className="font-bold">
              14. Whether he/she has able to handover peaceful and encumbrance-free possession of above lands to the ECL? If not, give reasons:
            </span>
            <span className="ml-2 font-bold uppercase text-emerald-900">
              {claim.can_handover_possession !== false ? "YES" : "NO"}
            </span>
          </div>

          <div className="p-2 border border-slate-400 rounded bg-slate-50/60">
            <span className="font-bold">
              15. Has he/she agreed to accept ‘One Time Monetary compensation in lieu of employment’ against above land? If not, give reason:
            </span>
            <span className="ml-2 font-bold uppercase text-slate-950">
              {claim.opted_monetary_in_lieu_of_employment
                ? "YES (Accepted One-Time Cash)"
                : "NO (Nominate Employment via Form-V)"}
            </span>
            {claim.form_v_eligible && (
              <span className="ml-2 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900 font-bold font-sans">
                [Form-V Employment Eligible: Land &ge; 2.00 Acres]
              </span>
            )}
          </div>
        </div>

        {/* Certificate Declaration & Signature Line */}
        <div className="pt-4 border-t-2 border-slate-900 space-y-6 text-xs">
          <p className="italic text-slate-900 leading-relaxed font-serif">
            &ldquo;I certified to the best of my knowledge and belief that the
            particulars mentioned above by me are genuine & authentic. Moreover,
            any of the particulars is found incorrect or suppressed at any
            time my nominee, if appointed may be dismissed as per your
            company’s norms and regulation.&rdquo;
          </p>

          <div className="flex justify-between items-end pt-8">
            <div className="space-y-1 font-sans text-xs">
              <div>Date: ________________________</div>
              <div>Place: ________________________</div>
            </div>

            <div className="text-center space-y-1.5">
              <div className="font-mono text-slate-400 text-[10px]">
                [ Digital Signature / Self Attested ]
              </div>
              <div className="border-t-2 border-slate-900 pt-1 font-bold text-slate-950 font-sans">
                Signature of the land Owner
              </div>
              <div className="text-[11px] font-semibold text-slate-800 font-sans">
                ({claim.claimant_name})
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FormIStatutoryDocumentView;
