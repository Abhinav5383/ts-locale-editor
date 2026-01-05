import type { NodeBase, ObjectNode, TranslationNode } from "~/lib/types";

export interface IterationItem {
    refNode: TranslationNode;
    editNode: TranslationNode;
    depth: number;
    key: string;
}

export function flattenLocaleEntries(
    refLocaleNodes: TranslationNode[],
    editLocaleNodes: TranslationNode[],
    depth = 0,
) {
    const items: IterationItem[] = [];

    const editLocaleKeyMap = new Map<string, TranslationNode>();
    for (const node of editLocaleNodes) {
        editLocaleKeyMap.set(node.key, node);
    }

    for (const refNode of refLocaleNodes) {
        const editNode = editLocaleKeyMap.get(refNode.key) ?? refNode;

        if (refNode.type === "object" && editNode.type === "object") {
            const refNodeWihNoValue = {
                key: refNode.key,
                type: "object",
                value: [],
            } satisfies ObjectNode & NodeBase;

            items.push({
                refNode: refNodeWihNoValue,
                editNode: refNodeWihNoValue,
                depth,
                key: refNode.key,
            });

            const childItems = flattenLocaleEntries(refNode.value, editNode.value, depth + 1);
            items.push(...childItems);
        } else {
            items.push({
                refNode,
                editNode: editNode,
                depth,
                key: refNode.key,
            });
        }
    }

    return items;
}
