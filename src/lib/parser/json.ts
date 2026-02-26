import JSON5 from "json5";
import {
    type ArrayNode,
    NodeType,
    type ObjectNode,
    type StringNode,
    type WithKey,
} from "~/lib/types";

export function getTranslationNodesFromJSONFile(str: string): ObjectNode {
    const json = JSON5.parse(str);

    if (typeof json !== NodeType.Object) {
        return {
            type: NodeType.Object,
            value: [],
        };
    }

    return mapJsonToNode(json);
}

function mapJsonToNode(parsedJson: Record<string, unknown>): ObjectNode {
    const result: ObjectNode = {
        type: NodeType.Object,
        value: [],
    };

    for (const [key, value] of Object.entries(parsedJson)) {
        const mappedNode = mapValueToNode(key, value);
        if (mappedNode) result.value.push(mappedNode);
    }

    return result;
}

function mapValueToNode(key: string, value: unknown): WithKey<ObjectNode | ArrayNode | StringNode> {
    const valueType = typeof value;

    if (valueType === "string" || valueType === "number" || valueType === "boolean") {
        return {
            type: NodeType.String,
            key,
            value: String(value),
        } satisfies WithKey<StringNode>;
    }

    if (Array.isArray(value)) {
        return {
            type: NodeType.Array,
            key,
            value: value
                .map((item, index) => mapValueToNode(`${index}`, item))
                .filter((node) => node.type === NodeType.String),
        } satisfies WithKey<ArrayNode>;
    }

    if (valueType === NodeType.Object && value) {
        return {
            type: NodeType.Object,
            key,
            value: Object.entries(value).map(([k, v]) => mapValueToNode(k, v)),
        } satisfies WithKey<ObjectNode>;
    }

    return {
        type: NodeType.String,
        key,
        value: String(value),
    } satisfies WithKey<StringNode>;
}
