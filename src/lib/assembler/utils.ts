import type { ObjectNode } from "~/lib/types";

export function sortNodes(node: ObjectNode, refNode: ObjectNode): ObjectNode {
    const result: ObjectNode = {
        type: "object",
        value: [],
    };

    const orderedKeys = refNode.value.map((prop) => prop.key);
    for (const item of node.value) {
        if (!orderedKeys.includes(item.key)) {
            orderedKeys.push(item.key);
        }
    }

    for (const key of orderedKeys) {
        const val = node.value.find((prop) => prop.key === key);
        const refVal = refNode.value.find((prop) => prop.key === key);
        if (!val) continue;

        if (val.type === "object" && refVal && refVal.type === "object") {
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
    translatingLocaleCode: string | undefined;
    refNodes: ObjectNode;
    translatedNodes: ObjectNode;
}
