import { NodeType, type ObjectNode, type TranslationNode, type WithKey } from "~/lib/types";

export function sortNodes(node: ObjectNode, refNode: ObjectNode): ObjectNode {
    const result: ObjectNode = {
        type: NodeType.Object,
        value: [],
    };

    const orderedKeys: string[] = [];

    const refNodeMap = new Map<string, WithKey<TranslationNode>>();
    for (const item of refNode.value) {
        if (!orderedKeys.includes(item.key)) {
            orderedKeys.push(item.key);
        }
        refNodeMap.set(item.key, item);
    }

    const nodeMap = new Map<string, WithKey<TranslationNode>>();
    for (const item of node.value) {
        if (!orderedKeys.includes(item.key)) {
            orderedKeys.push(item.key);
        }
        nodeMap.set(item.key, item);
    }

    for (const key of orderedKeys) {
        const val = nodeMap.get(key);
        const refVal = refNodeMap.get(key);
        if (!val) continue;

        if (val.type === NodeType.Object && refVal?.type === NodeType.Object) {
            const sortedChildVals = sortNodes(val, refVal);
            result.value.push({
                ...val,
                value: sortedChildVals.value,
            });
        } else {
            result.value.push(val);
        }
    }

    return result;
}

export interface AssembleTranslationProps {
    fileName: string;
    translatingLocaleCode?: string;
    refNodes: ObjectNode;
    translatedNodes: ObjectNode;
}
