import { proposalConfig } from '@/core/config/proposal.config';

export function generatePlotNo({
  stateLgd,
  mouzaLgd,
  plotTy,
  plotNumber,
  bataNo
}: {
  stateLgd: string | number;
  mouzaLgd: string | number;
  plotTy: string;
  plotNumber: string;
  bataNo?: string | null;
}): string {
  const safeStateLgd = stateLgd?.toString() || '';
  const safeMouzaLgd = mouzaLgd?.toString() || '';
  const safePlotTy = plotTy?.toString() || '';
  const safePlotNumber = plotNumber?.toString() || '';
  const safeBataNo = bataNo?.toString() || '';
  
  return `${safeStateLgd}${safeMouzaLgd}${safePlotTy}${safePlotNumber}${safeBataNo}`.trim();
}

/**
 * Generates a human-readable format for the plot number (e.g., "LR 42/12")
 * Falls back to the raw plot_no if components are missing.
 */
export function formatPlotHumanReadable({
  plotTy,
  plotNumber,
  bataNo,
  fallbackPlotNo,
  stateLgd,
  mouzaLgd
}: {
  plotTy?: string | null;
  plotNumber?: string | null;
  bataNo?: string | null;
  fallbackPlotNo: string;
  stateLgd?: string | number | null;
  mouzaLgd?: string | number | null;
}): string {
  if (plotTy && plotNumber) {
    const typeStr = plotTy === '1' ? 'LR' : plotTy === '2' ? 'RS' : plotTy === '3' ? 'CS' : plotTy;
    return `${typeStr} ${plotNumber}${bataNo ? '/' + bataNo : ''}`;
  }
  
  // Graceful fallback for older raw plot_no records that don't have individual fields saved
  if (stateLgd && mouzaLgd && fallbackPlotNo) {
    const prefix = `${stateLgd}${mouzaLgd}`;
    if (fallbackPlotNo.startsWith(prefix)) {
      const remainder = fallbackPlotNo.slice(prefix.length);
      if (remainder.length > 0) {
        const pTy = remainder[0];
        const pNum = remainder.slice(1);
        const typeStr = pTy === '1' ? 'LR' : pTy === '2' ? 'RS' : pTy === '3' ? 'CS' : pTy;
        return `${typeStr} ${pNum}`;
      }
    }
  }

  return fallbackPlotNo || 'Unknown';
}

/**
 * Automatically determines optional plot fields based on state and primary plot type.
 */
export function autoSetOptionalPlotFields(
  stateLgd: string | number | undefined,
  primaryPlotTy: string,
  primaryPlotNumber: string,
  primaryBataNo: string
) {
  if (!stateLgd || !primaryPlotTy) return null;
  const stateStr = stateLgd.toString();

  const rule = proposalConfig.plotAutoSetRules.find(r => 
    r.stateLgd === stateStr && (r.primaryPlotTypes as readonly string[]).includes(primaryPlotTy)
  );

  if (rule) {
    return {
      opt_plot_ty: rule.autoSetOptPlotType,
      opt_plot: rule.copyPlotNumber ? primaryPlotNumber : '',
      opt_bata: rule.copyPlotNumber ? primaryBataNo : ''
    };
  }

  return null;
}
