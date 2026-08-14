import * as React from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Layers,
  Compass,
  ShieldCheck,
  FileCode,
  ArrowRight,
  Code2,
  Database,
  CheckCircle2,
  Workflow,
  Sparkles,
  FileText,
  Search,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { getAllDocFiles, getDocTree } from '@/lib/docs/docReader';

export const metadata = {
  title: 'Documentation Hub — COALRR Framework',
  description: 'Explore developer guides, architecture plans, core services, and SOPs for COALRR.',
};

export default async function DocsIndexPage() {
  const allDocs = getAllDocFiles();
  const tree = getDocTree();

  // Featured documents for quick access
  const featured = [
    { title: 'Developer Guide', slug: 'developer-guide', icon: Code2, desc: 'Quickstart setup, development workflow, and coding conventions.' },
    { title: 'Technical Design Document', slug: 'technical_design_document', icon: FileText, desc: 'Complete architecture design & core data structures.' },
    { title: 'Architecture Overview', slug: 'architecture/application', icon: Layers, desc: 'Clean Architecture layering, dependency injection & boundaries.' },
    { title: 'Workflow Setup Guide', slug: 'docs_workflow_setup', icon: Workflow, desc: 'Adding workflow states, transitions, & recommendation engines.' },
    { title: 'Checklist Service Setup', slug: 'docs_checklist_setup', icon: CheckCircle2, desc: 'Configuring dynamic checklist rules & condition AST rules.' },
    { title: 'Database Analysis & Schema', slug: 'database_analysis', icon: Database, desc: 'Comprehensive Postgres & Prisma database model reference.' },
  ];

  return (
    <div className="flex-1 p-6 md:p-10 max-w-6xl mx-auto space-y-10">
      {/* Hero Banner */}
      <div className="relative rounded-2xl p-8 bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950 text-white border border-slate-800 shadow-xl overflow-hidden">
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
          <BookOpen className="w-80 h-80 text-emerald-400" />
        </div>

        <div className="relative space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Developer Knowledge Base
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            COALRR Framework Documentation
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Welcome to the official developer documentation hub. Access instant technical specifications, architecture patterns, standard operating procedures, and step-by-step guides.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-emerald-400" />
              {allDocs.length} Documents Available
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-sky-400" />
              {tree.subfolders.length} Main Categories
            </span>
            <span>•</span>
            <span className="text-emerald-400 font-semibold">Press Ctrl + K to Search</span>
          </div>
        </div>
      </div>

      {/* Featured Quick Start Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-500" />
            Featured Technical Guides
          </h2>
          <span className="text-xs text-slate-500">Most requested by developers</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {featured.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.slug} href={`/docs/${item.slug}`} className="group">
                <Card className="h-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-emerald-500/50 hover:shadow-md transition-all">
                  <CardHeader className="pb-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 group-hover:scale-105 transition-transform">
                        <Icon className="w-4 h-4" />
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </div>
                    <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {item.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {item.desc}
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Main Categories Section */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Layers className="w-5 h-5 text-sky-500" />
          Documentation Categories
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Category: Architecture */}
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-sky-500/10 text-sky-500 border border-sky-500/20">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Architecture & Layering
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Clean Architecture pattern, domain entities, use cases & services
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-1.5 text-xs">
              {allDocs
                .filter((d) => d.slugPath.startsWith('architecture/'))
                .slice(0, 6)
                .map((doc) => (
                  <Link
                    key={doc.id}
                    href={`/docs/${doc.slugPath}`}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors group"
                  >
                    <span className="font-medium truncate">{doc.title}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2" />
                  </Link>
                ))}
              <div className="pt-2 text-right">
                <Link href="/docs/architecture/README" className="text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline">
                  View all architecture files →
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Category: Standard Operating Procedures (SOP) */}
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Standard Operating Procedures (SOP)
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Legal circulars, process flows, checklists & statutory guidelines
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-1.5 text-xs">
              {allDocs
                .filter((d) => d.slugPath.startsWith('sop/'))
                .slice(0, 6)
                .map((doc) => (
                  <Link
                    key={doc.id}
                    href={`/docs/${doc.slugPath}`}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors group"
                  >
                    <span className="font-medium truncate">{doc.title}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2" />
                  </Link>
                ))}
              <div className="pt-2 text-right">
                <Link href="/docs/sop/PART%20A-%20ALL%20STEPS%20FOR%20PRINT" className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline">
                  View all SOP guidelines →
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
