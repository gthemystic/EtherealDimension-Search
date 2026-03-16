import { Octokit } from "@octokit/rest"

let octokit: Octokit | null = null

function getOctokit(): Octokit {
  if (!octokit) {
    const token = process.env.GITHUB_PAT_TOKEN
    if (!token) throw new Error("GITHUB_PAT_TOKEN not set")
    octokit = new Octokit({ auth: token })
  }
  return octokit
}

export async function searchCode(query: string) {
  const ok = getOctokit()
  const res = await ok.search.code({ q: query, per_page: 10 })
  return {
    results: res.data.items.map((item) => ({
      name: item.name,
      path: item.path,
      repository: item.repository.full_name,
      url: item.html_url,
      score: item.score,
    })),
    totalCount: res.data.total_count,
  }
}

export async function searchRepos(query: string) {
  const ok = getOctokit()
  const res = await ok.search.repos({ q: query, per_page: 10, sort: "stars" })
  return {
    results: res.data.items.map((item) => ({
      name: item.full_name,
      description: item.description,
      stars: item.stargazers_count,
      language: item.language,
      url: item.html_url,
      updatedAt: item.updated_at,
    })),
    totalCount: res.data.total_count,
  }
}

export async function getContents(owner: string, repo: string, path: string) {
  const ok = getOctokit()
  const res = await ok.repos.getContent({ owner, repo, path })
  return res.data
}
