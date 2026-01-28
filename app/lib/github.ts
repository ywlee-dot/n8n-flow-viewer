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

  const encodedPath = encodeGitHubPath(dirPath);
  const url = buildContentsUrl(owner, repo, encodedPath, branch);
  console.log("[ghListDir] request", {
    owner,
    repo,
    branch,
    dirPath,
    encodedPath,
    url,
  });

  const res = await fetch(url, {
    headers: ghHeaders(),
    // 서버리스에서 GitHub API 호출 줄이려고 캐시(원하면 0으로)
    next: { revalidate: 30 },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[ghListDir] response error", {
      status: res.status,
      statusText: res.statusText,
      body: text,
    });
    throw new Error(`GitHub listDir failed (${res.status}): ${text}`);
  }
  const data = (await res.json()) as GithubContent[] | GithubContent;
  if (!Array.isArray(data)) throw new Error("Expected directory listing array");
  console.log("[ghListDir] response ok", { count: data.length });
  return data;
}

export async function ghGetJsonFile(filePath: string): Promise<any> {
  const owner = mustEnv("GITHUB_OWNER");
  const repo = mustEnv("GITHUB_REPO");
  const branch = process.env.GITHUB_BRANCH || "main";

  const encodedPath = encodeGitHubPath(filePath);
  const url = buildContentsUrl(owner, repo, encodedPath, branch);
  console.log("[ghGetJsonFile] request", {
    owner,
    repo,
    branch,
    filePath,
    encodedPath,
    url,
  });

  const res = await fetch(url, {
    headers: ghHeaders(),
    next: { revalidate: 30 },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[ghGetJsonFile] response error", {
      status: res.status,
      statusText: res.statusText,
      body: text,
    });
    throw new Error(`GitHub getFile failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  // GitHub contents API for file includes base64 content
  if (!data?.content || data?.encoding !== "base64") {
    console.error("[ghGetJsonFile] unexpected response", {
      hasContent: !!data?.content,
      encoding: data?.encoding,
    });
    throw new Error("Unexpected GitHub file response (no base64 content)");
  }

  const jsonStr = Buffer.from(data.content, "base64").toString("utf-8");
  return JSON.parse(jsonStr);
}

function encodeGitHubPath(input: string): string {
  const cleanPath = (input || "").replace(/^\/+/, "").replace(/\/+$/, "");
  if (!cleanPath) return "";
  return cleanPath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function buildContentsUrl(owner: string, repo: string, encodedPath: string, branch: string): string {
  const base = `${GH_API}/repos/${owner}/${repo}/contents/${encodedPath}`;
  const u = new URL(base);
  u.searchParams.set("ref", branch);
  return u.toString();
}
