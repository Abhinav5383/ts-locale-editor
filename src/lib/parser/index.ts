import { getTranslationNodesFromJSONFile } from "~/lib/parser/json";
import { getTranslationNodesFromTsFile } from "~/lib/parser/typescript";
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
            return getTranslationNodesFromTsFile(code ?? "export default {};");

        case "json":
            return getTranslationNodesFromJSONFile(code ?? "{}");

        default:
            return EMPTY_OBJECT_NODE;
    }
}
