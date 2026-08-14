import * as React from 'react';
import type { Metadata } from 'next';
import { getDocTree, getAllDocFiles } from '@/lib/docs/docReader';
import { DocsLayoutClient } from '@/modules/docs/components/DocsLayoutClient';

export const metadata: Metadata = {
  title: 'Developer Documentation — COALRR Framework',
  description: 'Comprehensive technical documentation, architecture guides, SOPs, and system rules for the COALRR Land Acquisition Platform.',
};

export default async function DocsLayout({ children }: { children: React.ReactNode }) {
  const tree = getDocTree();
  const allDocs = getAllDocFiles();

  return (
    <DocsLayoutClient tree={tree} allDocs={allDocs}>
      {children}
    </DocsLayoutClient>
  );
}
