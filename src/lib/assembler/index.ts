import * as t from "@babel/types";
import { getExportsAST } from "~/lib/parser";
import {
    type ArrayNode,
    ExportType,
    type FunctionNode,
    type ObjectNode,
    type StringNode,
    type VariableNode,
} from "~/lib/types";
import { getAssemblingTemplate } from "./templates";

interface AssembleTranslationProps {
    fileName: string;
    translatingLocaleCode: string | undefined;
    translatingLocale: ObjectNode;
}

export function AssembleTranslation(props: AssembleTranslationProps): string | null {
    const template = getAssemblingTemplate(props.fileName, props.translatingLocaleCode);
    if (!template) {
        console.error(`No assembling template found for file ${props.fileName}`);
        return null;
    }

    const templateAST = getExportsAST(template);
    if (!templateAST) {
        console.error("Failed to parse template AST. Cannot assemble translation.");
        return null;
    }

    if (templateAST.exportType === ExportType.Named) {
        let finalCode = "";

        let lastEndIndex = 0;
        for (const exportNode of templateAST.value) {
            const nodeId = exportNode.id;
            if (!t.isIdentifier(nodeId) || !exportNode.init) {
                console.warn("Skipping non-standard export node:", exportNode);
                continue;
            }

            const declTranslated = props.translatingLocale.value.find(
                (node) => node.key === nodeId.name,
            );
            if (!declTranslated) {
                console.warn(`No translation found for exported node ${nodeId.name}. Skipping.`);
                continue;
            }

            const assembled = stringifyNode(declTranslated, undefined, templateAST.exportType);
            const startIndex = exportNode.init.start ?? null;
            const endIndex = exportNode.init.end ?? null;

            if (startIndex === null || endIndex === null) {
                console.error("Export node is missing start and/or end position:", exportNode);
                continue;
            }

            finalCode += template.slice(lastEndIndex, startIndex) + assembled;
            lastEndIndex = endIndex;
        }
        finalCode += template.slice(lastEndIndex);

        return finalCode;
    }

    //
    else if (templateAST.exportType === ExportType.Default) {
        const assembled = stringifyNode(props.translatingLocale);
        const startIndex = templateAST.value.start ?? 0;
        const endIndex = templateAST.value.end ?? template.length;

        return template.slice(0, startIndex) + assembled + template.slice(endIndex);
    }

    return null;
}

function stringifyNode(
    node: ObjectNode | ArrayNode | FunctionNode | StringNode | VariableNode,
    indent = 0,
    exportType = ExportType.Default,
): string {
    switch (node.type) {
        case "object":
            return stringifyObjectNode(node, indent);
        case "array":
            return stringifyArrayNode(node, indent);
        case "function":
            return stringifyFunctionNode(node, indent, exportType);
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

function stringifyFunctionNode(
    node: FunctionNode,
    indent = 0,
    exportType = ExportType.Default,
): string {
    let paramStr = "";
    for (const param of node.params) {
        paramStr += param.name;
        if (exportType === ExportType.Named) {
            paramStr += `: ${param.type}`;
        }
        paramStr += ", ";
    }
    paramStr = paramStr.slice(0, -2);

    let fnBody = "";
    if (node.body.type === "BlockExpression") {
        fnBody += "{\n";

        let insideTemplateString = false;

        for (const line of node.body.value.split("\n")) {
            if (insideTemplateString) {
                fnBody += `${line}\n`;
            } else {
                fnBody += `${spaceIndent(indent + 1)}${line}\n`;
            }

            const unescapedBackticks = (line.match(/(?<!\\)`/g) || []).length;
            if (unescapedBackticks % 2 !== 0) {
                insideTemplateString = !insideTemplateString;
            }
        }

        fnBody += `${spaceIndent(indent)}}`;
    } else {
        fnBody = stringifyNode(node.body, indent);
    }

    return `(${paramStr}) => ${fnBody}`;
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
