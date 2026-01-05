import type {
    ArrayNode,
    FunctionNode,
    NodeBase,
    ObjectNode,
    StringNode,
    TranslationFn_BlockExprBody,
    TranslationNode,
    TranslationNodeUnion,
    VariableNode,
} from "~/lib/types";

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
        const editNode = editLocaleKeyMap.get(refNode.key) ?? {
            ...emptyNode(refNode),
            key: refNode.key,
        };

        if (refNode.type === "object" && editNode.type === "object") {
            const refNodeWihNoValue = {
                key: refNode.key,
                type: "object",
                value: [],
            } satisfies ObjectNode & NodeBase;

            items.push({
                key: refNode.key,
                refNode: refNodeWihNoValue,
                editNode: refNodeWihNoValue,
                depth,
            });

            const childItems = flattenLocaleEntries(refNode.value, editNode.value, depth + 1);
            items.push(...childItems);
        } else {
            items.push({
                key: refNode.key,
                refNode: refNode,
                editNode: editNode,
                depth: depth,
            });
        }
    }

    return items;
}

function emptyNode(refNode: TranslationNodeUnion): TranslationNodeUnion {
    switch (refNode.type) {
        case "string":
        case "string_template":
            return emptyStringNode(refNode);
        case "variable":
            return emptyVariableNode(refNode);
        case "array":
            return emptyArrayNode(refNode);
        case "object":
            return emptyObjectNode(refNode);
        case "function":
            return emptyFunctionNode(refNode);
        default:
            throw new Error(`Unsupported node type`);
    }
}

function emptyFunctionNode(refNode: FunctionNode): FunctionNode {
    const base = {
        type: refNode.type,
        params: refNode.params.map((p) => ({ ...p })),
    } satisfies Omit<FunctionNode, "body">;

    switch (refNode.body.type) {
        case "string":
        case "string_template":
            return {
                ...base,
                body: emptyStringNode(refNode.body),
            };
        case "variable":
            return {
                ...base,
                body: emptyVariableNode(refNode.body),
            };
        case "array":
            return {
                ...base,
                body: emptyArrayNode(refNode.body),
            };
        case "BlockExpression":
            return {
                ...base,
                body: {
                    type: "BlockExpression",
                    value: "",
                } satisfies TranslationFn_BlockExprBody,
            };

        default:
            return refNode;
    }
}

function emptyObjectNode(refNode: ObjectNode): ObjectNode {
    return { ...refNode, value: [] };
}
function emptyArrayNode(refNode: ArrayNode): ArrayNode {
    return {
        type: refNode.type,
        value: refNode.value.map((val) => {
            switch (val.type) {
                case "string":
                case "string_template":
                    return emptyStringNode(val);
                case "variable":
                    return emptyVariableNode(val);

                default:
                    return val;
            }
        }),
        length: refNode.length,
    };
}
function emptyStringNode(refNode: StringNode): StringNode {
    return { ...refNode, value: "" };
}

// NOTE: Variables don't change in translation, so no need to empty them
function emptyVariableNode(refNode: VariableNode): VariableNode {
    return refNode;
}
