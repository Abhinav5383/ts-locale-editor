import { getExportsAST } from "~/lib/parser";
import type { ArrayNode, FunctionNode, ObjectNode, StringNode, VariableNode } from "~/lib/types";
import { getAssemblingTemplate } from "./templates";

interface AssembleTranslationProps {
    fileName: string;
    refLocaleCode: string;
    translatingLocaleCode: string | undefined;
    translatingLocale: ObjectNode;
}

export function AssembleTranslation(props: AssembleTranslationProps): string {
    const refLocaleAST = getExportsAST(props.refLocaleCode);
    if (!refLocaleAST) {
        throw new Error("Failed to parse reference locale code.");
    }

    const exportType = Array.isArray(refLocaleAST) ? "named" : "default";
    const template = getAssemblingTemplate(
        props.fileName,
        props.refLocaleCode,
        props.translatingLocaleCode,
    );

    return stringifyNode(props.translatingLocale);
}

function stringifyNode(
    node: ObjectNode | ArrayNode | FunctionNode | StringNode | VariableNode,
    indent = 0,
): string {
    switch (node.type) {
        case "object":
            return stringifyObjectNode(node, indent);
        case "array":
            return stringifyArrayNode(node, indent);
        case "function":
            return stringifyFunctionNode(node, indent);
        case "string":
        case "string_template":
            return stringifyStringNode(node);
        case "variable":
            return stringifyVariableNode(node);
        default:
            return "";
    }
}

function stringifyObjectNode(node: ObjectNode, indent = 0): string {
    let result = "{\n";

    for (const prop of node.value) {
        const val = stringifyNode(prop, indent + 1);
        result += `${spaceIndent(indent + 1)}${prop.key}: ${val},\n`;
    }

    result += `${spaceIndent(indent)}}`;
    return result;
}

function stringifyArrayNode(node: ArrayNode, indent = 0): string {
    let result = "[\n";
    for (const item of node.value) {
        const _str = stringifyNode(item, indent + 1);
        result += `${spaceIndent(indent + 1)}${_str},\n`;
    }

    result += `${spaceIndent(indent)}]`;
    return result;
}

function stringifyFunctionNode(node: FunctionNode, indent = 0): string {
    const params = node.params.map((param) => param.name).join(", ");

    let fnBody = "";
    if (node.body.type === "BlockExpression") {
        fnBody += "{\n";

        for (const line of node.body.value.split("\n")) {
            fnBody += `${spaceIndent(indent + 1)}${line}\n`;
        }

        fnBody += `${spaceIndent(indent)}}`;
    } else {
        fnBody = stringifyNode(node.body, indent);
    }

    return `(${params}) => ${fnBody}`;
}

function stringifyStringNode(node: StringNode): string {
    if (node.type === "string_template") {
        return `\`${node.value}\``;
    } else {
        return `"${node.value}"`;
    }
}

function stringifyVariableNode(node: VariableNode): string {
    return node.name;
}

function spaceIndent(indentLevel: number, size = 4): string {
    if (indentLevel <= 0) return "";

    return " ".repeat(indentLevel * size);
}
