import { db } from '@/lib/db'
import { proposalConfig } from '@/core/config/proposal.config'

export const getAcqModeShortCode = (acqModeId: number): string => {
  const map: Record<number, string> = {
    1: 'CBA', 2: 'RFCTLARR', 3: 'LTS', 4: 'LGOVT',
    5: 'FD', 6: 'DP', 7: 'INH', 8: 'LA', 9: 'LT',
  };
  return map[acqModeId] || 'UNK';
}

/**
 * Auto-generates a Proposal Reference Number (Schedule Code).
 * Format for active proposal: ECL/4101/4103/0001/ACQ/0001
 * Format for draft proposal: ECL/4101/4103/0001/DRAFT/0001
 * - ECL/4101/4103/0001/ : full project code from eclProjCd
 * - ACQ/ or DRAFT/ : literal string
 * - 0001 : Area-wise sequence number
 */
export async function generateProposalRefNo(
  eclProjCd: string,
  acqModeId: number | null,
  areaCd: string,
  isDraft: boolean = false
): Promise<string> {
  // Use the full project code as requested
  const baseProjCd = eclProjCd.endsWith('/') ? eclProjCd : eclProjCd + '/'

  // Get the area-wise count of existing proposals to determine the next serial number
  const count = await db.acq_proposal.count({
    where: {
      area_cd: areaCd
    }
  })

  // Sequence number is count + 1, padded to 4 digits
  const seqNum = (count + 1).toString().padStart(4, '0')

  if (isDraft) {
    return `${baseProjCd}DRAFT/${seqNum}`
  }

  return `${baseProjCd}ACQ/${seqNum}`
}
