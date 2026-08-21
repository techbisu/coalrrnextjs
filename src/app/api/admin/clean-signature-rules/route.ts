import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { seedDocumentTemplateSignature } from '../../../../../prisma/seed/document_template_signature.seed';

export async function GET(req: NextRequest) {
  try {
    // 1. Delete all existing document_template_signature rules to remove stale duplicates
    await (db as any).document_template_signature.deleteMany({});

    // 2. Re-seed canonical signature flows (Form-VII: 12 steps, Form-XVI: 3 steps, Form-XXII: 3 steps)
    await seedDocumentTemplateSignature(db as any);

    // 3. Count clean rules
    const rules = await (db as any).document_template_signature.findMany({
      orderBy: [{ template_code: 'asc' }, { display_order: 'asc' }],
    });

    return NextResponse.json({
      success: true,
      message: 'Successfully cleaned and re-seeded document_template_signature table.',
      totalCleanRules: rules.length,
      rules: rules.map((r: any) => ({
        id: r.id,
        template_code: r.template_code,
        sig_permission: r.sig_permission,
        display_order: r.display_order,
        label: r.placeholders?.label || r.placeholders?.label_en,
      })),
    });
  } catch (error: any) {
    console.error('[CleanSigRulesAPI] Error cleaning signature rules:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to clean signature rules' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
