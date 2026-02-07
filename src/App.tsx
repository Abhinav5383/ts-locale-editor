/** biome-ignore-all lint/style/noNonNullAssertion: --- */

import { type SearchParams, useSearchParams } from "@solidjs/router";
import { createResource, createSignal, Show } from "solid-js";
import "~/App.css";
import Navbar from "~/components/layout/navbar";
import Editor from "~/components/ui/editor";
import { updateNodeValue } from "~/components/ui/node-updater";
import type { node_OnChangeHandler } from "~/components/ui/renderers/types";
import { getFilesListFromLocale, getLocaleFileContents, getLocalesList } from "~/lib/gh_api";
import { getTranslationNodesFromTxtFile } from "~/lib/parser";
import { DEFAULT_LOCALE, DEFAULT_LOCALE_FILE, loadPreferences } from "~/lib/preferences";
import type { ObjectNode, TranslationNode } from "~/lib/types";

interface TranslationNodesResult {
    src: string | undefined;
    nodes: ObjectNode;
}

export default function App() {
    const [preferences, setPreferences] = createSignal(loadPreferences());
    const [localesList] = createResource(preferences, async (prefs) => {
        return await getLocalesList(prefs.repo, prefs.localesDir);
    });
    const [localeFilesList] = createResource(preferences, async (prefs) => {
        return await getFilesListFromLocale(prefs.repo, prefs.localesDir);
    });

    const [searchParams, setSearchParams] = useSearchParams();
    const selectedFile = () => getSearchParam(searchParams, "file", DEFAULT_LOCALE_FILE);
    function setSelectedFile(file: string) {
        setSearchParams({ file });
    }

    const translatingFrom = () => getSearchParam(searchParams, "from", DEFAULT_LOCALE);
    function setTranslatingFrom(locale: string) {
        setSearchParams({ from: locale });
    }

    const translatingTo = () => getSearchParam(searchParams, "to", "");
    function setTranslatingTo(locale: string) {
        setSearchParams({ to: locale });
    }

    const refDeps = () => ({
        prefs: preferences(),
        selectedFile: selectedFile(),
        translatingFrom: translatingFrom(),
    });

    const [refLocale] = createResource(refDeps, (deps): Promise<TranslationNodesResult> => {
        return getTranslationNodes(
            deps.prefs.repo,
            `${deps.prefs.localesDir}/${deps.translatingFrom}/${deps.selectedFile}`,
        );
    });

    const translatingTo_Deps = () => ({
        prefs: preferences(),
        selectedFile: selectedFile(),
        translatingTo: translatingTo(),
    });

    const [translatingLocale] = createResource(
        translatingTo_Deps,
        async (deps): Promise<TranslationNodesResult> => {
            if (deps.translatingTo) {
                return await getTranslationNodes(
                    deps.prefs.repo,
                    `${deps.prefs.localesDir}/${deps.translatingTo}/${deps.selectedFile}`,
                );
            }

            const src = "export default {};";
            return {
                src: undefined,
                nodes: getTranslationNodesFromTxtFile(src),
            };
        },
    );

    const [editedLocale, { mutate: setEditedLocale }] = createResource(
        translatingLocale,
        (translatingLocale): ObjectNode => {
            const translating = translatingLocale;
            if (!translating) {
                return {
                    type: "object",
                    value: [],
                };
            }

            return translating.nodes;
        },
    );

    const handleTranslatingLocaleChange: node_OnChangeHandler = (
        path: string[],
        node: TranslationNode,
    ) => {
        const oldEditedState = editedLocale();
        if (!oldEditedState) return;

        setEditedLocale(updateNodeValue(path, oldEditedState, node));
    };

    return (
        <main class="main-wrapper">
            <Navbar currPrefs={preferences()} setPrefs={setPreferences} />

            <Show
                when={
                    localesList.loading === false &&
                    localesList() &&
                    localeFilesList.loading === false &&
                    localeFilesList() &&
                    refLocale.loading === false &&
                    refLocale() &&
                    translatingLocale.loading === false &&
                    translatingLocale()
                }
                fallback={
                    <div class="loading">
                        <p>Loading...</p>
                    </div>
                }
            >
                <Editor
                    refNodes={refLocale()!.nodes}
                    editingLocaleSrc={translatingLocale()!.src}
                    editedNodes={translatingLocale()!.nodes}
                    onChange={handleTranslatingLocaleChange}
                    preferences={preferences()}
                    // select controls
                    localesList={localesList()!}
                    localeFilesList={localeFilesList()!}
                    selectedFile={selectedFile()}
                    setSelectedFile={setSelectedFile}
                    translatingFrom={translatingFrom()}
                    setTranslatingFrom={setTranslatingFrom}
                    translatingTo={translatingTo()}
                    setTranslatingTo={setTranslatingTo}
                />
            </Show>

            {/* Errors */}
            <Show when={localesList.error}>
                <p>Error: {localesList.error?.message}</p>
            </Show>

            <Show when={localeFilesList.error}>
                <p>Error: {localeFilesList.error?.message}</p>
            </Show>
        </main>
    );
}

async function getTranslationNodes(repo: string, localeFile: string) {
    let fileContents = await getLocaleFileContents(repo, localeFile).catch((error) => {
        console.error(error);
        return null;
    });
    if (!fileContents) fileContents = "export default {};";

    return {
        src: fileContents,
        nodes: getTranslationNodesFromTxtFile(fileContents),
    };
}

function getSearchParam(searchParams: SearchParams, key: string, defaultValue: string): string {
    const value = searchParams[key];
    if (typeof value === "string") return value;
    return defaultValue;
}
