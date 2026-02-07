import type {
    ArrayNode,
    FunctionNode,
    ObjectNode,
    StringNode,
    TranslationFn_BlockExprBody,
    TranslationNode,
    VariableNode,
    WithKey,
} from "~/lib/types";

export enum IterationItemType {
    OBJ_START = "obj_start",
    OBJ_ENTRY = "obj_entry",
    OBJ_END = "obj_end",
}

type IterationItem_Base = {
    path: string[];
    key: string;
    depth: number;
    isLastChild: boolean;
};

type IterationItem_Variants =
    | {
          type: IterationItemType.OBJ_ENTRY;
          refNode: WithKey<TranslationNode>;
          editNode: WithKey<TranslationNode>;
      }
    | {
          type: IterationItemType.OBJ_START;
      }
    | {
          type: IterationItemType.OBJ_END;
      };

export type IterationItem = IterationItem_Base & IterationItem_Variants;

export function flattenLocaleEntries(
    refLocaleNode: ObjectNode,
    translatingLocaleNode: ObjectNode,
    depth = 0,
    parentPath: string[] = [],
): IterationItem[] {
    const items: IterationItem[] = [];

    const _uniqueKeys = new Set<string>();
    const orderedKeys: string[] = [];

    const refLocaleIndex = new Map<string, number>();
    for (let i = 0; i < refLocaleNode.value.length; i++) {
        const node = refLocaleNode.value[i];
        if (node) refLocaleIndex.set(node.key, i);

        if (!_uniqueKeys.has(node.key)) {
            _uniqueKeys.add(node.key);
            orderedKeys.push(node.key);
        }
    }

    const editLocaleIndex = new Map<string, number>();
    for (let i = 0; i < translatingLocaleNode.value.length; i++) {
        const node = translatingLocaleNode.value[i];
        if (node) editLocaleIndex.set(node.key, i);

        if (!_uniqueKeys.has(node.key)) {
            _uniqueKeys.add(node.key);
            orderedKeys.push(node.key);
        }
    }

    for (let i = 0; i < orderedKeys.length; i++) {
        const key = orderedKeys[i];
        const refNodeIndex = refLocaleIndex.get(key);
        const editNodeIndex = editLocaleIndex.get(key);

        let refNode = refNodeIndex !== undefined ? refLocaleNode.value[refNodeIndex] : undefined;
        let editNode =
            editNodeIndex !== undefined ? translatingLocaleNode.value[editNodeIndex] : undefined;

        if (editNode && refNode) {
            // nothing to do
        } else if (refNode && !editNode) {
            editNode = emptyKeyedNode(key, refNode);
        } else if (editNode && !refNode) {
            refNode = emptyKeyedNode(key, editNode);
        } else {
            continue;
        }

        const isLastChild = i === orderedKeys.length - 1;
        if (refNode.type === "object" && editNode.type === "object") {
            items.push({
                type: IterationItemType.OBJ_START,
                key: key,
                depth: depth,
                isLastChild,
                path: [...parentPath, key],
            });

            const childItems = flattenLocaleEntries(refNode, editNode, depth + 1, [
                ...parentPath,
                key,
            ]);

            items.push(...childItems);

            items.push({
                type: IterationItemType.OBJ_END,
                key: key,
                depth,
                isLastChild,
                path: [...parentPath, key],
            });
        } else {
            items.push({
                type: IterationItemType.OBJ_ENTRY,
                key: key,
                depth,
                isLastChild,
                refNode,
                editNode,
                path: [...parentPath, key],
            });
        }
    }

    return items;
}

function emptyKeyedNode(key: string, refNode: TranslationNode): WithKey<TranslationNode> {
    return { key: key, ...emptyNode(refNode) };
}

function emptyNode(refNode: TranslationNode): TranslationNode {
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
    };
}
function emptyStringNode(refNode: StringNode): StringNode {
    return { ...refNode, value: "" };
}

// NOTE: Variables don't change in translation, so they can be the same as the reference.
function emptyVariableNode(refNode: VariableNode): VariableNode {
    return { ...refNode };
}
