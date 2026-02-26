import type { AssembleTranslationProps } from "~/lib/assembler/utils";
import { sortNodes } from "~/lib/assembler/utils";
import {
    type ArrayNode,
    NodeType,
    type ObjectNode,
    type StringNode,
    type VariableNode,
} from "~/lib/types";

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
        case NodeType.Object:
            return nodeToJsonObject(node);
        case NodeType.Array:
            return nodeToJsonArray(node);
        case NodeType.String:
        case NodeType.StringTemplate:
            return node.value;
        case NodeType.Variable:
            return node.name;
        default:
            return null;
    }
}

function nodeToJsonObject(node: ObjectNode): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    for (const prop of node.value) {
        if (prop.type === NodeType.Function) continue;

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
