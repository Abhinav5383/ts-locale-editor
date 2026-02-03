import generate from "@babel/generator";
import { parse } from "@babel/parser";
import traverse from "@babel/traverse";
import * as t from "@babel/types";
import type {
    ArrayNode,
    FunctionNode,
    ObjectNode,
    StringNode,
    TranslationFn_Body,
    TranslationFn_Params,
    VariableNode,
} from "./types";

export function getTranslationNodesFromTxtFile(code: string): ObjectNode {
    const ast = getExportsAST(code);
    return getTranslationNodesFromAST(ast);
}

function getTranslationNodesFromAST(exports: ReturnType<typeof getExportsAST>): ObjectNode {
    const result: ObjectNode = {
        type: "object",
        value: [],
    };
    if (!exports) return result;

    if (Array.isArray(exports)) {
        for (const fnDecl of exports) {
            if (!t.isFunctionDeclaration(fnDecl) || !fnDecl.id) continue;

            const fnNode = extractFunctionNode(fnDecl);
            result.value.push({
                key: fnDecl.id.name,
                ...fnNode,
            });
        }
    } else {
        const obj = exports;

        for (const prop of obj.properties) {
            if (!t.isObjectProperty(prop)) continue;
            if (!t.isExpression(prop.value)) continue;

            let key: string | null = null;
            if (t.isIdentifier(prop.key)) key = prop.key.name;
            else if (t.isStringLiteral(prop.key)) key = prop.key.value;
            if (!key) continue;

            const extractedNode = mapExpressionToNode(key, prop.value);
            if (extractedNode) result.value.push(extractedNode);
        }
    }

    return result;
}

export function getExportsAST(code: string): t.ObjectExpression | t.FunctionDeclaration[] | null {
    const ast = parse(code, {
        sourceType: "module",
        plugins: ["typescript"],
    });

    let defaultExportObject: t.ObjectExpression | null = null;
    const exportedFunctionExpressions: t.FunctionDeclaration[] = [];

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

        ExportNamedDeclaration(path) {
            const decl = path.node.declaration;
            if (!decl) return;

            if (t.isFunctionDeclaration(decl)) {
                exportedFunctionExpressions.push(decl);
            }
        },
    });

    if (defaultExportObject) return defaultExportObject;
    if (exportedFunctionExpressions.length > 0) return exportedFunctionExpressions;

    return null;
}

// unwrap the real value from TS wrappers
// eg: export default { ... } satisfies Locale;
// we need the inner object expression
function unwrapExpression(expr: t.Expression): t.Expression {
    if (
        t.isTSSatisfiesExpression(expr) ||
        t.isTSAsExpression(expr) ||
        t.isParenthesizedExpression(expr)
    ) {
        return unwrapExpression(expr.expression as t.Expression);
    }
    return expr;
}

function mapExpressionToNode(key: string, expr: t.Expression): ObjectNode["value"][number] | null {
    if (t.isObjectExpression(expr)) {
        return {
            key,
            ...getTranslationNodesFromAST(expr),
        };
    }

    if (isFunctionLike(expr)) {
        const fnNode = extractFunctionNode(expr);
        return {
            key,
            ...fnNode,
        };
    }

    const arrayNode = extractArrayNode(expr);
    if (arrayNode) {
        return { key, ...arrayNode };
    }

    const stringNode = extractStringNode(expr);
    if (stringNode) {
        return { key, ...stringNode };
    }

    const variableNode = extractVariableNode(expr);
    if (variableNode) {
        return { key, ...variableNode };
    }

    return null;
}

function extractStringNode(expr: t.Expression): StringNode | null {
    const pure = tryExtractStringLiteral(expr);
    if (pure != null) {
        return { type: "string", value: pure };
    }

    if (t.isTemplateLiteral(expr)) {
        // keep full template source as-is, e.g. `A template literal ${SOME_CONST}`
        let template = generate(expr).code;
        template = template.slice(1, -1);
        return { type: "string_template", value: template };
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
        }
    }

    return {
        type: "array",
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
        type: "function",
        params,
        body,
    } satisfies FunctionNode;
}

function extractFnParams(fn: AST_FnTypes): TranslationFn_Params[] {
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

function extractFnBody(fn: AST_FnTypes): TranslationFn_Body {
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

function extractFnCode(fn: AST_FnTypes): string {
    if (t.isBlockStatement(fn.body)) {
        return fn.body.body.map((stmt) => generate(stmt).code).join("\n");
    }
    // arrow function with expression body: x => expr
    return generate(fn.body).code;
}
