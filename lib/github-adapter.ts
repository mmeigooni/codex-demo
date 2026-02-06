import type { GitHubPullRequest } from "@/lib/types";

export interface GitHubAdapter {
  listPullRequests(repo: string, token: string): Promise<GitHubPullRequest[]>;
  getPullRequestDiff(repo: string, pullNumber: number, token: string): Promise<{
    diff: string;
    title: string;
    url: string;
  }>;
}

function assertRepo(repo: string): { owner: string; name: string } {
  const [owner, name] = repo.split("/");
  if (!owner || !name) {
    throw new Error("Repository must be in owner/name format");
  }

  return { owner, name };
}

function createHeaders(token: string, accept?: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    "User-Agent": "workflow-packs-mvp",
    Accept: accept ?? "application/vnd.github+json"
  };
}

export function createOAuthGitHubAdapter(fetchImpl: typeof fetch = fetch): GitHubAdapter {
  return {
    async listPullRequests(repo, token) {
      const { owner, name } = assertRepo(repo);
      const response = await fetchImpl(
        `https://api.github.com/repos/${owner}/${name}/pulls?state=open&per_page=25`,
        { headers: createHeaders(token) }
      );

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`GitHub PR list failed (${response.status}): ${body}`);
      }

      const data = (await response.json()) as GitHubPullRequest[];
      return data;
    },

    async getPullRequestDiff(repo, pullNumber, token) {
      const { owner, name } = assertRepo(repo);
      const metadataResponse = await fetchImpl(
        `https://api.github.com/repos/${owner}/${name}/pulls/${pullNumber}`,
        { headers: createHeaders(token) }
      );

      if (!metadataResponse.ok) {
        const body = await metadataResponse.text();
        throw new Error(`GitHub PR metadata failed (${metadataResponse.status}): ${body}`);
      }

      const metadata = (await metadataResponse.json()) as { title: string; html_url: string };

      const diffResponse = await fetchImpl(
        `https://api.github.com/repos/${owner}/${name}/pulls/${pullNumber}`,
        { headers: createHeaders(token, "application/vnd.github.v3.diff") }
      );

      if (!diffResponse.ok) {
        const body = await diffResponse.text();
        throw new Error(`GitHub PR diff failed (${diffResponse.status}): ${body}`);
      }

      return {
        diff: await diffResponse.text(),
        title: metadata.title,
        url: metadata.html_url
      };
    }
  };
}
