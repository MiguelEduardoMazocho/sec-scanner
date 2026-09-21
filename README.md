# sec-scanner

CLI que escaneia dependências de projetos npm e Maven em busca de vulnerabilidades conhecidas (CVEs), usando a base pública de dados do [OSV.dev](https://osv.dev).

## Instalação

```bash
npm install
npm run build
npm link
```

## Uso

```bash
sec-scanner /caminho/do/projeto
sec-scanner . --output relatorio.json
sec-scanner . --fail-on-vuln
```

Sem argumento, escaneia o diretório atual.

## O que ele detecta

- Projetos npm: lê `package-lock.json` (versões resolvidas exatas) ou, na ausência dele, `package.json`.
- Projetos Maven: lê `pom.xml`, resolvendo versões definidas via `<properties>`.

Para cada dependência encontrada, consulta a API do OSV.dev em lote (`/v1/querybatch`) e, para cada vulnerabilidade retornada, busca os detalhes completos (`/v1/vulns/{id}`): resumo, severidade e referências.

## Saída

- Console: relatório colorido com dependências afetadas, IDs de vulnerabilidade e severidade.
- `--output <arquivo>`: exporta o relatório completo em JSON, incluindo `summary`, `details` e `references` de cada vulnerabilidade.
- `--fail-on-vuln`: encerra com código de saída `1` quando há vulnerabilidades, útil para pipelines de CI.

## Ideias de evolução

- Suporte a `requirements.txt`/`poetry.lock` (Python) e `go.mod` (Go).
- Integração com GitHub Actions publicando o relatório como comentário em PR.
- Cache local de resultados por hash do lockfile, evitando reconsultas.
