import type { GitHubPullRequest } from "@/lib/types";
import { AppError } from "@/lib/errors";

export interface GitHubAdapter {
  listPullRequests(repo: string, token: string): Promise<GitHubPullRequest[]>;
  getPullRequestDiff(repo: string, pullNumber: number, token: string): Promise<{
    diff: string;
    title: string;
    url: string;
  }>;
  getFileContent(repo: string, path: string, branch: string, token: string): Promise<{
    content: string;
    sha: string;
  }>;
  commitFileContent(input: {
    repo: string;
    path: string;
    branch: string;
    token: string;
    message: string;
    content: string;
    sha: string;
  }): Promise<{
    commitSha: string;
    commitUrl: string;
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

function encodeRepoPath(path: string): string {
  return path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

async function throwGitHubError(response: Response, operation: string): Promise<never> {
  const body = await response.text();

  if (response.status === 401 || response.status === 403 || response.status === 404) {
    throw new AppError(
      403,
      "github_access_denied",
      `${operation} failed (${response.status}): ${body}`,
      false
    );
  }

  throw new AppError(
    502,
    "github_upstream_error",
    `${operation} failed (${response.status}): ${body}`,
    response.status >= 500 || response.status === 429
  );
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
        await throwGitHubError(response, "GitHub PR list");
      }

      const data = (await response.json()) as Array<GitHubPullRequest & {
        head?: { ref?: string; sha?: string };
        base?: { ref?: string };
      }>;

      return data.map((pullRequest) => ({
        ...pullRequest,
        head: {
          ref: pullRequest.head?.ref ?? "",
          sha: pullRequest.head?.sha ?? ""
        },
        base: {
          ref: pullRequest.base?.ref ?? ""
        }
      }));
    },

    async getPullRequestDiff(repo, pullNumber, token) {
      const { owner, name } = assertRepo(repo);
      const metadataResponse = await fetchImpl(
        `https://api.github.com/repos/${owner}/${name}/pulls/${pullNumber}`,
        { headers: createHeaders(token) }
      );

      if (!metadataResponse.ok) {
        await throwGitHubError(metadataResponse, "GitHub PR metadata");
      }

      const metadata = (await metadataResponse.json()) as { title: string; html_url: string };

      const diffResponse = await fetchImpl(
        `https://api.github.com/repos/${owner}/${name}/pulls/${pullNumber}`,
        { headers: createHeaders(token, "application/vnd.github.v3.diff") }
      );

      if (!diffResponse.ok) {
        await throwGitHubError(diffResponse, "GitHub PR diff");
      }

      return {
        diff: await diffResponse.text(),
        title: metadata.title,
        url: metadata.html_url
      };
    },

    async getFileContent(repo, path, branch, token) {
      const { owner, name } = assertRepo(repo);
      const response = await fetchImpl(
        `https://api.github.com/repos/${owner}/${name}/contents/${encodeRepoPath(path)}?ref=${encodeURIComponent(branch)}`,
        { headers: createHeaders(token) }
      );

      if (!response.ok) {
        const body = await response.text();
        if (response.status === 404) {
          throw new AppError(422, "github_file_not_found", `GitHub file not found (${response.status}): ${body}`);
        }

        await throwGitHubError(response, "GitHub get file content");
      }

      const data = (await response.json()) as {
        content: string;
        encoding: string;
        sha: string;
      };

      if (!data.content || !data.sha) {
        throw new AppError(502, "github_invalid_file_payload", "GitHub file payload missing content or sha");
      }

      const decoded = Buffer.from(data.content.replace(/\n/g, ""), data.encoding === "base64" ? "base64" : "utf8").toString("utf8");

      return {
        content: decoded,
        sha: data.sha
      };
    },

    async commitFileContent(input) {
      const { owner, name } = assertRepo(input.repo);
      const response = await fetchImpl(
        `https://api.github.com/repos/${owner}/${name}/contents/${encodeRepoPath(input.path)}`,
        {
          method: "PUT",
          headers: {
            ...createHeaders(input.token),
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            message: input.message,
            content: Buffer.from(input.content, "utf8").toString("base64"),
            sha: input.sha,
            branch: input.branch
          })
        }
      );

      if (!response.ok) {
        const body = await response.text();

        if (response.status === 409) {
          throw new AppError(409, "github_conflict", `GitHub commit conflict (${response.status}): ${body}`);
        }

        if (response.status === 404) {
          throw new AppError(422, "github_file_not_found", `GitHub commit path not found (${response.status}): ${body}`);
        }

        if (response.status === 401 || response.status === 403) {
          throw new AppError(403, "github_access_denied", `GitHub commit denied (${response.status}): ${body}`);
        }

        throw new AppError(
          502,
          "github_upstream_error",
          `GitHub commit failed (${response.status}): ${body}`,
          response.status >= 500 || response.status === 429
        );
      }

      const payload = (await response.json()) as {
        commit?: {
          sha?: string;
          html_url?: string;
        };
      };

      const commitSha = payload.commit?.sha;
      const commitUrl = payload.commit?.html_url;

      if (!commitSha || !commitUrl) {
        throw new AppError(502, "github_invalid_commit_payload", "GitHub commit payload missing sha or url");
      }

      return {
        commitSha,
        commitUrl
      };
    }
  };
}
