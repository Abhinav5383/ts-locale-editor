import { Match, Show, Switch, createResource } from "solid-js";
import Navbar from "~/components/layout/navbar";
import { getFileContents } from "~/lib/gh_api";
import { getTranslationNodesFromTxtFile } from "~/lib/parser";
import "./App.css";
import Editor from "./components/ui/editor";
import { updateNodeValue } from "./components/ui/node-updater";
import type { node_OnChangeHandler } from "./components/ui/renderers/types";
import type { ObjectNode, TranslationNode } from "./lib/types";

interface TranslationNodesResult {
    src: string;
    nodes: ObjectNode;
}

export default function App() {
    const [refLocale] = createResource((): Promise<TranslationNodesResult> => {
        return getTranslationNodes("", "", "");
    });

    const [translatingLocale] = createResource(refLocale, (): TranslationNodesResult => {
        // return getTranslationNodes("", "", "");
        // return {
        //     type: "object",
        //     value: [],
        // };

        const src = "export default {};";
        return {
            src: src,
            nodes: getTranslationNodesFromTxtFile(src),
        };
    });

    const [editedLocale, { mutate: setEditedLocale }] = createResource(
        translatingLocale,
        (): ObjectNode => {
            const translating = translatingLocale();
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
            <Navbar />

            <Switch>
                <Match when={refLocale.loading || translatingLocale.loading}>
                    <p>Loading...</p>
                </Match>

                <Match when={refLocale.error}>
                    <p>Error: {refLocale.error?.message}</p>
                </Match>

                <Match when={translatingLocale.error}>
                    <p>Error: {translatingLocale.error?.message}</p>
                </Match>

                <Match keyed when={refLocale()}>
                    {(_ref) => (
                        <Show keyed when={translatingLocale()}>
                            {(_translating) => {
                                return (
                                    <Editor
                                        refLocaleSrc={_ref.src}
                                        refLocale={_ref.nodes}
                                        editingLocaleSrc={_translating.src}
                                        editLocale={_translating.nodes}
                                        onChange={handleTranslatingLocaleChange}
                                    />
                                );
                            }}
                        </Show>
                    )}
                </Match>
            </Switch>
        </main>
    );
}

async function getTranslationNodes(repo: string, path: string, ref: string) {
    let fileContents = await getFileContents(repo, path, ref);
    if (!fileContents) fileContents = "export default {};";

    return {
        src: fileContents,
        nodes: getTranslationNodesFromTxtFile(fileContents),
    };
}
