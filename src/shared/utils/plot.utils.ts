import { proposalConfig } from '@/core/config/proposal.config';

export function generatePlotNo({
  stateLgd,
  mouzaLgd,
  plotTy,
  plotNumber,
  bataNo
}: {
  stateLgd: string | number | bigint;
  mouzaLgd: string | number | bigint;
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
 * Extracts and displays plot numbers with LR / RS / CS type tags.
 * Strips state_lgd (slgd), mouza_lgd (mlgd), and leading zeros while keeping LR/RS/CS tags.
 */
export function getDisplayPlotNo(
  plotNo: string | undefined | null,
  stateLgd?: string | number | bigint | null,
  mouzaLgd?: string | number | bigint | null,
  plotTy?: string | null
): string {
  if (!plotNo) return '—';
  let str = String(plotNo).trim();

  // Strip LGD prefixes if provided
  const sLgd = stateLgd ? String(stateLgd) : '';
  const mLgd = mouzaLgd ? String(mouzaLgd) : '';

  if (sLgd && mLgd && str.startsWith(`${sLgd}${mLgd}`)) {
    str = str.slice(`${sLgd}${mLgd}`.length);
  } else if (mLgd && str.startsWith(mLgd)) {
    str = str.slice(mLgd.length);
  } else if (sLgd && str.startsWith(sLgd)) {
    str = str.slice(sLgd.length);
  }

  // Handle explicit plotTy parameter
  if (plotTy) {
    const typeLabel = plotTy === '1' || plotTy === 'LR' ? 'LR' : plotTy === '2' || plotTy === 'RS' ? 'RS' : plotTy === '3' || plotTy === 'CS' ? 'CS' : plotTy;
    const cleanNum = str.replace(/^(LR|RS|CS|1|2|3)\s*/i, '').replace(/^0+/, '');
    return `${typeLabel} ${cleanNum}`;
  }

  // Handle string starting with LR, RS, or CS
  const typeMatch = str.match(/^(LR|RS|CS)[\s_\-]*0*(\d+.*)$/i);
  if (typeMatch) {
    return `${typeMatch[1].toUpperCase()} ${typeMatch[2]}`;
  }

  // Handle delimiter separators like "19_101_LR_45" or "19-101-1-45"
  if (str.includes('_')) {
    const parts = str.split('_');
    str = parts.slice(-2).join(' ');
  } else if (str.includes('-')) {
    const parts = str.split('-');
    str = parts.slice(-2).join(' ');
  }

  // Handle embedded plot_ty code (1=LR, 2=RS, 3=CS)
  if (/^[123]\d+$/.test(str)) {
    const typeCode = str[0];
    const typeLabel = typeCode === '1' ? 'LR' : typeCode === '2' ? 'RS' : 'CS';
    const numPart = str.slice(1).replace(/^0+/, '');
    return `${typeLabel} ${numPart}`;
  }

  // Strip leading zeros if numeric
  if (/^0+\d+/.test(str)) {
    str = str.replace(/^0+/, '');
  }

  return str || String(plotNo);
}

/**
 * Generates a human-readable format for the plot number (e.g., "LR 42/12").
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
  stateLgd?: string | number | bigint | null;
  mouzaLgd?: string | number | bigint | null;
}): string {
  if (plotTy && plotNumber) {
    const typeStr = plotTy === '1' ? 'LR' : plotTy === '2' ? 'RS' : plotTy === '3' ? 'CS' : plotTy;
    return `${typeStr} ${plotNumber}${bataNo ? '/' + bataNo : ''}`;
  }
  
  return getDisplayPlotNo(fallbackPlotNo, stateLgd, mouzaLgd, plotTy);
}

/**
 * Automatically determines optional plot fields based on state and primary plot type.
 */
export function autoSetOptionalPlotFields(
  stateLgd: string | number | bigint | undefined,
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
