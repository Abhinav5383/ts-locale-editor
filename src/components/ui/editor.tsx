import { For, Match, Switch } from "solid-js";
import { NodeRenderer } from "~/components/ui/renderers/node";
import { flattenLocaleEntries, IterationItemType } from "~/components/ui/utils";
import type { ObjectNode } from "~/lib/types";
import "./editor.css";

interface EditorProps {
    refLocale: ObjectNode; // the base reference locale
    editLocale: ObjectNode; // the locale being edited
}

export default function Editor(props: EditorProps) {
    return (
        <div class="editor-wrapper">
            <div class="editor-header">
                <div class="header-column"> </div>
                <div class="header-column">Reference Locale</div>
                <div class="header-column">Edit Locale</div>
            </div>
            <EditorContent refLocale={props.refLocale} editLocale={props.editLocale} />
        </div>
    );
}

interface EditorContentProps {
    refLocale: ObjectNode;
    editLocale: ObjectNode;
}

function EditorContent(props: EditorContentProps) {
    const flattenedItems = () =>
        flattenLocaleEntries(props.refLocale.value, props.editLocale.value);

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
                                    <div class="node-key">
                                        {item.key}
                                        <span class="token">{": "}</span>
                                    </div>
                                    <div class="node-value-ref">
                                        <NodeRenderer node={item.refNode} isEditable={false} />
                                    </div>
                                    <div class="node-value-edit">
                                        <NodeRenderer node={item.editNode} isEditable={true} />
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
