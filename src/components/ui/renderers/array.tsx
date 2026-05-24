import { useDragAndDrop } from "@formkit/drag-and-drop/solid";
import { batch, createSignal, For, Show } from "solid-js";
import PlusIcon from "~/components/icons/plus-icon";
import XIcon from "~/components/icons/x";
import { type ArrayNode, NodeType, type TranslationNode } from "~/lib/types";
import Dialog from "../dialog";
import { NodeRenderer } from "./node";
import type { NodeRendererProps } from "./types";

import "./array.css";

export function ArrayRenderer(props: NodeRendererProps<ArrayNode>) {
	const initialValues = () => props.node.value.map((node, index) => ({ index, node }));
	const [addItemDialogOpen, setAddItemDialogOpen] = createSignal(false);
	const [addItemInput, setAddItemInput] = createSignal("");

	const [parentRef, items, setItems] = useDragAndDrop<HTMLDivElement, ReturnType<typeof initialValues>[number]>(
		initialValues(),
		{
			dragHandle: ".drag-handle",
			dropZoneClass: "drop-location",
			selectedClass: "dragging",
			draggable: () => props.isEditable,
			onDragend: (_data) => {
				const newOrder = _data.values as unknown as ReturnType<typeof initialValues>;
				props.onChange(props.path, {
					...props.node,
					value: newOrder.map((item) => item.node),
				});
			},
		},
	);

	function handleChange(index: number, newNode: TranslationNode) {
		if (newNode.type !== NodeType.String && newNode.type !== NodeType.StringTemplate) return;

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

	function handleAddItem(newNode: ArrayNode["value"][number]) {
		const newArray = [...items().map((item) => item.node), newNode];

		batch(() => {
			setItems((items) => {
				return [
					...items,
					{
						index: items.length,
						node: newNode,
					},
				];
			});

			props.onChange(props.path, {
				...props.node,
				value: newArray,
			});
		});
	}

	function handleRemoveItem(index: number) {
		const newArray = items()
			.map((item) => item.node)
			.filter((_, i) => i !== index);

		batch(() => {
			setItems((items) => {
				return items.filter((_, i) => i !== index);
			});

			props.onChange(props.path, {
				...props.node,
				value: newArray,
			});
		});
	}

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
								postInlineContent={index() < items().length - 1 ? <span class="token">,</span> : null}
							/>

							<Show when={props.isEditable}>
								<button class="remove-btn" type="button" title="Remove item" onclick={() => handleRemoveItem(index())}>
									<XIcon />
								</button>
							</Show>
						</div>
					)}
				</For>
			</div>

			<div class="array-post-content">
				<span class="token token-bracket">{"]"}</span>
				{props.postInlineContent}

				<Show when={props.isEditable}>
					<div class="add-item-btn">
						<button class="add-btn" type="button" title="Add item" onclick={() => setAddItemDialogOpen(true)}>
							<PlusIcon />
						</button>
					</div>

					<Dialog
						open={addItemDialogOpen()}
						onOpenChange={() => {
							setAddItemDialogOpen(false);
							setAddItemInput("");
						}}
					>
						<div class="dialog-content">
							<span>Select the type of item to add:</span>

							<input
								type="text"
								placeholder="Value"
								value={addItemInput()}
								onchange={(e) => {
									setAddItemInput(e.currentTarget.value);
								}}
							/>

							<div class="buttons">
								<button
									type="button"
									onclick={() => {
										handleAddItem({
											type: NodeType.String,
											value: addItemInput(),
										});
										setAddItemDialogOpen(false);
									}}
								>
									String
								</button>

								<button
									type="button"
									onclick={() => {
										handleAddItem({
											type: NodeType.Variable,
											name: addItemInput(),
										});
										setAddItemDialogOpen(false);
									}}
								>
									Variable
								</button>
							</div>
						</div>
					</Dialog>
				</Show>
			</div>
		</div>
	);
}
