import {
    type ArrayNode,
    type FunctionNode,
    NodeType,
    type ObjectNode,
    type StringNode,
    type TranslationFn_BlockExprBody,
    type TranslationNode,
    type VariableNode,
    type WithKey,
} from "~/lib/types";
import { isEmptyNode } from "./node-updater";

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
    hideTranslated = false,
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
        if (refNode.type === NodeType.Object && editNode.type === NodeType.Object) {
            const childItems = flattenLocaleEntries(
                refNode,
                editNode,
                depth + 1,
                [...parentPath, key],
                hideTranslated,
            );
            if (!childItems.length) continue;

            items.push({
                type: IterationItemType.OBJ_START,
                key: key,
                depth: depth,
                isLastChild,
                path: [...parentPath, key],
            });

            items.push(...childItems);

            items.push({
                type: IterationItemType.OBJ_END,
                key: key,
                depth,
                isLastChild,
                path: [...parentPath, key],
            });
        } else {
            if (hideTranslated && !isEmptyNode(editNode)) continue;

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

export function emptyNode(refNode: TranslationNode): TranslationNode {
    switch (refNode.type) {
        case NodeType.String:
        case NodeType.StringTemplate:
            return emptyStringNode(refNode);
        case NodeType.Variable:
            return emptyVariableNode(refNode);
        case NodeType.Array:
            return emptyArrayNode(refNode);
        case NodeType.Object:
            return emptyObjectNode(refNode);
        case NodeType.Function:
            return emptyFunctionNode(refNode);
        default:
            throw new Error(`Unsupported node type`);
    }
}

export function emptyFunctionNode(refNode: FunctionNode): FunctionNode {
    const base = {
        type: refNode.type,
        params: refNode.params.map((p) => ({ ...p })),
    } satisfies Omit<FunctionNode, "body">;

    switch (refNode.body.type) {
        case NodeType.String:
        case NodeType.StringTemplate:
            return {
                ...base,
                body: emptyStringNode(refNode.body),
            };
        case NodeType.Variable:
            return {
                ...base,
                body: emptyVariableNode(refNode.body),
            };
        case NodeType.Array:
            return {
                ...base,
                body: emptyArrayNode(refNode.body),
            };
        case NodeType.BlockExpression:
            return {
                ...base,
                body: {
                    type: NodeType.BlockExpression,
                    value: "",
                } satisfies TranslationFn_BlockExprBody,
            };

        default:
            return refNode;
    }
}

export function emptyObjectNode(refNode: ObjectNode): ObjectNode {
    return { ...refNode, value: [] };
}
export function emptyArrayNode(refNode: ArrayNode): ArrayNode {
    return {
        type: refNode.type,
        value: refNode.value.map((val) => {
            switch (val.type) {
                case NodeType.String:
                case NodeType.StringTemplate:
                    return emptyStringNode(val);
                case NodeType.Variable:
                    return emptyVariableNode(val);

                default:
                    return val;
            }
        }),
    };
}
export function emptyStringNode(refNode: StringNode): StringNode {
    return { ...refNode, value: "" };
}

// NOTE: Variables don't change in translation, so they can be the same as the reference.
export function emptyVariableNode(refNode: VariableNode): VariableNode {
    return { ...refNode };
}
