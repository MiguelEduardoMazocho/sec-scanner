#!/usr/bin/env node
import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import { parseNpmProject } from './parsers/npm';
import { parseMavenProject } from './parsers/maven';
import { queryOsvBatch, fetchVulnDetails } from './osv';
import { printReport, toJson } from './report';
import { Dependency, ScanResult } from './types';

interface CliOptions {
  output?: string;
  failOnVuln?: boolean;
}

const program = new Command();

program
  .name('sec-scanner')
  .description('Escaneia dependencias npm e Maven em busca de vulnerabilidades conhecidas via OSV.dev')
  .argument('[path]', 'Caminho do projeto a escanear', '.')
  .option('-o, --output <file>', 'Salva o relatorio em formato JSON no caminho especificado')
  .option('--fail-on-vuln', 'Encerra com codigo de saida 1 caso alguma vulnerabilidade seja encontrada')
  .action(async (targetPath: string, options: CliOptions) => {
    const resolvedPath = path.resolve(targetPath);

    if (!fs.existsSync(resolvedPath)) {
      console.error(`Caminho nao encontrado: ${resolvedPath}`);
      process.exit(1);
    }

    const npmDeps = parseNpmProject(resolvedPath);
    const mavenDeps = parseMavenProject(resolvedPath);
    const allDeps: Dependency[] = [...npmDeps, ...mavenDeps];

    if (allDeps.length === 0) {
      console.log('Nenhuma dependencia encontrada (package.json/package-lock.json ou pom.xml).');
      return;
    }

    console.log(`Escaneando ${allDeps.length} dependencias...`);

    let vulnMap: Map<Dependency, string[]>;
    try {
      vulnMap = await queryOsvBatch(allDeps);
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }

    const results: ScanResult[] = [];

    for (const [dep, ids] of vulnMap.entries()) {
      const details = await Promise.all(ids.map((id) => fetchVulnDetails(id)));
      const vulnerabilities = details.filter((d): d is NonNullable<typeof d> => d !== null);
      results.push({ dependency: dep, vulnerabilities });
    }

    printReport(results);

    if (options.output) {
      fs.writeFileSync(options.output, toJson(results));
      console.log(`Relatorio salvo em ${options.output}`);
    }

    if (options.failOnVuln && results.length > 0) {
      process.exit(1);
    }
  });

program.parseAsync(process.argv);
