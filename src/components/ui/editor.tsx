import { createSignal, For, Match, onCleanup, onMount, Switch } from "solid-js";
import { NodeRenderer } from "~/components/ui/renderers/node";
import { flattenLocaleEntries, IterationItemType } from "~/components/ui/utils";
import { AssembleTranslation } from "~/lib/assembler";
import { type Dir, flattenDirs } from "~/lib/gh_api";
import type { PrefsObj } from "~/lib/preferences";
import type { ObjectNode } from "~/lib/types";
import { ExternalLinkIcon } from "../icons/external-link";
import "./editor.css";
import type { node_OnChangeHandler } from "./renderers/types";
import { Select } from "./select";

interface EditorProps {
    refNodes: ObjectNode; // the base reference locale
    editingLocaleSrc: string | undefined;
    editedNodes: ObjectNode; // the locale being edited
    onChange: node_OnChangeHandler;
    preferences: PrefsObj;

    // select controls
    localesList: Dir[];
    localeFilesList: Dir[];

    selectedFile: string;
    setSelectedFile: (val: string) => void;
    translatingFrom: string;
    setTranslatingFrom: (val: string) => void;
    translatingTo: string;
    setTranslatingTo: (val: string) => void;
}

export default function Editor(props: EditorProps) {
    return (
        <div class="editor">
            <div class="editor-wrapper">
                <div class="editor-header">
                    <div class="header-column">
                        <label for="file-select">Translating</label>
                        <Select
                            id="file-select"
                            options={flattenDirs(props.localeFilesList).map((file) => {
                                const relativePath =
                                    file.parent.length > 0
                                        ? `${file.parent.join("/")}/${file.name}`
                                        : file.name;

                                return {
                                    value: relativePath,
                                    label: file.name,
                                    description:
                                        relativePath === file.name ? undefined : relativePath,
                                };
                            })}
                            value={props.selectedFile}
                            onChange={props.setSelectedFile}
                        />
                    </div>

                    <div class="header-column">
                        <label for="ref-select">From</label>
                        <Select
                            id="ref-select"
                            options={props.localesList.map((locale) => ({
                                value: locale.name,
                            }))}
                            value={props.translatingFrom}
                            onChange={props.setTranslatingFrom}
                        />
                    </div>

                    <div class="header-column">
                        <label for="to-select">To</label>
                        <Select
                            id="ref-select"
                            options={[
                                {
                                    value: "",
                                    label: "New Locale",
                                },
                                ...props.localesList.map((locale) => ({
                                    value: locale.name,
                                })),
                            ]}
                            value={props.translatingTo}
                            onChange={props.setTranslatingTo}
                        />
                    </div>
                </div>

                <EditorContent
                    refLocale={props.refNodes}
                    editLocale={props.editedNodes}
                    onChange={props.onChange}
                />
            </div>

            <BottomBar
                preferences={props.preferences}
                translatingFrom={props.translatingFrom}
                translatingTo={props.translatingTo}
                selectedFile={props.selectedFile}
                editingLocaleSrc={props.editingLocaleSrc}
                refNodes={props.refNodes}
                editedNodes={props.editedNodes}
            />
        </div>
    );
}

interface EditorContentProps {
    refLocale: ObjectNode;
    editLocale: ObjectNode;
    onChange: node_OnChangeHandler;
}

