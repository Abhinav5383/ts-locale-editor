import { createResource, Show } from "solid-js";
import Navbar from "~/components/layout/navbar";
import { getFileContents } from "~/lib/gh_api";
import { extractTranslationsFromObject, getDefaultExportObject } from "~/lib/parser";
import "./App.css";
import Editor from "./components/ui/editor";
import type { ObjectNode } from "./lib/types";

export default function App() {
    const [refParsed] = createResource(() => {
        return getTranslationNodes("", "", "");
    });

    return (
        <main class="main-wrapper">
            <Navbar />

            <Show when={refParsed.loading}>
                <p>Loading...</p>
            </Show>

            <Show when={refParsed.error}>
                <p>Error: {refParsed.error?.message}</p>
            </Show>

            <Show when={!refParsed.loading && !refParsed.error && refParsed()}>
                {(data) => {
                    const refNode = { type: "object", value: data() } satisfies ObjectNode;
                    const editNode = { type: "object", value: data() } satisfies ObjectNode;

                    return <Editor refLocale={refNode} editLocale={editNode} />;
                }}
            </Show>
        </main>
    );
}

async function getTranslationNodes(repo: string, path: string, ref: string) {
    let fileContents = await getFileContents(repo, path, ref);
    if (!fileContents) fileContents = "export default {};";

    const defaultExportObject = getDefaultExportObject(fileContents);
    if (!defaultExportObject) throw new Error(`No default export found in the file at ${path}!`);

    return extractTranslationsFromObject(defaultExportObject);
}
