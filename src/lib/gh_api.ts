let RAW_GITHUB_URL = "https://raw.githubusercontent.com";
// CORS reasons
if (import.meta.env.DEV === true) {
    RAW_GITHUB_URL = "";
}

const GITHUB_API_URL = "https://api.github.com";
const CACHE = new Map<string, string>();

export interface Dir {
    name: string;
    path: string;
    download_url: string;
    type: "file" | "dir";

    files?: Dir[];
}

export async function getLocalesList(_repo: string, localeDir: string): Promise<Dir[]> {
    try {
        const [repo, branch] = parseRepoPath(_repo);
        let url = `${GITHUB_API_URL}/repos/${repo}/contents/${localeDir}`;
        if (branch) url += `?ref=${branch}`;

        const res = await githubFetch(url);
        if (!res) throw new Error("Failed to fetch locales from GitHub!");

        const items = JSON.parse(res) as Dir[];
        const files = items.map((item) => {
            return {
                name: item.name,
                path: item.path,
                download_url: item.download_url,
                type: item.type,
            };
        });

        const dirs = files.filter((file) => file.type === "dir" && file.name !== "default");
        return dirs;
    } catch (error) {
        console.error("Error fetching locales.");
        console.error(error);
        throw new Error(
            "Failed to fetch locales from repo, please double check the repo path and try again. Check browser console for more detatils",
        );
    }
}

export async function getFilesListFromLocale(_repo: string, dirPath: string) {
    try {
        const localeFiles: Dir[] = [];
        const [repo, branch] = parseRepoPath(_repo);
        let url = `${GITHUB_API_URL}/repos/${repo}/contents/${dirPath}`;
        if (branch) url += `?ref=${branch}`;

        const res = await githubFetch(url);
        if (!res) throw new Error("Failed to fetch locale files from GitHub!");

        const items = JSON.parse(res) as Dir[];

        for (const item of items) {
            const dirObj: Dir = {
                name: item.name,
                path: item.path,
                download_url: item.download_url,
                type: item.type,
            };

            if (item.type === "dir") {
                const files = await getFilesListFromLocale(_repo, item.path);
                dirObj.files = files;
            }

            localeFiles.push(dirObj);
        }

        return localeFiles;
    } catch (error) {
        console.error(error);
        throw new Error("Failed to fetch locale files! See browser console for details.");
    }
}

export async function getLocaleFileContents(_repo: string, filePath: string) {
    const [repo, branch] = parseRepoPath(_repo);
    return await githubFetch(`${RAW_GITHUB_URL}/${repo}/${branch}/${filePath}`);
}

export function absoluteDirUrl(RepoPath: string, LANG_DIR: string, dir: Dir) {
    return `${GITHUB_API_URL}/${RepoPath}/contents/${LANG_DIR}/${dir.path}`;
}

export function flattenDirs(dir: Dir[], parent: string[] = []) {
    const files: (Dir & { parent: string[] })[] = [];

    for (const item of dir) {
        if (item.type === "dir") {
            files.push(
                ...flattenDirs(item.files || [], parent ? [...parent, item.name] : [item.name]),
            );
        } else {
            files.push({
                ...item,
                parent: parent,
            });
        }
    }

    return files;
}

async function githubFetch(url: RequestInfo | URL, options?: RequestInit) {
    const cachedResponse = CACHE.get(url.toString());
    if (cachedResponse) return cachedResponse;

    try {
        const res = await fetch(url, {
            // headers: {
            //     Authorization: "token TOKEN",
            // },
            ...options,
        });
        if (!res.ok) return null;

        const txt = await res.text();
        CACHE.set(url.toString(), txt);

        return txt;
    } catch (error) {
        CACHE.delete(url.toString());

        console.error(url);
        console.error(error);

        throw new Error("Failed to fetch from GitHub!");
    }
}

function parseRepoPath(repoStr: string) {
    if (!repoStr.includes("/tree/")) return [repoStr, "HEAD"];
    const split = repoStr.split("/tree/");
    return [split[0], split[1] || "HEAD"];
}
