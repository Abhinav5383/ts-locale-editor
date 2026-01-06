import { createSignal, For, Show } from "solid-js";
import type { ArrayNode, TranslationNode } from "~/lib/types";
import { NodeRenderer } from "./node";
import type { NodeRendererProps } from "./types";

export function ArrayRenderer(props: NodeRendererProps<ArrayNode>) {
    const [items, setItems] = createSignal(props.node.value);

    let itemsListRef: HTMLDivElement;
    const [listItemRects, setListItemRects] = createSignal<DOMRect[]>([]);
    const [shiftDimensions, setShiftDimensions] = createSignal({ height: 0, gap: 0 });
    const [indexOffsets, setIndexOffsets] = createSignal<Record<number, number>>({});

    const [draggableIndex, setDraggableIndex] = createSignal<number | null>(null);
    const [dragStartPos, setDragStartPos] = createSignal<{ x: number; y: number } | null>(null);
    const [dragOffset, setDragOffset] = createSignal<{ x: number; y: number } | null>(null);

    function handleDragStart(event: MouseEvent | TouchEvent, index: number) {
        event.preventDefault();

        const _itemRects = Array.from(itemsListRef.querySelectorAll(".array-item")).map((item) =>
            item.getBoundingClientRect(),
        );
        setListItemRects(_itemRects);

        setDraggableIndex(index);
        setDragStartPos(getPointerPos(event));
        setDragOffset({ x: 0, y: 0 });

        const _shiftDimensions = {
            height: _itemRects[index].height,
            gap: shiftDimensions().gap,
        };

        if (_itemRects.length >= 2) {
            _shiftDimensions.gap = _itemRects[1].top - _itemRects[0].bottom;
        }
        setShiftDimensions(_shiftDimensions);

        document.addEventListener("mousemove", handleDrag);
        document.addEventListener("touchmove", handleDrag, { passive: false });

        document.addEventListener("mouseup", handleDragOver);
        document.addEventListener("mouseleave", handleDragOver);
        document.addEventListener("touchend", handleDragOver);
        document.addEventListener("touchcancel", handleDragOver);

        disablePageScroll();
    }
    function handleDrag(event: MouseEvent | TouchEvent) {
        event.preventDefault();
        const startPos = dragStartPos();
        const draggingItemIndex = draggableIndex();

        if (startPos === null || draggingItemIndex === null) return;
        const currentPos = getPointerPos(event);
        const offset = {
            x: currentPos.x - startPos.x,
            y: currentPos.y - startPos.y,
        };
        setDragOffset(offset);

        listItemRects().forEach((itemRect, index) => {
            if (index === draggingItemIndex) return;

            const middleY = itemRect.top + itemRect.height / 2;
            if (draggingItemIndex < index && currentPos.y > middleY) {
                // shift up
                setIndexOffsets((prev) => {
                    if (prev[index] === -1) return prev;
                    return { ...prev, [index]: -1 };
                });
            } else if (draggingItemIndex > index && currentPos.y < middleY) {
                // shift down
                setIndexOffsets((prev) => {
                    if (prev[index] === 1) return prev;
                    return { ...prev, [index]: 1 };
                });
            } else {
                setIndexOffsets((prev) => {
                    if (prev[index] === 0) return prev;
                    return { ...prev, [index]: 0 };
                });
            }
        });
    }
    function handleDragOver(event: MouseEvent | TouchEvent) {
        event.preventDefault();
        const draggingIndex = draggableIndex();
        if (draggingIndex === null) return;

        // update the items array based on shifted items
        const oldItemsList = items();
        const newItemsList: typeof oldItemsList = [];
        for (const [i, offset] of Object.entries(indexOffsets())) {
            const idx = parseInt(i, 10);
            newItemsList[idx + offset] = oldItemsList[idx];
        }
        for (let i = 0; i < oldItemsList.length; i++) {
            if (typeof newItemsList[i] === "undefined") {
                newItemsList[i] = oldItemsList[draggingIndex];
            }
        }

        setDraggableIndex(null);
        setDragStartPos(null);
        setDragOffset(null);
        setListItemRects([]);

        setIndexOffsets({});

        document.removeEventListener("mousemove", handleDrag);
        document.removeEventListener("touchmove", handleDrag);

        document.removeEventListener("mouseup", handleDragOver);
        document.removeEventListener("mouseleave", handleDragOver);
        document.removeEventListener("touchend", handleDragOver);
        document.removeEventListener("touchcancel", handleDragOver);

        enablePageScroll();

        setItems(newItemsList);
    }

    return (
        <div class="node-array">
            <span class="token token-bracket">{"["}</span>
            <div
                class={`array-items ${props.isEditable ? "editable" : ""}`}
                ref={(el) => {
                    itemsListRef = el;
                }}
            >
                <For each={items()}>
                    {(item, index) => (
                        <div
                            class={`array-item ${draggableIndex() === index() ? "dragging" : ""}`}
                            style={{
                                translate: getItemTranslation(
                                    index(),
                                    draggableIndex(),
                                    dragOffset(),
                                    shiftDimensions(),
                                    indexOffsets(),
                                ),
                            }}
                        >
                            <Show when={props.isEditable}>
                                <button
                                    type="button"
                                    class="drag-handle"
                                    tabindex={-1}
                                    on:mousedown={(e) => handleDragStart(e, index())}
                                    on:touchstart={{
                                        handleEvent: (e) => handleDragStart(e, index()),
                                        passive: false,
                                    }}
                                >
                                    ⠿
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

function getPointerPos(event: MouseEvent | TouchEvent) {
    return event instanceof MouseEvent
        ? {
              x: event.clientX,
              y: event.clientY,
          }
        : {
              x: event.touches[0].clientX,
              y: event.touches[0].clientY,
          };
}

function getItemTranslation(
    index: number,
    draggingIndex: number | null,
    dragOffset: { x: number; y: number } | null,
    shiftDimensions: { height: number; gap: number },
    indexOffsets: Record<number, number>,
) {
    if (draggingIndex === null || dragOffset === null) return "0px 0px";
    if (index === draggingIndex) {
        return `${dragOffset.x}px ${dragOffset.y}px`;
    }

    const indexOffset = indexOffsets[index] || 0;
    return `0px ${indexOffset * (shiftDimensions.height + shiftDimensions.gap)}px`;
}

function disablePageScroll() {
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    document.body.style.userSelect = "none";
}

function enablePageScroll() {
    document.body.style.overflow = "";
    document.body.style.touchAction = "";
    document.body.style.userSelect = "";
}