function EditorContent(props: EditorContentProps) {
    const flattenedItems = () => flattenLocaleEntries(props.refLocale, props.editLocale);

    return (
        <div class="object-renderer">
            <For each={flattenedItems()}>
                {(item) => (
                    <Switch>
                        <Match
                            keyed
                            when={item.type === IterationItemType.OBJ_ENTRY ? item : false}
                        >
                            {(item) => (
                                <div
                                    class={`node-row ${item.isLastChild ? "last-entry" : ""}`}
                                    style={{ "--depth": `${item.depth}` }}
                                >
                                    <div class="cell-wrapper">
                                        <div class="node-key">
                                            {item.key}
                                            <span class="token">{": "}</span>
                                        </div>
                                    </div>

                                    <div class="cell-wrapper">
                                        <div class="node-value-ref">
                                            <NodeRenderer
                                                node={item.refNode}
                                                isEditable={false}
                                                path={item.path}
                                                onChange={props.onChange}
                                            />
                                        </div>
                                    </div>

                                    <div class="cell-wrapper">
                                        <div class="node-value-edit">
                                            <NodeRenderer
                                                node={item.editNode}
                                                isEditable={true}
                                                path={item.path}
                                                onChange={props.onChange}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </Match>

                        <Match
                            keyed
                            when={item.type === IterationItemType.OBJ_START ? item : false}
                        >
                            {(item) => (
                                <div
                                    class="node-row obj-brace obj-start-brace"
                                    style={{ "--depth": `${item.depth}` }}
                                >
                                    <div>
                                        <span class="node-key">{item.key}</span>
                                        <span class="token">{": {"}</span>
                                    </div>
                                </div>
                            )}
                        </Match>

                        <Match keyed when={item.type === IterationItemType.OBJ_END ? item : false}>
                            {(item) => (
                                <div
                                    class="node-row obj-brace obj-end-brace"
                                    style={{ "--depth": `${item.depth}` }}
                                >
                                    <div>
                                        <span class="token">{item.isLastChild ? "}" : "},"}</span>
                                    </div>
                                </div>
                            )}
                        </Match>
                    </Switch>
                )}
            </For>
        </div>
    );
}

interface ExportActionsProps {
    preferences: PrefsObj;
    translatingFrom: string;
    translatingTo: string;
    selectedFile: string;
    editingLocaleSrc: string | undefined;
    refNodes: ObjectNode;
    editedNodes: ObjectNode;
}

function BottomBar(props: ExportActionsProps) {
    let prevScrollY = window.scrollY;
    const [bottomBarVisible, setBottomBarVisible] = createSignal(true);

    function assembledNodes() {
        return AssembleTranslation({
            fileName: props.selectedFile,
            translatingLocaleCode: props.editingLocaleSrc,
            refNodes: props.refNodes,
            translatedNodes: props.editedNodes,
        });
    }

    function handleDownload() {
        const assembled = assembledNodes();
        if (!assembled) {
            alert("Failed to generate translation code. Download aborted.");
            return;
        }

        const blob = new Blob([assembled], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = props.selectedFile;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    function handleCopy() {
        const assembled = assembledNodes();
        if (!assembled) {
            alert("Failed to generate translation code. Copying aborted.");
            return;
        }

        navigator.clipboard
            .writeText(assembled)
            .then(() => {
                alert("Assembled translation code copied to clipboard!");
            })
            .catch((err) => {
                console.error("Failed to copy assembled code to clipboard:", err);
                alert("Failed to copy to clipboard. See console for details.");
            });
    }

    function handleScroll() {
        const currentScrollY = window.scrollY;
        const barVisible = bottomBarVisible();

        if (currentScrollY > document.body.scrollHeight - window.innerHeight - 250) {
            prevScrollY = currentScrollY;
            setBottomBarVisible(true);
            return;
        }

        if (Math.abs(currentScrollY - prevScrollY) < 60) return;

        if (currentScrollY < prevScrollY && !barVisible) {
            setBottomBarVisible(true);
        } else if (currentScrollY > prevScrollY && barVisible) {
            setBottomBarVisible(false);
        }

        prevScrollY = currentScrollY;
    }

    onMount(() => {
        window.addEventListener("scroll", handleScroll);

        onCleanup(() => {
            window.removeEventListener("scroll", handleScroll);
        });
    });

    return (
        <div class={`bottom-bar ${bottomBarVisible() ? "visible" : "hidden"}`}>
            <div class="contents">
                <a
                    href={`https://github.com/${props.preferences.repo}/${props.preferences.localesDir}/${props.translatingFrom}/${props.selectedFile}`}
                    target="_blank"
                >
                    <span>
                        {props.translatingFrom}/{props.selectedFile}
                    </span>

                    <ExternalLinkIcon />
                </a>

                <div class="actions">
                    <button type="button" onClick={handleCopy}>
                        Copy
                    </button>
                    <button type="button" onClick={handleDownload}>
                        Download
                    </button>
                </div>
            </div>
        </div>
    );
}
