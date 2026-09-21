import fs from 'fs';
import path from 'path';
import { Dependency } from '../types';

interface NpmLockPackageEntry {
  version?: string;
}

interface NpmLockFile {
  packages?: Record<string, NpmLockPackageEntry>;
  dependencies?: Record<string, NpmLockPackageEntry>;
}

interface PackageJsonFile {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

export function parseNpmProject(projectPath: string): Dependency[] {
  const lockPath = path.join(projectPath, 'package-lock.json');
  const pkgPath = path.join(projectPath, 'package.json');

  if (fs.existsSync(lockPath)) {
    const lock: NpmLockFile = JSON.parse(fs.readFileSync(lockPath, 'utf-8'));
    const deps: Dependency[] = [];

    if (lock.packages) {
      for (const [key, value] of Object.entries(lock.packages)) {
        if (!key || !key.startsWith('node_modules/')) continue;
        const name = key.replace(/^.*node_modules\//, '');
        if (!value.version) continue;
        deps.push({ name, version: value.version, ecosystem: 'npm' });
      }
    } else if (lock.dependencies) {
      for (const [name, value] of Object.entries(lock.dependencies)) {
        if (!value.version) continue;
        deps.push({ name, version: value.version, ecosystem: 'npm' });
      }
    }

    const unique = new Map<string, Dependency>();
    for (const dep of deps) {
      unique.set(`${dep.name}@${dep.version}`, dep);
    }
    return Array.from(unique.values());
  }

  if (fs.existsSync(pkgPath)) {
    const pkg: PackageJsonFile = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    const deps: Dependency[] = [];
    const sections: (keyof PackageJsonFile)[] = ['dependencies', 'devDependencies'];

    for (const section of sections) {
      const entries = pkg[section];
      if (!entries) continue;
      for (const [name, version] of Object.entries(entries)) {
        const cleanVersion = version.replace(/^[\^~>=<]+/, '');
        deps.push({ name, version: cleanVersion, ecosystem: 'npm' });
      }
    }
    return deps;
  }

  return [];
}
