import type {
    ArrayNode,
    FunctionNode,
    ObjectNode,
    StringNode,
    TranslationNode,
    VariableNode,
    WithKey,
} from "~/lib/types";

export function mergeNodes(target: ObjectNode, source: ObjectNode): ObjectNode {
    const result: ObjectNode = {
        type: target.type,
        value: [...target.value],
    };

    const existingKeys = new Set<string>();
    for (const child of result.value) {
        existingKeys.add(child.key);
    }

    for (const child of source.value) {
        if (!existingKeys.has(child.key)) {
            result.value.push(child);
            existingKeys.add(child.key);
        } else {
            const targetChildIdx = result.value.findIndex((c) => c.key === child.key);
            const targetChild = result.value[targetChildIdx];

            if (targetChild.type === "object" && child.type === "object") {
                result.value[targetChildIdx] = {
                    key: child.key,
                    type: "object",
                    value: mergeNodes(targetChild, child).value,
                };
            } else {
                result.value[targetChildIdx] = child;
            }
        }
    }

    return result;
}

export function updateNodeValue(
    path: string[],
    root: ObjectNode,
    value: TranslationNode | null,
): ObjectNode {
    if (path.length === 0) {
        if (root.type === "object" && value?.type === "object") return value;
        return root;
    }

    let curr: ObjectNode = root;
    for (let i = 0; i < path.length; i++) {
        const key = path[i];

        const childIndex = curr.value.findIndex((child) => child.key === key);

        // if we're at the end of the path, update the node
        if (i === path.length - 1) {
            let targetNode = curr.value[childIndex];

            if (!value || (isEmptyNode(value) && targetNode)) {
                curr.value.splice(childIndex, 1);

                if (curr.value.length === 0) {
                    // delete the parent node if it has no more children
                    return updateNodeValue(path.slice(0, -1), root, null);
                }
            } else if (!targetNode) {
                targetNode = { key, ...value };
                curr.value.push(targetNode);
            } else {
                curr.value[childIndex] = { key, ...value };
            }
        }

        // update the ref to nested object for next iteration
        else {
            let childObj = curr.value[childIndex];
            if (!childObj) {
                const newObj: WithKey<ObjectNode> = {
                    key: key,
                    type: "object",
                    value: [],
                };
                curr.value.push(newObj);
                childObj = newObj;
            }

            if (childObj.type !== "object") break;
            curr = childObj;
        }
    }

    return root;
}

export function isEmptyNode(node: TranslationNode, isFnReturn = false): boolean {
    switch (node.type) {
        case "object":
            return isEmptyObjectNode(node);
        case "array":
            return isEmptyArrayNode(node);
        case "function":
            return isEmptyFunctionNode(node);
        case "string_template":
        case "string":
            return isEmptyStringNode(node, isFnReturn);
        case "variable":
            return isEmptyVariableNode(node);
    }
}

export function isEmptyObjectNode(node: ObjectNode): boolean {
    for (const child of node.value) {
        if (!isEmptyNode(child)) return false;
    }

    return true;
}

export function isEmptyArrayNode(node: ArrayNode): boolean {
    for (const child of node.value) {
        if (child.type === "variable") continue;
        if (!isEmptyNode(child)) return false;
    }

    return true;
}

export function isEmptyFunctionNode(node: FunctionNode): boolean {
    if (node.body.type === "BlockExpression") {
        return !node.body.value.trim();
    } else {
        return isEmptyNode(node.body, true);
    }
}

export function isEmptyStringNode(node: StringNode, isFnReturn = false): boolean {
    if (isFnReturn) return !node.value.trim();
    return !node.value;
}

export function isEmptyVariableNode(node: VariableNode): boolean {
    return !node.name;
}
