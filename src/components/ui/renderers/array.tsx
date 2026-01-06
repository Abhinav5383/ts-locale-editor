import { createSignal, For, Show } from "solid-js";
import type { ArrayNode, TranslationNode } from "~/lib/types";
import { NodeRenderer } from "./node";
import type { NodeRendererProps } from "./types";

export function ArrayRenderer(props: NodeRendererProps<ArrayNode>) {
    const [items] = createSignal(props.node.value);

    return (
        <div class="node-array">
            <span class="token token-bracket">{"["}</span>
            <div class={`array-items ${props.isEditable ? "editable" : ""}`}>
                <For each={items()}>
                    {(item, index) => (
                        <div class="array-item">
                            <Show when={props.isEditable}>
                                <button type="button" class="drag-handle" tabindex={-1}>
                                    =
                                </button>
                            </Show>

                            <NodeRenderer
                                node={item as TranslationNode}
                                isEditable={props.isEditable}
                                postInlineContent={
                                    index() < items().length - 1 ? (
                                        <span class="token">,</span>
                                    ) : null
                                }
                            />
                        </div>
                    )}
                </For>
            </div>
            <div>
                <span class="token token-bracket">{"]"}</span>
                {props.postInlineContent}
            </div>
        </div>
    );
}
