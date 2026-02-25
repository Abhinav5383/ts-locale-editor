import type { AssembleTranslationProps } from "~/lib/assembler/utils";
import { sortNodes } from "~/lib/assembler/utils";
import type { ArrayNode, ObjectNode, StringNode, VariableNode } from "~/lib/types";

export function AssembleJsonTranslation(props: AssembleTranslationProps): string | null {
    const sortedTranslatedNodes = sortNodes(props.translatedNodes, props.refNodes);
    const jsonObject = nodeToJsonValue(sortedTranslatedNodes);

    if (jsonObject === null) {
        return null;
    }

    return JSON.stringify(jsonObject, null, 4);
}

function nodeToJsonValue(
    node: ObjectNode | ArrayNode | StringNode | VariableNode,
): Record<string, unknown> | unknown[] | string | null {
    switch (node.type) {
        case "object":
            return nodeToJsonObject(node);
        case "array":
            return nodeToJsonArray(node);
        case "string":
        case "string_template":
            return node.value;
        case "variable":
            return node.name;
        default:
            return null;
    }
}

function nodeToJsonObject(node: ObjectNode): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    for (const prop of node.value) {
        if (prop.type === "function") continue;

        const val = nodeToJsonValue(prop);
        result[prop.key] = val;
    }

    return result;
}

function nodeToJsonArray(node: ArrayNode): unknown[] {
    const result: unknown[] = [];

    for (const item of node.value) {
        const val = nodeToJsonValue(item);
        result.push(val);
    }

    return result;
}
