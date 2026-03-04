import { describe, expect, test } from "bun:test";
import { NodeType, type ObjectNode } from "~/lib/types";
import { AssembleTsTranslation } from "./assembler";

function assemble(template: string, ref: ObjectNode, translated: ObjectNode) {
    return AssembleTsTranslation({
        fileName: "t.ts",
        translatingLocaleCode: template,
        refNodes: ref,
        translatedNodes: translated,
    });
}

const emptyObj: ObjectNode = { type: NodeType.Object, value: [] };

describe("AssembleTsTranslation", () => {
    test("default export: replaces object body, preserves surrounding code", () => {
        const template = `const a = 1;\nexport default { old: "x" } satisfies Locale;\nconst b = 2;`;
        const translated: ObjectNode = {
            type: NodeType.Object,
            value: [
                { type: NodeType.String, key: "greeting", value: "Hola" },
                { type: NodeType.StringTemplate, key: "tmpl", value: `Hi \${name}` },
                {
                    type: NodeType.Function,
                    key: "cta",
                    params: [{ name: "u", type: "string" }],
                    body: { type: NodeType.StringTemplate, value: `Go \${u}` },
                },
                {
                    type: NodeType.Array,
                    key: "items",
                    value: [
                        { type: NodeType.String, value: "A" },
                        { type: NodeType.Variable, name: "B" },
                    ],
                },
            ],
        };

        const result = assemble(template, emptyObj, translated);
        expect(result).toContain("const a = 1;");
        expect(result).toContain("const b = 2;");
        expect(result).toContain('greeting: "Hola"');
        expect(result).toContain(`tmpl: \`Hi \${name}\``);
        expect(result).toContain(`cta: (u) => \`Go \${u}\``);
        expect(result).toContain("items: [\n");
    });

    test("named exports: replaces each initializer, preserves type annotations", () => {
        const template = [
            "export const AboutUs = (props: AboutUsProps) => ``;",
            'export const meta = { old: "x" };',
        ].join("\n");

        const ref: ObjectNode = {
            type: NodeType.Object,
            value: [
                {
                    type: NodeType.Function,
                    key: "AboutUs",
                    params: [{ name: "props", type: "AboutUsProps" }],
                    body: { type: NodeType.StringTemplate, value: "" },
                },
                {
                    type: NodeType.Object,
                    key: "meta",
                    value: [{ type: NodeType.String, key: "title", value: "Old" }],
                },
            ],
        };

        const translated: ObjectNode = {
            type: NodeType.Object,
            value: [
                {
                    type: NodeType.Function,
                    key: "AboutUs",
                    params: [{ name: "props", type: "AboutUsProps" }],
                    body: { type: NodeType.StringTemplate, value: `Hi \${props.name}` },
                },
                {
                    type: NodeType.Object,
                    key: "meta",
                    value: [{ type: NodeType.String, key: "title", value: "Docs" }],
                },
            ],
        };

        const result = assemble(template, ref, translated);
        expect(result).toContain(`(props: AboutUsProps) => \`Hi \${props.name}\``);
        expect(result).toContain('title: "Docs"');
    });

    test("named export with block expression body", () => {
        const template = "export const Fn = (x: string) => ``;";
        const fnBody = `return \`Hello \${x}\`;`;

        const translated: ObjectNode = {
            type: NodeType.Object,
            value: [
                {
                    type: NodeType.Function,
                    key: "Fn",
                    params: [{ name: "x", type: "string" }],
                    body: { type: NodeType.BlockExpression, value: fnBody },
                },
            ],
        };

        const result = assemble(template, translated, translated);
        expect(result).toContain("(x: string) => {");
        expect(result).toContain(fnBody);
    });

    test("returns null for unparseable template", () => {
        expect(assemble("not valid code", emptyObj, emptyObj)).toBeNull();
    });
});
