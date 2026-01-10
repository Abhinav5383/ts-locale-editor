import type { DragendEventData } from "@formkit/drag-and-drop";
import { useDragAndDrop } from "@formkit/drag-and-drop/solid";
import { For, Show } from "solid-js";
import type { ArrayNode, TranslationNode } from "~/lib/types";
import { NodeRenderer } from "./node";
import type { NodeRendererProps } from "./types";

export function ArrayRenderer(props: NodeRendererProps<ArrayNode>) {
    const initialValues = props.node.value.map((item, index) => ({ index, item }));

    const [parentRef, nodeValues] = useDragAndDrop<HTMLDivElement, (typeof initialValues)[number]>(
        initialValues,
        {
            dragHandle: ".drag-handle",
            dropZoneClass: "drop-location",
            selectedClass: "dragging",
            draggable: () => props.isEditable,
            onDragend: (_data) => {
                const data = _data as unknown as DragendEventData<(typeof initialValues)[number]>;
                const newArray = data.values.map((item) => {
                    return { ...item.item };
                });

                props.onChange(props.path, {
                    ...props.node,
                    value: newArray,
                });
            },
        },
    );

    function handleChange(index: number, newNode: TranslationNode) {
        if (newNode.type !== "string" && newNode.type !== "string_template") return;

        const newArrayValue = [...props.node.value];
        newArrayValue[index] = newNode;

        props.onChange(props.path, {
            ...props.node,
            value: newArrayValue,
        });
    }

    // function handleAddItem(newNode: ArrayNode["value"][number]) {
    //     props.onChange(props.path, {
    //         ...props.node,
    //         value: [...props.node.value, newNode],
    //     });
    // }

    // function handleRemoveItem(index: number) {
    //     const newArrayValue = props.node.value.filter((_, i) => i !== index);
    //     props.onChange(props.path, {
    //         ...props.node,
    //         value: newArrayValue,
    //     });
    // }

    return (
        <div class="node-array">
            <span class="token token-bracket">{"["}</span>
            <div class={`array-items ${props.isEditable ? "editable" : ""}`} ref={parentRef}>
                <For each={nodeValues()}>
                    {({ item }, index) => (
                        <div class="array-item">
                            <Show when={props.isEditable}>
                                <span class="drag-handle">⠿</span>
                            </Show>

                            <NodeRenderer
                                node={item}
                                path={[...props.path, index().toString()]}
                                onChange={(_path, newVal) => handleChange(index(), newVal)}
                                isEditable={props.isEditable}
                                postInlineContent={
                                    index() < props.node.value.length - 1 ? (
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
