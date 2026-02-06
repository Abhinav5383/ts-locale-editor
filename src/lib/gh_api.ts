// const GITHUB_API = "https://api.github.com";
// const  GITHUB_RAW = "https://raw.githubusercontent.com";

export async function getFileContents(repo: string, path: string, ref: string) {
    // const fetchUrl = `https://raw.githubusercontent.com/${repo}/${ref}/${path}`;
    const fetchUrl =
        "https://raw.githubusercontent.com/PuzzlesHQ/cosmic-mod-manager/refs/heads/dev/apps/frontend/app/locales/en/about.ts";
    // "https://raw.githubusercontent.com/PuzzlesHQ/cosmic-mod-manager/refs/heads/dev/apps/frontend/app/locales/en/legal/copyright.ts";
    const res = await fetch(fetchUrl);

    if (!res.ok) {
        throw new Error(`Failed to fetch file contents: ${res.status} ${res.statusText}`);
    }

    return await res.text();
}
