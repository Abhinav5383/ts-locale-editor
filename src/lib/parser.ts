import generate from "@babel/generator";
import { parse } from "@babel/parser";
import traverse from "@babel/traverse";
import * as t from "@babel/types";
import type {
    ArrayNode,
    FunctionNode,
    StringNode,
    TranslationFn_Body,
    TranslationFn_Params,
    TranslationNode,
    VariableNode,
} from "./types";

export function extractTranslationsFromObject(obj: t.ObjectExpression): TranslationNode[] {
    const nodes: TranslationNode[] = [];

    for (const prop of obj.properties) {
        if (!t.isObjectProperty(prop)) continue;
        if (!t.isExpression(prop.value)) continue;

        let key: string | null = null;
        if (t.isIdentifier(prop.key)) key = prop.key.name;
        else if (t.isStringLiteral(prop.key)) key = prop.key.value;
        if (!key) continue;

        const expr = prop.value;

        if (t.isObjectExpression(expr)) {
            const children = extractTranslationsFromObject(expr);
            const node: TranslationNode = {
                key,
                type: "object",
                value: children,
            };
            nodes.push(node);
            continue;
        }

        if (isFunctionLike(expr)) {
            const fnNode = extractFunctionNode(expr);
            nodes.push({
                key,
                ...fnNode,
            });
            continue;
        }

        const arrayNode = extractArrayNode(expr);
        if (arrayNode) {
            nodes.push({ key, ...arrayNode });
            continue;
        }

        const stringNode = extractStringNode(expr);
        if (stringNode) {
            nodes.push({ key, ...stringNode });
            continue;
        }

        const variableNode = extractVariableNode(expr);
        if (variableNode) {
            nodes.push({ key, ...variableNode });
            continue;
        }
    }

    return nodes;
}

export function getDefaultExportObject(code: string): t.ObjectExpression | null {
    const ast = parse(code, {
        sourceType: "module",
        plugins: ["typescript"],
    });

    let defaultExportObject: t.ObjectExpression | null = null;
    traverse(ast, {
        // I'm just gonna assume all default exports are gonna be object literals for translation files
        // If something breaks we can "Fix it later"(TM) :D
        ExportDefaultDeclaration(path) {
            const decl = path.node.declaration;
            if (!t.isExpression(decl)) return;

            const unwrapped = unwrapExpression(decl);
            if (t.isObjectExpression(unwrapped)) {
                defaultExportObject = unwrapped;
            }
        },
    });

    return defaultExportObject;
}

// unwrap the real value from TS wrappers
// eg: export default { ... } satisfies Locale;
// we need the inner object expression
function unwrapExpression(expr: t.Expression): t.Expression {
    if (t.isTSSatisfiesExpression(expr) || t.isTSAsExpression(expr) || t.isParenthesizedExpression(expr)) {
        return unwrapExpression(expr.expression as t.Expression);
    }
    return expr;
}

function extractStringNode(expr: t.Expression): StringNode | null {
    const pure = tryExtractStringLiteral(expr);
    if (pure != null) {
        return { type: "string", value: pure };
    }

    if (t.isTemplateLiteral(expr)) {
        // keep full template source as-is, e.g. `A template literal ${SOME_CONST}`
        return { type: "string_template", value: generate(expr).code };
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
        type: "variable",
        name: expr.name,
    };
}

// currently translation arrays can only contain strings (plain or template)
function extractArrayNode(expr: t.Expression): ArrayNode | null {
    if (!t.isArrayExpression(expr)) return null;

    const items: ArrayNode["value"] = [];
    for (const el of expr.elements) {
        if (!el || !t.isExpression(el)) return null;

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
    }

    return {
        type: "array",
        value: items,
        length: items.length,
    };
}

function isFunctionLike(expr: t.Expression) {
    return t.isFunctionExpression(expr) || t.isArrowFunctionExpression(expr);
}

function extractFunctionNode(expr: t.FunctionExpression | t.ArrowFunctionExpression): FunctionNode {
    const params = extractFnParams(expr);
    const body = extractFnBody(expr);

    return {
        type: "function",
        params,
        body,
    } satisfies FunctionNode;
}

function extractFnParams(fn: t.FunctionExpression | t.ArrowFunctionExpression): TranslationFn_Params[] {
    return fn.params.map((p) => {
        // shouldn't really happen in our case
        // only happens if using destructuring or rest params
        if (!t.isIdentifier(p)) {
            return { name: "[unknown]", type: "string" };
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

function extractFnBody(fn: t.FunctionExpression | t.ArrowFunctionExpression): TranslationFn_Body {
    if (t.isArrowFunctionExpression(fn) && !t.isBlockStatement(fn.body)) {
        const arr = extractArrayNode(fn.body);
        if (arr) return arr;

        const strNode = extractStringNode(fn.body);
        if (strNode) return strNode;
    }

    return {
        type: "BlockExpression",
        value: extractFnCode(fn),
    };
}

function extractFnCode(fn: t.FunctionExpression | t.ArrowFunctionExpression): string {
    if (t.isBlockStatement(fn.body)) {
        return fn.body.body.map((stmt) => generate(stmt).code).join("\n");
    }
    // arrow function with expression body: x => expr
    return generate(fn.body).code;
}
