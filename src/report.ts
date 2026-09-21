import chalk from 'chalk';
import { OsvVulnerability, ScanResult } from './types';

function extractSeverity(vuln: OsvVulnerability): string | null {
  if (vuln.severity && vuln.severity.length > 0) {
    return vuln.severity[0].score;
  }
  return null;
}

export function printReport(results: ScanResult[]): void {
  if (results.length === 0) {
    console.log(chalk.green('Nenhuma vulnerabilidade conhecida encontrada.'));
    return;
  }

  let totalVulns = 0;

  for (const result of results) {
    console.log(
      chalk.bold(`\n${result.dependency.name}@${result.dependency.version}`) +
        chalk.gray(` (${result.dependency.ecosystem})`)
    );

    for (const vuln of result.vulnerabilities) {
      totalVulns++;
      const severity = extractSeverity(vuln);
      console.log(`  ${chalk.red(vuln.id)}${severity ? chalk.yellow(` [${severity}]`) : ''}`);
      if (vuln.summary) {
        console.log(`    ${vuln.summary}`);
      }
    }
  }

  console.log(
    chalk.bold(`\nTotal: ${results.length} dependencias afetadas, ${totalVulns} vulnerabilidades encontradas.\n`)
  );
}

export function toJson(results: ScanResult[]): string {
  return JSON.stringify(results, null, 2);
}
