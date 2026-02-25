import JSON5 from "json5";
import type { ArrayNode, ObjectNode, StringNode, WithKey } from "~/lib/types";

export function getTranslationNodesFromJSONFile(str: string): ObjectNode {
    const json = JSON5.parse(str);

    if (typeof json !== "object") {
        return {
            type: "object",
            value: [],
        };
    }

    return mapJsonToNode(json);
}

function mapJsonToNode(parsedJson: Record<string, unknown>): ObjectNode {
    const result: ObjectNode = {
        type: "object",
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
            type: "string",
            key,
            value: String(value),
        } satisfies WithKey<StringNode>;
    }

    if (Array.isArray(value)) {
        return {
            type: "array",
            key,
            value: value
                .map((item, index) => mapValueToNode(`${index}`, item))
                .filter((node) => node.type === "string"),
        } satisfies WithKey<ArrayNode>;
    }

    if (valueType === "object" && value) {
        return {
            type: "object",
            key,
            value: Object.entries(value).map(([k, v]) => mapValueToNode(k, v)),
        } satisfies WithKey<ObjectNode>;
    }

    return {
        type: "string",
        key,
        value: String(value),
    } satisfies WithKey<StringNode>;
}
