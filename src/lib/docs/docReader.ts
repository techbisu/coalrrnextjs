import fs from 'fs';
import path from 'path';

export interface DocItem {
  id: string;
  title: string;
  slug: string[]; // e.g. ["architecture", "application"]
  slugPath: string; // e.g. "architecture/application"
  relativePath: string; // e.g. "docs/architecture/application.md"
  category: string;
  sizeBytes: number;
  updatedAt: string;
  readingTimeMinutes: number;
}

export interface DocFolder {
  name: string;
  title: string;
  slugPath: string;
  files: DocItem[];
  subfolders: DocFolder[];
}

export interface DocHeading {
  id: string;
  text: string;
  level: number;
}

export interface DocDetail {
  meta: DocItem;
  content: string;
  headings: DocHeading[];
  prevDoc: DocItem | null;
  nextDoc: DocItem | null;
}

const DOCS_DIR = path.join(process.cwd(), 'docs');
const AGENTS_DIR = path.join(process.cwd(), '.agents', 'rules');
const ROOT_AGENTS_FILE = path.join(process.cwd(), 'AGENTS.md');

/**
 * Format raw file or folder name into human-readable title
 */
export function formatTitle(name: string): string {
  let clean = name
    .replace(/\.md$/i, '')
    .replace(/\.txt$/i, '')
    .replace(/^docs_/i, '')
    .replace(/_/g, ' ')
    .replace(/-/g, ' ');

  // Capitalize words
  return clean
    .split(' ')
    .map((word) => {
      if (!word) return '';
      if (['and', 'of', 'for', 'in', 'to', 'the', 'on', 'with', 'by'].includes(word.toLowerCase())) {
        return word.toLowerCase();
      }
      if (['sop', 'cba', 'rfctlarr', 'db', 'ui', 'api', 'pdf', 'docx', 'sse', 'rbac', 'paf', 'paf', 'rnr', 'hq', 'lre', 'gm'].includes(word.toLowerCase())) {
        return word.toUpperCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ')
    .trim();
}

/**
 * Extract H1 title from Markdown content if available
 */
function extractTitleFromContent(content: string, fallbackName: string): string {
  const match = content.match(/^#\s+(.+)$/m);
  if (match && match[1]) {
    return match[1].replace(/[*_~`]/g, '').trim();
  }
  return formatTitle(fallbackName);
}

/**
 * Calculate reading time in minutes
 */
function calculateReadingTime(content: string): number {
  const wordCount = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(wordCount / 200));
}

/**
 * Parse headings (# Heading 1, ## Heading 2, ### Heading 3)
 */
export function extractHeadings(content: string): DocHeading[] {
  const headings: DocHeading[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
    const match = line.match(/^(#{1,4})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const rawText = match[2].replace(/[*_~`]/g, '').trim();
      const id = rawText
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-');

      if (id && rawText) {
        headings.push({ id, text: rawText, level });
      }
    }
  }

  return headings;
}

/**
 * Recursively read directory and return DocFolder tree
 */
function scanDirectory(dirPath: string, relativeParent: string = ''): { files: DocItem[]; subfolders: DocFolder[] } {
  if (!fs.existsSync(dirPath)) {
    return { files: [], subfolders: [] };
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const files: DocItem[] = [];
  const subfolders: DocFolder[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    const relPath = relativeParent ? `${relativeParent}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;

      const child = scanDirectory(fullPath, relPath);
      subfolders.push({
        name: entry.name,
        title: formatTitle(entry.name),
        slugPath: relPath,
        files: child.files,
        subfolders: child.subfolders,
      });
    } else if (entry.isFile() && (entry.name.endsWith('.md') || entry.name.endsWith('.txt'))) {
      const stats = fs.statSync(fullPath);
      const content = fs.readFileSync(fullPath, 'utf-8');
      const slug = relPath.replace(/\.md$/i, '').replace(/\.txt$/i, '').split('/');
      const slugPath = slug.join('/');

      const category = relativeParent ? formatTitle(relativeParent.split('/')[0]) : 'General Documentation';

      files.push({
        id: slugPath,
        title: extractTitleFromContent(content, entry.name),
        slug,
        slugPath,
        relativePath: `docs/${relPath}`,
        category,
        sizeBytes: stats.size,
        updatedAt: stats.mtime.toISOString(),
        readingTimeMinutes: calculateReadingTime(content),
      });
    }
  }

  // Sort files by title
  files.sort((a, b) => a.title.localeCompare(b.title));
  // Sort subfolders by name
  subfolders.sort((a, b) => a.name.localeCompare(b.name));

  return { files, subfolders };
}

/**
 * Get all files flattened into a single list
 */
export function getAllDocFiles(): DocItem[] {
  const root = scanDirectory(DOCS_DIR);
  const result: DocItem[] = [];

  function collect(files: DocItem[], subfolders: DocFolder[]) {
    result.push(...files);
    for (const folder of subfolders) {
      collect(folder.files, folder.subfolders);
    }
  }

  collect(root.files, root.subfolders);

  // Add AGENTS.md if it exists
  if (fs.existsSync(ROOT_AGENTS_FILE)) {
    const stats = fs.statSync(ROOT_AGENTS_FILE);
    const content = fs.readFileSync(ROOT_AGENTS_FILE, 'utf-8');
    result.push({
      id: 'AGENTS',
      title: extractTitleFromContent(content, 'AGENTS.md'),
      slug: ['AGENTS'],
      slugPath: 'AGENTS',
      relativePath: 'AGENTS.md',
      category: 'Agent & System Rules',
      sizeBytes: stats.size,
      updatedAt: stats.mtime.toISOString(),
      readingTimeMinutes: calculateReadingTime(content),
    });
  }

  // Add .agents/rules files
  if (fs.existsSync(AGENTS_DIR)) {
    const rulesScan = scanDirectory(AGENTS_DIR, 'agent-rules');
    function collectRules(files: DocItem[], subfolders: DocFolder[]) {
      for (const file of files) {
        result.push({
          ...file,
          category: 'Agent & System Rules',
        });
      }
      for (const folder of subfolders) {
        collectRules(folder.files, folder.subfolders);
      }
    }
    collectRules(rulesScan.files, rulesScan.subfolders);
  }

  return result;
}

/**
 * Get tree structure for left sidebar navigation
 */
export function getDocTree(): { files: DocItem[]; subfolders: DocFolder[] } {
  const docsTree = scanDirectory(DOCS_DIR);

  // Add agent rules folder if exists
  if (fs.existsSync(AGENTS_DIR)) {
    const rulesScan = scanDirectory(AGENTS_DIR, 'agent-rules');
    docsTree.subfolders.push({
      name: 'agent-rules',
      title: 'Agent & Architecture Rules',
      slugPath: 'agent-rules',
      files: rulesScan.files.map((f) => ({ ...f, category: 'Agent & System Rules' })),
      subfolders: rulesScan.subfolders,
    });
  }

  return docsTree;
}

/**
 * Get single document content and metadata by slug array
 */
export function getDocBySlug(slug: string[]): DocDetail | null {
  const allDocs = getAllDocFiles();
  const slugPath = slug.map((s) => decodeURIComponent(s)).join('/');
  const lowerSlugPath = slugPath.toLowerCase();

  // Find matching doc
  const docMeta = allDocs.find(
    (d) => d.slugPath.toLowerCase() === lowerSlugPath || d.slug.join('/').toLowerCase() === lowerSlugPath
  );

  if (!docMeta) {
    return null;
  }

  // Determine physical path on disk
  let fullPath = '';
  if (docMeta.relativePath === 'AGENTS.md') {
    fullPath = ROOT_AGENTS_FILE;
  } else if (docMeta.relativePath.startsWith('docs/agent-rules/')) {
    const ruleSub = docMeta.relativePath.replace('docs/agent-rules/', '');
    fullPath = path.join(AGENTS_DIR, ruleSub);
  } else {
    const relativeSub = docMeta.relativePath.replace(/^docs\//, '');
    fullPath = path.join(DOCS_DIR, relativeSub);
  }

  if (!fs.existsSync(fullPath)) {
    return null;
  }

  const content = fs.readFileSync(fullPath, 'utf-8');
  const headings = extractHeadings(content);

  // Find previous and next documents for pagination
  const index = allDocs.findIndex((d) => d.id === docMeta.id);
  const prevDoc = index > 0 ? allDocs[index - 1] : null;
  const nextDoc = index < allDocs.length - 1 ? allDocs[index + 1] : null;

  return {
    meta: docMeta,
    content,
    headings,
    prevDoc,
    nextDoc,
  };
}
