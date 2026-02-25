export interface PrefsObj {
    repo: string;
    localesDir: string;
    defaultLocale: string;
}

const DEFAULTS = {
    repo: "PuzzlesHQ/cosmic-mod-manager/tree/main",
    localesDir: "apps/frontend/app/locales",
    defaultLocale: "en",
} satisfies PrefsObj;

const STORAGE_KEY = "prefs";
export function savePreferences(preferences: PrefsObj) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
}

export function resetPreferences() {
    localStorage.removeItem(STORAGE_KEY);
    return DEFAULTS;
}

export function loadPreferences(): PrefsObj {
    try {
        const preferences = localStorage.getItem(STORAGE_KEY);
        if (preferences) {
            const obj = JSON.parse(preferences);
            return obj;
        }
    } catch (error) {
        console.error(error);
    }

    return DEFAULTS;
}

const preferredNames = ["translation.ts", "game.json"];
export function getDefaultLocaleFile(files: string[]): string {
    for (const file of files) {
        if (preferredNames.includes(file.toLowerCase())) {
            return file;
        }
    }

    return files[0];
}
