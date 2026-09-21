import axios from 'axios';
import { Dependency, OsvVulnerability } from './types';

const BATCH_URL = 'https://api.osv.dev/v1/querybatch';
const VULN_URL = 'https://api.osv.dev/v1/vulns';
const CHUNK_SIZE = 100;

interface BatchQueryResult {
  results: { vulns?: { id: string }[] }[];
}

export async function queryOsvBatch(deps: Dependency[]): Promise<Map<Dependency, string[]>> {
  const map = new Map<Dependency, string[]>();

  for (let i = 0; i < deps.length; i += CHUNK_SIZE) {
    const chunk = deps.slice(i, i + CHUNK_SIZE);
    const queries = chunk.map((dep) => ({
      package: { name: dep.name, ecosystem: dep.ecosystem },
      version: dep.version,
    }));

    try {
      const response = await axios.post<BatchQueryResult>(BATCH_URL, { queries });

      response.data.results.forEach((result, index) => {
        const ids = (result.vulns || []).map((v) => v.id);
        if (ids.length > 0) {
          map.set(chunk[index], ids);
        }
      });
    } catch (error) {
      const status = axios.isAxiosError(error) ? error.response?.status : undefined;
      throw new Error(
        `Falha ao consultar a API do OSV.dev${status ? ` (HTTP ${status})` : ''}. Verifique sua conexão e tente novamente.`
      );
    }
  }

  return map;
}

export async function fetchVulnDetails(id: string): Promise<OsvVulnerability | null> {
  try {
    const response = await axios.get<OsvVulnerability>(`${VULN_URL}/${id}`);
    return response.data;
  } catch {
    return null;
  }
}
