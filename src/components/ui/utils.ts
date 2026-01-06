import type {
    ArrayNode,
    FunctionNode,
    ObjectNode,
    StringNode,
    TranslationFn_BlockExprBody,
    TranslationNode,
    TranslationNodeUnion,
    VariableNode,
} from "~/lib/types";

export enum IterationItemType {
    OBJ_START = "obj_start",
    OBJ_ENTRY = "obj_entry",
    OBJ_END = "obj_end",
}

type IterationItem_Base = {
    key: string;
    depth: number;
    isLastChild: boolean;
};

type IterationItem_Variants =
    | {
          type: IterationItemType.OBJ_ENTRY;
          refNode: TranslationNode;
          editNode: TranslationNode;
      }
    | {
          type: IterationItemType.OBJ_START;
      }
    | {
          type: IterationItemType.OBJ_END;
      };

export type IterationItem = IterationItem_Base & IterationItem_Variants;

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

    for (let i = 0; i < refLocaleNodes.length; i++) {
        const refNode = refLocaleNodes[i];
        const editNode = editLocaleKeyMap.get(refNode.key) ?? {
            ...emptyNode(refNode),
            key: refNode.key,
        };
        const isLastChild = i === refLocaleNodes.length - 1;

        if (refNode.type === "object" && editNode.type === "object") {
            items.push({
                type: IterationItemType.OBJ_START,
                key: refNode.key,
                depth: depth,
                isLastChild,
            });

            const childItems = flattenLocaleEntries(refNode.value, editNode.value, depth + 1);

            items.push(...childItems);

            items.push({
                type: IterationItemType.OBJ_END,
                key: refNode.key,
                depth,
                isLastChild,
            });
        } else {
            items.push({
                type: IterationItemType.OBJ_ENTRY,
                key: refNode.key,
                depth,
                isLastChild,
                refNode,
                editNode,
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

// NOTE: Variables don't change in translation, so they can be the same as the reference.
function emptyVariableNode(refNode: VariableNode): VariableNode {
    return refNode;
}
