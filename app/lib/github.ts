// lib/github.ts
type GithubContentFile = {
  type: "file";
  name: string;
  path: string;
  sha: string;
  size: number;
  download_url: string | null;
};

type GithubContentDir = {
  type: "dir";
  name: string;
  path: string;
  sha: string;
};

type GithubContent = GithubContentFile | GithubContentDir;

const GH_API = "https://api.github.com";

function mustEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function ghHeaders() {
  const token = mustEnv("GITHUB_TOKEN");
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

export async function ghListDir(dirPath: string): Promise<GithubContent[]> {
  const owner = mustEnv("GITHUB_OWNER");
  const repo = mustEnv("GITHUB_REPO");
  const branch = process.env.GITHUB_BRANCH || "main";

  const url = `${GH_API}/repos/${owner}/${repo}/contents/${encodeURIComponent(dirPath)}?ref=${encodeURIComponent(branch)}`;

  const res = await fetch(url, {
    headers: ghHeaders(),
    // 서버리스에서 GitHub API 호출 줄이려고 캐시(원하면 0으로)
    next: { revalidate: 30 },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub listDir failed (${res.status}): ${text}`);
  }
  const data = (await res.json()) as GithubContent[] | GithubContent;
  if (!Array.isArray(data)) throw new Error("Expected directory listing array");
  return data;
}

export async function ghGetJsonFile(filePath: string): Promise<any> {
  const owner = mustEnv("GITHUB_OWNER");
  const repo = mustEnv("GITHUB_REPO");
  const branch = process.env.GITHUB_BRANCH || "main";

  const url = `${GH_API}/repos/${owner}/${repo}/contents/${encodeURIComponent(filePath)}?ref=${encodeURIComponent(branch)}`;

  const res = await fetch(url, {
    headers: ghHeaders(),
    next: { revalidate: 30 },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub getFile failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  // GitHub contents API for file includes base64 content
  if (!data?.content || data?.encoding !== "base64") {
    throw new Error("Unexpected GitHub file response (no base64 content)");
  }

  const jsonStr = Buffer.from(data.content, "base64").toString("utf-8");
  return JSON.parse(jsonStr);
}
