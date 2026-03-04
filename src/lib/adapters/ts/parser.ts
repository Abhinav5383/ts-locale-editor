import generate from "@babel/generator";
import { parse } from "@babel/parser";
import traverse from "@babel/traverse";
import * as t from "@babel/types";
import {
    type ArrayNode,
    ExportType,
    type FunctionNode,
    NodeType,
    type ObjectNode,
    type StringNode,
    type TranslationFn_Body,
    type TranslationFn_Params,
    type TranslationNode,
    type VariableNode,
} from "~/lib/types";
import { getExportItemIdentifier } from "./common";

type WrapperExpressions = t.ParenthesizedExpression | t.TSAsExpression | t.TSSatisfiesExpression;
const wrapperExpressionCheckers = [
    t.isParenthesizedExpression,
    t.isTSAsExpression,
    t.isTSSatisfiesExpression,
];
function isWrapperExpression(expr: t.Expression | t.Declaration): expr is WrapperExpressions {
    return wrapperExpressionCheckers.some((fn) => fn(expr));
}

type SupportedExpressions =
    | t.FunctionDeclaration
    | t.FunctionExpression
    | t.ArrowFunctionExpression
    | t.VariableDeclaration
    | t.StringLiteral
    | t.TemplateLiteral
    | t.ObjectExpression
    | t.ArrayExpression;

const supportedExpressionCheckers = [
    t.isFunctionDeclaration,
    t.isFunctionExpression,
    t.isArrowFunctionExpression,
    t.isVariableDeclaration,
    t.isStringLiteral,
    t.isTemplateLiteral,
    t.isObjectExpression,
    t.isArrayExpression,
];
function isSupportedExpression(expr: t.Expression | t.Declaration): expr is SupportedExpressions {
    return supportedExpressionCheckers.some((fn) => fn(expr));
}

export type ExportItem = {
    type: ExportType;
    decl: SupportedExpressions | WrapperExpressions;
};

export function getExportsAST(code: string): ExportItem[] | null {
    try {
        const ast = parse(code, {
            sourceType: "module",
            plugins: ["typescript"],
            errorRecovery: true,
        });

        const exports: ExportItem[] = [];

        traverse(ast, {
            ExportDefaultDeclaration(path) {
                const decl = path.node.declaration;
                if (isSupportedExpression(decl) || isWrapperExpression(decl)) {
                    exports.push({
                        type: ExportType.Default,
                        decl,
                    });
                }
            },

            ExportNamedDeclaration(path) {
                const decl = path.node.declaration;
                if (!decl || path.node.exportKind !== "value") return;

                if (isSupportedExpression(decl) || isWrapperExpression(decl)) {
                    exports.push({
                        type: ExportType.Named,
                        decl,
                    });
                }
            },
        });

        return exports.length > 0 ? exports : null;
    } catch (error) {
        console.error("Error parsing TypeScript code");
        console.trace(error);
        return null;
    }
}

// unwrap the real value from TS wrappers
// eg: export default { ... } satisfies Locale;
// we need the inner object expression
export function unwrapExpression<T extends t.Expression | t.Declaration>(expr: T) {
    if (isWrapperExpression(expr)) {
        return unwrapExpression(expr.expression);
    }

    return expr;
}

export function getTranslationNodesFromTsFile(code: string): ObjectNode {
    const result: ObjectNode = {
        type: NodeType.Object,
        value: [],
    };

    const exports = getExportsAST(code);
    if (!exports || exports.length === 0) return result;

    for (const item of exports) {
        const decl = unwrapExpression(item.decl);
        const identifier = getExportItemIdentifier(item);
        if (!identifier) {
            console.warn("Could not determine export identifier for export item. Skipping.", item);
            continue;
        }

        if (t.isFunctionDeclaration(decl)) {
            const fnNode = extractFunctionNode(decl);

            result.value.push({
                key: identifier,
                ...fnNode,
            });
        }

        //
        else if (t.isVariableDeclaration(decl)) {
            for (const declarator of decl.declarations) {
                const initializer = declarator.init ? unwrapExpression(declarator.init) : null;
                if (!initializer || !t.isIdentifier(declarator.id)) continue;

                const mappedNode = mapExpressionToNode(initializer);
                if (mappedNode) {
                    result.value.push({
                        key: declarator.id.name,
                        ...mappedNode,
                    });
                }
            }
        }

        //
        else {
            const mappedNode = mapExpressionToNode(decl);
            if (mappedNode) {
                result.value.push({
                    key: identifier,
                    ...mappedNode,
                });
            }
        }
    }

    return result;
}

function extractObjectNode(expr: t.ObjectExpression): ObjectNode {
    const result: ObjectNode = {
        type: NodeType.Object,
        value: [],
    };

    for (const prop of expr.properties) {
        if (!t.isObjectProperty(prop)) continue;
        if (!t.isExpression(prop.value)) continue;

        let key: string | null = null;
        if (t.isIdentifier(prop.key)) key = prop.key.name;
        else if (t.isStringLiteral(prop.key)) key = prop.key.value;
        if (!key) continue;

        const extractedNode = mapExpressionToNode(prop.value);
        if (extractedNode)
            result.value.push({
                key,
                ...extractedNode,
            });
    }

    return result;
}

