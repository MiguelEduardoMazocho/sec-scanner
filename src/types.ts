export interface Dependency {
  name: string;
  version: string;
  ecosystem: 'npm' | 'Maven';
}

export interface OsvSeverity {
  type: string;
  score: string;
}

export interface OsvReference {
  type: string;
  url: string;
}

export interface OsvVulnerability {
  id: string;
  summary?: string;
  details?: string;
  severity?: OsvSeverity[];
  affected?: unknown[];
  references?: OsvReference[];
}

export interface ScanResult {
  dependency: Dependency;
  vulnerabilities: OsvVulnerability[];
}
