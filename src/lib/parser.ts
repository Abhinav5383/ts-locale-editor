import { getTranslationNodesFromJSONFile } from "~/lib/adapters/json/parser";
import { getTranslationNodesFromTsFile } from "~/lib/adapters/ts/parser";
import { NodeType, type ObjectNode } from "~/lib/types";

export const EMPTY_OBJECT_NODE: ObjectNode = {
    type: NodeType.Object,
    value: [],
};

export function getTranslationNodesFromTxtFile(
    fileName: string,
    code: string | undefined,
): ObjectNode {
    const fileExtension = fileName.split(".").pop()?.toLowerCase();

    switch (fileExtension) {
        case "ts":
        case "tsx":
        case "js":
        case "jsx":
            return getTranslationNodesFromTsFile(code ?? "{};");

        case "json":
            return getTranslationNodesFromJSONFile(code ?? "{}");

        default:
            return EMPTY_OBJECT_NODE;
    }
}
