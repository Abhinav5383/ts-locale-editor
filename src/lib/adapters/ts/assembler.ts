import { type AssembleTranslationProps, sortNodes } from "~/lib/adapters/utils";
import {
    type ArrayNode,
    ExportType,
    type FunctionNode,
    NodeType,
    type ObjectNode,
    type StringNode,
    type VariableNode,
} from "~/lib/types";
import { getExportItemIdentifier } from "./common";
import { getExportsAST, unwrapExpression } from "./parser";
import { getAssemblingTemplate } from "./templates";

export function AssembleTsTranslation(props: AssembleTranslationProps): string | null {
    const template = getAssemblingTemplate(props.fileName, props.translatingLocaleCode);
    const templateExports = getExportsAST(template) ?? [];

    const sortedTranslatedNodes = sortNodes(props.translatedNodes, props.refNodes);
    const sortedExports = templateExports.sort((a, b) => {
        return (a.decl.start ?? 0) - (b.decl.start ?? 0);
    });

    let finalCode = "";
    let lastEndIndex = 0;
    const assembledTranslationNodes: string[] = [];

    for (const exportItem of sortedExports) {
        const unwrappedDecl = unwrapExpression(exportItem.decl);
        const identifier = getExportItemIdentifier(exportItem);

        if (!identifier) {
            console.warn(
                "Could not determine export identifier for export item. Skipping.",
                exportItem,
            );
            continue;
        }

        const translatedNode = sortedTranslatedNodes.value.find((node) => node.key === identifier);
        if (!translatedNode) {
            console.warn(`No translation found for exported node ${identifier}. Skipping.`);
            continue;
        }

        const startIdx = unwrappedDecl.start ?? null;
        const endIdx = unwrappedDecl.end ?? null;

        if (startIdx === null || endIdx === null) {
            console.error("Export node is missing start and/or end position:", exportItem);
            continue;
        }

        const assembled = stringifyNode(translatedNode, 0, exportItem.type);
        finalCode += template.slice(lastEndIndex, startIdx) + assembled;

        lastEndIndex = endIdx;
        assembledTranslationNodes.push(translatedNode.key);
    }
    finalCode += template.slice(lastEndIndex);

    // append any remaining nodes that were not part of the original template exports
    const remainingNodes = sortedTranslatedNodes.value.filter(
        (node) => !assembledTranslationNodes.includes(node.key),
    );

    for (const node of remainingNodes) {
        if (node.key === "default") {
            finalCode += `export default ${stringifyNode(node)};\n`;
        } else {
            finalCode += `export const ${node.key} = ${stringifyNode(node, 0, ExportType.Named)};\n`;
        }
    }

    return finalCode;
}

function stringifyNode(
    node: ObjectNode | ArrayNode | FunctionNode | StringNode | VariableNode,
    indent = 0,
    exportType = ExportType.Default,
): string {
    switch (node.type) {
        case NodeType.Object:
            return stringifyObjectNode(node, indent);
        case NodeType.Array:
            return stringifyArrayNode(node, indent);
        case NodeType.Function:
            return stringifyFunctionNode(node, indent, exportType);
        case NodeType.String:
        case NodeType.StringTemplate:
            return stringifyStringNode(node);
        case NodeType.Variable:
            return stringifyVariableNode(node);
        default:
            return "";
    }
}

function stringifyObjectNode(node: ObjectNode, indent = 0): string {
    let result = "{\n";

    for (const prop of node.value) {
        const val = stringifyNode(prop, indent + 1);
        const keyStr = stringifyObjectKey(prop.key);
        result += `${spaceIndent(indent + 1)}${keyStr}: ${val},\n`;
    }

    result += `${spaceIndent(indent)}}`;
    return result;
}

function stringifyObjectKey(key: string): string {
    if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)) {
        return key;
    } else {
        return `"${key}"`;
    }
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
    if (node.body.type === NodeType.BlockExpression) {
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
    if (node.type === NodeType.StringTemplate) {
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
