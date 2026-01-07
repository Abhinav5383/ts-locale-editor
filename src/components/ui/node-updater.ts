import type { ObjectNode, TranslationNode, WithKey } from "~/lib/types";

export function updateNodeValue(
    path: string[],
    root: ObjectNode,
    value: TranslationNode,
): ObjectNode {
    if (path.length === 0) {
        if (root.type === "object" && value.type === "object") return value;
        return root;
    }

    let ref: ObjectNode = root;

    for (let i = 0; i < path.length; i++) {
        const key = path[i];

        const childIndex = ref.value.findIndex((child) => child.key === key);

        if (i === path.length - 1) {
            let childToUpdate = ref.value[childIndex];
            if (!childToUpdate) {
                childToUpdate = { key, ...value };
                ref.value.push(childToUpdate);
            } else {
                ref.value[childIndex] = { key, ...value };
            }
        } else {
            let childObj = ref.value[childIndex];
            if (!childObj) {
                const newObj: WithKey<ObjectNode> = {
                    key: key,
                    type: "object",
                    value: [],
                };
                ref.value.push(newObj);
                childObj = newObj;
            }

            if (childObj.type !== "object") break;
            ref = childObj;
        }
    }

    return root;
}
