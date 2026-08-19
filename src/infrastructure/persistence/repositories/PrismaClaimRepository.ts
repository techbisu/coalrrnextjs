import { UserScopeService } from "@/core/authorization/services/UserScopeService";
import { db } from "@/lib/db";
import { IClaimRepository } from "@/modules/land-acquisition/interfaces/IClaimRepository";
import { randomUUID } from "crypto";

export class PrismaClaimRepository implements IClaimRepository {
  async findAll(): Promise<any[]> {
    const claims = await db.form_i_claim.findMany({
      include: { nominee_pool_contribution: true, form_i_claim_plot: true },
      orderBy: { entry_ts: "desc" },
    });

    const attachments = await db.file_attachment.findMany({
      where: { entity_type: "form_i_claim" },
    });

    const signedAttachmentMap = new Map<string, string>();
    for (const a of attachments) {
      if (a.module && a.module.toUpperCase().includes("SIGNED_FORM_I")) {
        signedAttachmentMap.set(a.entity_id, a.file_id);
      }
    }

    return claims.map((c) => ({
      ...c,
      signed_form_i_doc_id:
        signedAttachmentMap.get(c.id) ||
        (c as any).signed_form_i_doc_id ||
        null,
    }));
  }

  async findById(id: string): Promise<any | null> {
    const claim = await db.form_i_claim.findUnique({
      where: { id },
      include: { form_i_claim_plot: true },
    });
    if (!claim) return null;
    const land_loser_master = await db.land_loser_master.findUnique({
      where: { citizen_id_hash: claim.citizen_id_hash },
    });
    const attachments = await db.file_attachment.findMany({
      where: { entity_type: "form_i_claim", entity_id: id },
    });
    const signedAtt = attachments.find(
      (a) => a.module && a.module.toUpperCase().includes("SIGNED_FORM_I")
    );
    return {
      ...claim,
      land_loser_master,
      signed_form_i_doc_id:
        signedAtt?.file_id || (claim as any).signed_form_i_doc_id || null,
    };
  }

  async findByCitizenAndPlot(
    citizen_id_hash: string,
    plot_id: string,
  ): Promise<any | null> {
    return db.form_i_claim.findFirst({
      where: {
        citizen_id_hash,
        form_i_claim_plot: {
          some: {
            OR: [{ plot_schedule_id: plot_id }, { plot_no: plot_id }],
          },
        },
      },
      include: { form_i_claim_plot: true },
    });
  }

  async create(data: any): Promise<any> {
    const { plots, signed_form_i_doc_id, ...claimData } = data;
    const payload = {
      ...claimData,
      id: (claimData.id && String(claimData.id).trim()) || randomUUID(),
      ...(plots && Array.isArray(plots) && plots.length > 0
        ? {
            form_i_claim_plot: {
              create: plots.map((p: any) => ({
                id: randomUUID(),
                plot_schedule_id: p.plot_schedule_id || p.plot_id || null,
                plot_no: p.plot_no || p.plot_id || null,
                khatian_no: p.khatian_no || null,
                own_share_acres: p.own_share_acres
                  ? String(p.own_share_acres)
                  : "0.0000",
                total_ror_area: p.total_ror_area
                  ? String(p.total_ror_area)
                  : null,
                link_deed_no: p.link_deed_no || null,
                ownership_date: p.ownership_date
                  ? new Date(p.ownership_date)
                  : null,
                transferor_name: p.transferor_name || null,
                acquisition_mode_offered:
                  p.acquisition_mode_offered || "CBA_ACT",
              })),
            },
          }
        : {}),
    };
    const createdClaim = await db.form_i_claim.create({
      data: payload,
      include: { form_i_claim_plot: true },
    });

    await syncFileAttachments(createdClaim.id, data);
    return createdClaim;
  }

