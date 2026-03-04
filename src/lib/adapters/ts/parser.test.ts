import { describe, expect, test } from "bun:test";
import { ExportType, NodeType } from "~/lib/types";
import { getExportsAST, getTranslationNodesFromTsFile } from "./parser";

describe("getExportsAST", () => {
    test("returns raw expression for default export (no unwrapping)", () => {
        const items = getExportsAST('export default ({ k: "v" } as const) satisfies Locale;');
        expect(items).not.toBeNull();
        expect(items).toHaveLength(1);
        expect(items?.[0].type).toBe(ExportType.Default);
        expect(items?.[0].decl.type).toBe("TSSatisfiesExpression");
    });

    test("collects named export items", () => {
        const items = getExportsAST('export const A = 1;\nexport const B = "x";');
        expect(items).not.toBeNull();
        expect(items).toHaveLength(2);
        expect(items?.[0].type).toBe(ExportType.Named);
        expect(items?.[0].decl.type).toBe("VariableDeclaration");
        expect(items?.[1].type).toBe(ExportType.Named);
        expect(items?.[1].decl.type).toBe("VariableDeclaration");
    });

    test("returns null when no exports exist", () => {
        expect(getExportsAST("const x = 1;")).toBeNull();
    });
});

describe("getTranslationNodesFromTsFile", () => {
    test("parses all node types from default export", () => {
        const code = [
            "const FB = fallback;",
            "export default {",
            '    plain: "Hello",',
            "    tmpl: `Hi ${username}`,",
            '    nested: { inner: "X" },',
            '    items: ["a", `b-${s}`, FB],',
            "    arrow: (n: string) => `Hi ${n}`,",
            "    block: (v: number) => { return `v=${v}`; },",
            "    ref: FB,",
            "};",
        ].join("\n");

        const result = getTranslationNodesFromTsFile(code);

        // default export is wrapped under a "default" key
        expect(result.value).toHaveLength(1);
        expect(result.value[0].key).toBe("default");
        expect(result.value[0].type).toBe(NodeType.Object);

        const defaultExport = result.value[0];
        if (defaultExport.type !== NodeType.Object) throw new Error("Expected Object");

        const nodes = defaultExport.value;
        const keys = nodes.map((n) => n.key);
        expect(keys).toEqual(["plain", "tmpl", "nested", "items", "arrow", "block", "ref"]);

        // string literal
        expect(nodes[0]).toMatchObject({ type: NodeType.String, value: "Hello" });
        // template literal
        expect(nodes[1]).toMatchObject({ type: NodeType.StringTemplate });
        // nested object
        expect(nodes[2].type).toBe(NodeType.Object);
        // array
        expect(nodes[3].type).toBe(NodeType.Array);
        // arrow fn
        expect(nodes[4].type).toBe(NodeType.Function);
        // block fn body
        const block = nodes[5];
        expect(block.type === NodeType.Function && block.body.type).toBe(NodeType.BlockExpression);
        // variable ref
        expect(nodes[6]).toMatchObject({ type: NodeType.Variable, name: "FB" });
    });

    test("maps named exports as root-level keys", () => {
        const code = [
            "export const Greet = (p: Props) => `Hi ${p.name}`;",
            'export const meta = { title: "Docs" };',
        ].join("\n");

        const result = getTranslationNodesFromTsFile(code);
        expect(result.value.map((n) => n.key)).toEqual(["Greet", "meta"]);
        expect(result.value[0].type).toBe(NodeType.Function);
        expect(result.value[1]).toMatchObject({
            type: NodeType.Object,
            value: [{ type: NodeType.String, key: "title", value: "Docs" }],
        });
    });

    test("template literal without interpolations becomes plain string", () => {
        const result = getTranslationNodesFromTsFile("export default { k: `plain` };");
        expect(result.value[0]).toMatchObject({
            type: NodeType.Object,
            key: "default",
            value: [{ type: NodeType.String, key: "k", value: "plain" }],
        });
    });

    test("unwraps satisfies/as on named export initializers", () => {
        const code =
            'export const meta = { title: "Hi", nested: { hi: ("Hi" satisfies string) } } satisfies Record<string, string>;';
        const result = getTranslationNodesFromTsFile(code);
        expect(result.value[0]).toMatchObject({
            type: NodeType.Object,
            key: "meta",
            value: [
                { type: NodeType.String, key: "title", value: "Hi" },
                {
                    type: NodeType.Object,
                    key: "nested",
                    value: [{ type: NodeType.String, key: "hi", value: "Hi" }],
                },
            ],
        });
    });

    test("unwraps deeply nested TS wrappers on object values", () => {
        const code = 'export default { k: ({ a: "v" }) satisfies Foo };';
        const result = getTranslationNodesFromTsFile(code);
        expect(result.value[0]).toMatchObject({
            type: NodeType.Object,
            key: "default",
            value: [
                {
                    type: NodeType.Object,
                    key: "k",
                    value: [{ type: NodeType.String, key: "a", value: "v" }],
                },
            ],
        });
    });

    test("no exports returns empty object node", () => {
        expect(getTranslationNodesFromTsFile("const x = 1;")).toEqual({
            type: NodeType.Object,
            value: [],
        });
    });
});