function mapExpressionToNode(expr: t.Expression): TranslationNode | null {
    expr = unwrapExpression(expr);

    if (t.isObjectExpression(expr)) {
        return extractObjectNode(expr);
    }

    if (isFunctionLike(expr)) {
        return extractFunctionNode(expr);
    }

    const arrayNode = extractArrayNode(expr);
    if (arrayNode) return arrayNode;

    const stringNode = extractStringNode(expr);
    if (stringNode) return stringNode;

    const variableNode = extractVariableNode(expr);
    if (variableNode) return variableNode;

    return null;
}

function extractStringNode(expr: t.Expression): StringNode | null {
    const pure = tryExtractStringLiteral(expr);
    if (pure != null) {
        return { type: NodeType.String, value: pure };
    }

    if (t.isTemplateLiteral(expr)) {
        // keep full template source as-is, e.g. `A template literal ${SOME_CONST}`
        let template = generate(expr).code;
        template = template.slice(1, -1);
        return { type: NodeType.StringTemplate, value: template };
    }

    return null;
}

// try to extract pure string literal value
// returns null if not a pure string
// eg: `Hello there` is a template literal but there's no needed interpolation
// it doesn't have any ${} expressions inside
// this is just so that there aren't templates scattered everywhere unnecessarily
function tryExtractStringLiteral(expr: t.Expression): string | null {
    if (t.isStringLiteral(expr)) {
        return expr.value;
    }

    if (t.isTemplateLiteral(expr) && expr.expressions.length === 0) {
        // when there aren't any ${} expressions inside, just join the quasis (static parts)
        return expr.quasis.map((q) => q.value.cooked ?? "").join("");
    }

    return null;
}

function extractVariableNode(expr: t.Expression): VariableNode | null {
    if (!t.isIdentifier(expr)) return null;

    return {
        type: NodeType.Variable,
        name: expr.name,
    };
}

// currently translation arrays can only contain strings (plain or template)
function extractArrayNode(expr: t.Expression): ArrayNode | null {
    if (!t.isArrayExpression(expr)) return null;

    const items: ArrayNode["value"] = [];
    for (let el of expr.elements) {
        if (!el || !t.isExpression(el)) return null;

        el = unwrapExpression(el);
        const sNode = extractStringNode(el);
        if (sNode) {
            items.push(sNode);
            continue;
        }

        const vNode = extractVariableNode(el);
        if (vNode) {
            items.push(vNode);
            continue;
        }

        console.warn(
            "Unsupported array item in translation array. Only strings and variable references are supported. Skipping.",
            el,
        );
    }

    return {
        type: NodeType.Array,
        value: items,
    };
}

function isFunctionLike(expr: t.Expression) {
    return t.isFunctionExpression(expr) || t.isArrowFunctionExpression(expr);
}

type AST_FnTypes = t.FunctionExpression | t.ArrowFunctionExpression | t.FunctionDeclaration;
function extractFunctionNode(expr: AST_FnTypes): FunctionNode {
    const params = extractFnParams(expr);
    const body = extractFnBody(expr);

    return {
        type: NodeType.Function,
        params,
        body,
        isArrowFn: t.isArrowFunctionExpression(expr),
        isAsync: expr.async,
    } satisfies FunctionNode;
}

function extractFnParams(fn: AST_FnTypes): TranslationFn_Params[] {
    return fn.params.map((p) => {
        // shouldn't really happen in our case
        // only happens if using destructuring or rest params
        if (!t.isIdentifier(p)) {
            return { name: "[unknown]", type: NodeType.String };
        }

        let typeCode = "unknown";
        if (t.isTSTypeAnnotation(p.typeAnnotation)) {
            typeCode = generate(p.typeAnnotation.typeAnnotation).code;
        }

        return {
            name: p.name,
            type: typeCode,
        };
    });
}

function extractFnBody(fn: AST_FnTypes): TranslationFn_Body {
    const fnBodySrc = t.isBlockStatement(fn.body) ? fn.body : unwrapExpression(fn.body);
    const mappedNode = t.isBlockStatement(fnBodySrc) ? null : mapExpressionToNode(fnBodySrc);

    const isMappedNodeInvalid =
        !mappedNode || mappedNode.type === NodeType.Object || mappedNode.type === NodeType.Function;

    if (!t.isArrowFunctionExpression(fn) || isMappedNodeInvalid) {
        return {
            type: NodeType.BlockExpression,
            value: extractFnCode(fn),
        };
    }

    return mappedNode;
}

function extractFnCode(fn: AST_FnTypes): string {
    if (t.isBlockStatement(fn.body)) {
        return fn.body.body.map((stmt) => generate(stmt).code).join("\n");
    }
    // arrow function with expression body: x => expr
    return generate(fn.body).code;
}
