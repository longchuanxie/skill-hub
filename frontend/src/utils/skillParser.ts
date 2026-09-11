import JSZip from 'jszip';

export interface SkillMetadata {
  name?: string;
  description?: string;
  tags: string[];
  compatibility: string[];
  author?: string;
  version?: string;
}

export interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileTreeNode[];
  content?: string;
}

function buildFileTree(files: { name: string; dir: string[] }[]): FileTreeNode[] {
  const root: Map<string, FileTreeNode> = new Map();

  files.forEach(({ name, dir }) => {
    const fullPath = dir.length > 0 ? `${dir.join('/')}/${name}` : name;
    const parts = fullPath.split('/');
    let current = root;
    let currentPath = '';

    parts.forEach((part, index) => {
      const isLast = index === parts.length - 1;
      currentPath = currentPath ? `${currentPath}/${part}` : part;

      if (isLast) {
        if (!current.has(part)) {
          current.set(part, {
            name: part,
            path: currentPath,
            type: 'file',
          });
        }
      } else {
        if (!current.has(part)) {
          const node: FileTreeNode = {
            name: part,
            path: currentPath,
            type: 'directory',
            children: [],
          };
          current.set(part, node);
        }
        const node = current.get(part)!;
        if (node.type === 'directory' && node.children) {
          current = new Map<string, FileTreeNode>();
          node.children.forEach(child => current.set(child.name, child));
        }
      }
    });
  });

  return Array.from(root.values()).map(node => sortTree(node));
}

function sortTree(node: FileTreeNode): FileTreeNode {
  if (node.type === 'directory' && node.children) {
    node.children.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
    node.children.forEach(child => sortTree(child));
  }
  return node;
}

export async function parseSkillZip(file: File): Promise<{
  metadata: SkillMetadata;
  fileTree: FileTreeNode[];
  rawFiles: Map<string, string>;
}> {
  const zip = new JSZip();
  const zipContent = await zip.loadAsync(file);

  const metadata: SkillMetadata = {
    tags: [],
    compatibility: [],
  };

  const rawFiles = new Map<string, string>();
  const fileList: { name: string; dir: string[] }[] = [];

  for (const [path, zipEntry] of Object.entries(zipContent.files)) {
    if (zipEntry.dir) continue;

    const content = await zipEntry.async('string');
    rawFiles.set(path, content);

    const parts = path.split('/').filter(Boolean);
    const name = parts.pop() || '';
    fileList.push({ name, dir: parts });

    const fileNameLower = name.toLowerCase();
    if (fileNameLower === 'skill.md' || fileNameLower === 'skill.markdown') {
      parseSkillMarkdownContent(content, metadata);
    }
  }

  const fileTree = buildFileTree(fileList);

  return { metadata, fileTree, rawFiles };
}

function parseSkillMarkdownContent(content: string, metadata: SkillMetadata): void {
  const lines = content.split('\n');
  let inFrontmatter = false;
  let frontmatterEnd = false;
  let currentSection = '';
  let descriptionBuffer: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    if (!frontmatterEnd && trimmedLine === '---') {
      if (!inFrontmatter) {
        inFrontmatter = true;
        continue;
      } else {
        inFrontmatter = false;
        frontmatterEnd = true;
        continue;
      }
    }

    if (inFrontmatter) {
      const colonIndex = trimmedLine.indexOf(':');
      if (colonIndex > 0) {
        const key = trimmedLine.substring(0, colonIndex).trim().toLowerCase();
        const value = trimmedLine.substring(colonIndex + 1).trim();

        switch (key) {
          case 'name':
            metadata.name = value;
            break;
          case 'description':
            metadata.description = value;
            break;
          case 'author':
            metadata.author = value;
            break;
          case 'version':
            metadata.version = value;
            break;
          case 'tags':
            metadata.tags = value.split(',').map(t => t.trim()).filter(Boolean);
            break;
          case 'compatibility':
            metadata.compatibility = value.split(',').map(c => c.trim()).filter(Boolean);
            break;
          case 'license':
            break;
        }
      }
      continue;
    }

    if (trimmedLine.startsWith('# ') && !metadata.name) {
      metadata.name = trimmedLine.substring(2).trim();
      continue;
    }

    if (trimmedLine.startsWith('## ')) {
      const section = trimmedLine.substring(3).trim().toLowerCase();

      if (descriptionBuffer.length > 0 && currentSection === 'description') {
        if (!metadata.description) {
          metadata.description = descriptionBuffer.join('\n').trim();
        }
        descriptionBuffer = [];
      }

      currentSection = section;
      continue;
    }

    if (currentSection === 'description') {
      descriptionBuffer.push(line);
    }

    if (currentSection === 'tags' && trimmedLine) {
      const tags = trimmedLine.split(',').map(t => t.trim()).filter(Boolean);
      if (metadata.tags.length === 0) {
        metadata.tags = tags;
      }
    }

    if (currentSection === 'compatibility' && trimmedLine) {
      const compat = trimmedLine.split(',').map(c => c.trim()).filter(Boolean);
      if (metadata.compatibility.length === 0) {
        metadata.compatibility = compat;
      }
    }

    if (currentSection === 'author' && trimmedLine && !metadata.author) {
      metadata.author = trimmedLine;
    }

    if (currentSection === 'version' && trimmedLine && !metadata.version) {
      metadata.version = trimmedLine;
    }
  }

  if (descriptionBuffer.length > 0 && currentSection === 'description' && !metadata.description) {
    metadata.description = descriptionBuffer.join('\n').trim();
  }
}

export function getFileContent(filePath: string, rawFiles: Map<string, string>): string | null {
  return rawFiles.get(filePath) || null;
}

export function updateFileContent(
  filePath: string,
  content: string,
  rawFiles: Map<string, string>
): void {
  rawFiles.set(filePath, content);
}

export function isTextFile(filename: string): boolean {
  const textExtensions = [
    '.txt', '.md', '.markdown', '.json', '.js', '.ts', '.jsx', '.tsx',
    '.css', '.scss', '.less', '.html', '.htm', '.xml', '.yaml', '.yml',
    '.toml', '.ini', '.cfg', '.conf', '.sh', '.bash', '.py', '.rb',
    '.go', '.rs', '.java', '.c', '.cpp', '.h', '.hpp', '.cs', '.swift',
    '.kt', '.scala', '.php', '.pl', '.sql', '.graphql', '.env', '.gitignore',
    '.dockerfile', '.makefile', '.lock'
  ];

  const ext = filename.toLowerCase().split('.').pop() || '';
  return textExtensions.includes(`.${ext}`) || filename.startsWith('.');
}

export function getFileIcon(filename: string): string {
  const ext = filename.toLowerCase().split('.').pop() || '';

  const iconMap: Record<string, string> = {
    'md': '📄',
    'markdown': '📄',
    'txt': '📄',
    'json': '📋',
    'js': '📜',
    'ts': '📜',
    'jsx': '⚛️',
    'tsx': '⚛️',
    'css': '🎨',
    'html': '🌐',
    'png': '🖼️',
    'jpg': '🖼️',
    'jpeg': '🖼️',
    'gif': '🖼️',
    'svg': '🖼️',
    'zip': '📦',
  };

  return iconMap[ext] || '📄';
}
