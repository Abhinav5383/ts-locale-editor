import { useDragAndDrop } from "@formkit/drag-and-drop/solid";
import { batch, For, Show } from "solid-js";
import type { ArrayNode, TranslationNode } from "~/lib/types";
import { NodeRenderer } from "./node";
import type { NodeRendererProps } from "./types";

export function ArrayRenderer(props: NodeRendererProps<ArrayNode>) {
    const initialValues = props.node.value.map((node, index) => ({ index, node }));

    const [parentRef, items, setItems] = useDragAndDrop<
        HTMLDivElement,
        (typeof initialValues)[number]
    >(initialValues, {
        dragHandle: ".drag-handle",
        dropZoneClass: "drop-location",
        selectedClass: "dragging",
        draggable: () => props.isEditable,
        onDragend: (_data) => {
            const newOrder = _data.values as unknown as typeof initialValues;
            props.onChange(props.path, {
                ...props.node,
                value: newOrder.map((item) => item.node),
            });
        },
    });

    function handleChange(index: number, newNode: TranslationNode) {
        if (newNode.type !== "string" && newNode.type !== "string_template") return;

        const updatedArrayItems = items().map((item) => item.node);
        updatedArrayItems[index] = newNode;

        batch(() => {
            setItems((items) => {
                // using the same array because don't want to re-render the items on input
                // re-rendering on input causes contenteditable to lose focus
                // each node keeps track of its own state so its fine without a re-render
                for (let i = 0; i < updatedArrayItems.length; i++) {
                    items[i].node = updatedArrayItems[i];
                }

                return items;
            });
            props.onChange(props.path, {
                ...props.node,
                value: updatedArrayItems,
            });
        });
    }

    // function handleAddItem(newNode: ArrayNode["value"][number]) {
    //     props.onChange(props.path, {
    //         ...arrNode(),
    //         value: [...arrNode().value, newNode],
    //     });
    // }

    // function handleRemoveItem(index: number) {
    //     const newArrayValue = arrNode().value.filter((_, i) => i !== index);
    //     props.onChange(props.path, {
    //         ...arrNode(),
    //         value: newArrayValue,
    //     });
    // }

    return (
        <div class="node-array">
            <span class="token token-bracket">{"["}</span>
            <div class={`array-items ${props.isEditable ? "editable" : ""}`} ref={parentRef}>
                <For each={items()}>
                    {({ node }, index) => (
                        <div class="array-item">
                            <Show when={props.isEditable}>
                                <span class="drag-handle">⠿</span>
                            </Show>

                            <NodeRenderer
                                node={node}
                                path={[...props.path, index().toString()]}
                                onChange={(_path, newVal) => handleChange(index(), newVal)}
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
