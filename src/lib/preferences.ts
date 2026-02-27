export interface PrefsObj {
    repo: string;
    localesDir: string;
    defaultLocale: string;
}

const config = (() => {
    const domain = window.location.hostname;
    const preset = new URLSearchParams(window.location.search).get("preset");

    if (domain.startsWith("cr-translator") || preset?.toLowerCase() === "cr") {
        return {
            defaultFile: "game.json",
            prefs: {
                repo: "FinalForEach/Cosmic-Reach-Localization/tree/master",
                localesDir: "assets/base/lang",
                defaultLocale: "en_us",
            } satisfies PrefsObj,
        };
    }

    return {
        defaultFile: "translation.ts",
        prefs: {
            repo: "PuzzlesHQ/cosmic-mod-manager/tree/main",
            localesDir: "apps/frontend/app/locales",
            defaultLocale: "en-US",
        } satisfies PrefsObj,
    };
})();

const DEFAULTS = config.prefs;
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

export function getDefaultLocaleFile(files: string[]): string {
    for (const file of files) {
        if (config.defaultFile === file.toLowerCase()) {
            return file;
        }
    }

    return files[0];
}
