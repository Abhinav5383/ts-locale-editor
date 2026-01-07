import { For, Match, Switch } from "solid-js";
import { NodeRenderer } from "~/components/ui/renderers/node";
import { flattenLocaleEntries, IterationItemType } from "~/components/ui/utils";
import type { ObjectNode } from "~/lib/types";
import "./editor.css";
import type { node_OnChangeHandler } from "./renderers/types";

interface EditorProps {
    refLocale: ObjectNode; // the base reference locale
    editLocale: ObjectNode; // the locale being edited
    onChange: node_OnChangeHandler;
}

export default function Editor(props: EditorProps) {
    return (
        <div class="editor-wrapper">
            <div class="editor-header">
                <div class="header-column"> </div>
                <div class="header-column">Reference Locale</div>
                <div class="header-column">Edit Locale</div>
            </div>
            <EditorContent
                refLocale={props.refLocale}
                editLocale={props.editLocale}
                onChange={props.onChange}
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
                                    <div class="node-key">
                                        {item.key}
                                        <span class="token">{": "}</span>
                                    </div>
                                    <div class="node-value-ref">
                                        <NodeRenderer
                                            node={item.refNode}
                                            isEditable={false}
                                            path={item.path}
                                            onChange={props.onChange}
                                        />
                                    </div>
                                    <div class="node-value-edit">
                                        <NodeRenderer
                                            node={item.editNode}
                                            isEditable={true}
                                            path={item.path}
                                            onChange={props.onChange}
                                        />
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
