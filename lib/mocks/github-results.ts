// Mock results match the shape returned by lib/github.ts (NOT raw GitHub API)
// searchCode returns { results: CodeResult[], totalCount: number }
// searchRepos returns { results: RepoResult[], totalCount: number }

const CODE_RESULTS = {
  success: true,
  results: [
    {
      name: 'wind_load_calculator.py',
      path: 'src/loads/wind_load_calculator.py',
      repository: 'struct-eng/wind-analysis',
      url: 'https://github.com/struct-eng/wind-analysis/blob/main/src/loads/wind_load_calculator.py',
      score: 98.5,
    },
    {
      name: 'steel_beam_design.py',
      path: 'design/steel/steel_beam_design.py',
      repository: 'civilpy/structural-analysis',
      url: 'https://github.com/civilpy/structural-analysis/blob/main/design/steel/steel_beam_design.py',
      score: 95.2,
    },
    {
      name: 'seismic_response.rs',
      path: 'src/analysis/seismic_response.rs',
      repository: 'fea-lab/quake-solver',
      url: 'https://github.com/fea-lab/quake-solver/blob/main/src/analysis/seismic_response.rs',
      score: 91.8,
    },
    {
      name: 'ifc_parser.ts',
      path: 'lib/parsers/ifc_parser.ts',
      repository: 'XbimTeam/XbimEssentials',
      url: 'https://github.com/XbimTeam/XbimEssentials/blob/main/lib/parsers/ifc_parser.ts',
      score: 87.3,
    },
    {
      name: 'concrete_mix.py',
      path: 'materials/concrete_mix.py',
      repository: 'struct-eng/material-specs',
      url: 'https://github.com/struct-eng/material-specs/blob/main/materials/concrete_mix.py',
      score: 83.1,
    },
    {
      name: 'cognee_pipeline.py',
      path: 'cognee/tasks/pipeline.py',
      repository: 'topoteretes/cognee',
      url: 'https://github.com/topoteretes/cognee/blob/main/cognee/tasks/pipeline.py',
      score: 79.4,
    },
    {
      name: 'cli_agent.py',
      path: 'cli_anything/agent/cli_agent.py',
      repository: 'HKUDS/CLI-Anything',
      url: 'https://github.com/HKUDS/CLI-Anything/blob/main/cli_anything/agent/cli_agent.py',
      score: 76.8,
    },
    {
      name: 'manus_agent.py',
      path: 'openmanus/agents/manus_agent.py',
      repository: 'FoundationAgents/OpenManus',
      url: 'https://github.com/FoundationAgents/OpenManus/blob/main/openmanus/agents/manus_agent.py',
      score: 74.2,
    },
  ],
  totalCount: 8,
}

const REPO_RESULTS = {
  success: true,
  results: [
    { name: 'opensees/OpenSees', description: 'Open System for Earthquake Engineering Simulation - finite element framework for structural and geotechnical analysis', language: 'C++', stars: 1247, url: 'https://github.com/opensees/OpenSees', updatedAt: '2026-03-10T12:00:00Z' },
    { name: 'topoteretes/cognee', description: 'AI memory engine \u2014 deterministic data pipelines for building reliable AI applications with knowledge graphs, vector stores, and LLMs', language: 'Python', stars: 4850, url: 'https://github.com/topoteretes/cognee', updatedAt: '2026-03-15T08:30:00Z' },
    { name: 'HKUDS/CLI-Anything', description: 'Universal CLI agent \u2014 use natural language to control any command-line tool with LLM-powered intelligent routing', language: 'Python', stars: 2130, url: 'https://github.com/HKUDS/CLI-Anything', updatedAt: '2026-03-14T16:45:00Z' },
    { name: 'FoundationAgents/OpenManus', description: 'Open-source framework for building general AI agents \u2014 tool use, planning, and multi-agent orchestration', language: 'Python', stars: 3720, url: 'https://github.com/FoundationAgents/OpenManus', updatedAt: '2026-03-13T22:00:00Z' },
    { name: 'XbimTeam/XbimEssentials', description: 'Essential libraries for BIM/IFC model reading, creation, and geometry processing', language: 'C#', stars: 892, url: 'https://github.com/XbimTeam/XbimEssentials', updatedAt: '2026-02-28T10:15:00Z' },
    { name: 'struct-eng/aisc-shapes-db', description: 'Complete AISC steel shapes database with section properties - W, S, HP, C, L, HSS, Pipe shapes', language: 'Python', stars: 634, url: 'https://github.com/struct-eng/aisc-shapes-db', updatedAt: '2026-03-01T14:20:00Z' },
    { name: 'civilpy/structural-analysis', description: 'Python library for structural analysis \u2014 beams, frames, trusses with AISC/ACI code checks', language: 'Python', stars: 421, url: 'https://github.com/civilpy/structural-analysis', updatedAt: '2026-02-20T09:00:00Z' },
    { name: 'fea-lab/quake-solver', description: 'High-performance seismic response spectrum analysis engine written in Rust', language: 'Rust', stars: 318, url: 'https://github.com/fea-lab/quake-solver', updatedAt: '2026-03-05T18:30:00Z' },
  ],
  totalCount: 8,
}

export function getMockGithubResponse(action: string): object {
  switch (action) {
    case 'searchCode':
      return CODE_RESULTS
    case 'searchRepos':
      return REPO_RESULTS
    case 'getContents':
      return { success: true, data: { type: 'file', name: 'README.md', content: '# Mock repository content', encoding: 'utf-8' } }
    default:
      return { success: false, error: 'Invalid action' }
  }
}
