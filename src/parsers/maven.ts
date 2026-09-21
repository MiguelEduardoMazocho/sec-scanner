import fs from 'fs';
import path from 'path';
import { XMLParser } from 'fast-xml-parser';
import { Dependency } from '../types';

interface PomDependency {
  groupId?: string;
  artifactId?: string;
  version?: string;
}

interface PomProject {
  properties?: Record<string, string>;
  dependencies?: {
    dependency?: PomDependency | PomDependency[];
  };
}

interface PomFile {
  project?: PomProject;
}

export function parseMavenProject(projectPath: string): Dependency[] {
  const pomPath = path.join(projectPath, 'pom.xml');
  if (!fs.existsSync(pomPath)) return [];

  const xml = fs.readFileSync(pomPath, 'utf-8');
  const parser = new XMLParser();
  const parsed: PomFile = parser.parse(xml);

  const project = parsed.project;
  if (!project) return [];

  const properties = project.properties || {};
  const rawDeps = project.dependencies?.dependency;
  if (!rawDeps) return [];

  const list = Array.isArray(rawDeps) ? rawDeps : [rawDeps];
  const deps: Dependency[] = [];

  for (const dep of list) {
    const groupId = dep.groupId;
    const artifactId = dep.artifactId;
    let version = dep.version;

    if (version && version.startsWith('${') && version.endsWith('}')) {
      const propName = version.slice(2, -1);
      version = properties[propName] || version;
    }

    if (!groupId || !artifactId || !version) continue;
    deps.push({ name: `${groupId}:${artifactId}`, version, ecosystem: 'Maven' });
  }

  return deps;
}