  async update(id: string, data: any): Promise<any> {
    const {
      plots,
      plot_entries,
      form_i_claim_plot,
      authType,
      aadhaarNumber,
      same_as_present,
      certified_accurate,
      total_claim_share_acres,
      prior_compensation_received,
      prior_compensation_details,
      prior_employment_linked,
      prior_employment_details,
      is_free_from_disputes,
      dispute_details,
      is_free_from_encumbrances,
      encumbrance_details,
      can_handover_possession,
      possession_reason,
      possession_handover_reasons,
      opted_monetary_in_lieu_of_employment,
      monetary_opt_reason,
      plot_id,
      khatian_no,
      own_share_acres,
      state_lgd,
      district_lgd,
      block_lgd,
      mouza_lgd,
      pincode,
      daysRemaining,
      display_plot_no,
      primary_mobile_no,
      signed_form_i_doc_id,
      ...validClaimData
    } = data;

    const plotList = plots || plot_entries || form_i_claim_plot || [];

    if (Array.isArray(plotList) && plotList.length > 0) {
      await db.form_i_claim_plot.deleteMany({ where: { form_i_claim_id: id } });
      await db.form_i_claim_plot.createMany({
        data: plotList.map((p: any) => ({
          id: randomUUID(),
          form_i_claim_id: id,
          plot_schedule_id: p.plot_schedule_id || p.plot_id || null,
          plot_no: p.plot_no || p.plot_id || null,
          khatian_no: p.khatian_no || null,
          own_share_acres: p.own_share_acres
            ? String(p.own_share_acres)
            : "0.0000",
          total_ror_area: p.total_ror_area ? String(p.total_ror_area) : null,
          link_deed_no: p.link_deed_no || null,
          ownership_date: p.ownership_date ? new Date(p.ownership_date) : null,
          transferor_name: p.transferor_name || null,
          acquisition_mode_offered: p.acquisition_mode_offered || "CBA_ACT",
        })),
      });
    }

    const statutory_declarations = [
      {
        q_no: 9,
        answer_boolean: !!prior_compensation_received,
        details: prior_compensation_details || null,
        question:
          "If any compensation has been received earlier for these plots of lands from ECL or any other Authority by him/her or his/her family? If so, give details:",
      },
      {
        q_no: 11,
        answer_boolean: !!prior_employment_linked,
        details: prior_employment_details || null,
        question:
          "If any part of these plots was included in another employment in ECL? If so, give details:",
      },
      {
        q_no: 12,
        answer_boolean: is_free_from_disputes ?? true,
        details: dispute_details || null,
        question:
          "Whether these plots/lands are presently free from any disputes or court case with the co-shares, bargadar or adjacent landowners? If not so, give detail:",
      },
      {
        q_no: 13,
        answer_boolean: is_free_from_encumbrances ?? true,
        details: encumbrance_details || null,
        question:
          "Whether these plots/lands are presently free from any encumbrances? If not, give details:",
      },
      {
        q_no: 14,
        answer_boolean: can_handover_possession ?? true,
        details: possession_reason || possession_handover_reasons || null,
        question:
          "Whether he/she has able to handover peaceful and encumbrance-free possession of above lands to the ECL? If not, give reasons:",
      },
      {
        q_no: 15,
        answer_boolean: !!opted_monetary_in_lieu_of_employment,
        details: monetary_opt_reason || null,
        question:
          "Has he/she agreed to accept 'One time Monetary compensation of CIL R&R Policy / One Time lumpsum / modified annuity scheme of ECL in lieu of employment' against above land? If not, give reason:",
      },
    ];

    const updatePayload: Record<string, any> = {
      ...validClaimData,
      statutory_declarations,
      updt_by: "system",
      updt_ts: new Date(),
    };

    if (data.signed_form_i_doc_id && !data.state) {
      updatePayload.state = "UnitSubmitted";
    }

    delete updatePayload.plots;
    delete updatePayload.plot_entries;
    delete updatePayload.form_i_claim_plot;

    const updatedClaim = await db.form_i_claim.update({
      where: { id },
      data: updatePayload,
      include: { form_i_claim_plot: true },
    });

    await syncFileAttachments(id, data);
    return updatedClaim;
  }
}

async function syncFileAttachments(claimId: string, data: any) {
  const docs = [
    { fileId: data.photo_doc_id, module: "LAND_LOSER_PHOTO" },
    { fileId: data.magistrate_affidavit_doc_id, module: "MAG_AFFIDAVIT" },
    { fileId: data.passbook_doc_id, module: "BANK_PASSBOOK" },
    { fileId: data.title_deed_doc_id, module: "LINK_DEED" },
    { fileId: data.signed_form_i_doc_id, module: "SIGNED_FORM_I" },
  ];

  for (const doc of docs) {
    if (!doc.fileId || typeof doc.fileId !== "string") continue;
    try {
      const existing = await db.file_attachment.findFirst({
        where: {
          entity_type: "form_i_claim",
          entity_id: claimId,
          OR: [
            { module: doc.module },
            { file_id: doc.fileId },
          ],
        },
      });

      if (!existing) {
        await db.file_attachment.create({
          data: {
            id: randomUUID(),
            file_id: doc.fileId,
            entity_type: "form_i_claim",
            entity_id: claimId,
            module: doc.module,
            attached_by: "system",
            updt_ts: new Date(),
          },
        });
      } else {
        await db.file_attachment.update({
          where: { id: existing.id },
          data: {
            file_id: doc.fileId,
            module: doc.module,
            updt_ts: new Date(),
          },
        });
      }
    } catch (e) {
      console.warn("syncFileAttachments error:", e);
    }
  }
}
