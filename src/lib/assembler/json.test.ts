import { describe, expect, test } from "bun:test";
import { NodeType, type ObjectNode } from "~/lib/types";
import { AssembleJsonTranslation } from "./json";

function assemble(ref: ObjectNode, translated: ObjectNode) {
    return AssembleJsonTranslation({
        fileName: "t.json",
        refNodes: ref,
        translatedNodes: translated,
    });
}

describe("AssembleJsonTranslation", () => {
    test("assembles nested objects, sorts by ref order, appends extras at end", () => {
        const ref: ObjectNode = {
            type: NodeType.Object,
            value: [
                { type: NodeType.String, key: "a", value: "" },
                {
                    type: NodeType.Object,
                    key: "nested",
                    value: [{ type: NodeType.String, key: "x", value: "" }],
                },
            ],
        };

        const translated: ObjectNode = {
            type: NodeType.Object,
            value: [
                {
                    type: NodeType.Object,
                    key: "nested",
                    value: [{ type: NodeType.String, key: "x", value: "X" }],
                },
                { type: NodeType.String, key: "extra", value: "E" },
                { type: NodeType.String, key: "a", value: "A" },
            ],
        };

        expect(assemble(ref, translated)).toBe(
            JSON.stringify({ a: "A", nested: { x: "X" }, extra: "E" }, null, 4),
        );
    });

    test("skips function nodes", () => {
        const nodes: ObjectNode = {
            type: NodeType.Object,
            value: [
                { type: NodeType.String, key: "ok", value: "yes" },
                {
                    type: NodeType.Function,
                    key: "fn",
                    params: [],
                    body: { type: NodeType.String, value: "no" },
                },
            ],
        };

        const result = assemble(nodes, nodes);
        expect(result).not.toBeNull();
        expect(JSON.parse(result as string)).toEqual({ ok: "yes" });
    });

    test("preserves template interpolation strings as-is", () => {
        const interp = "$" + "{name}";
        const nodes: ObjectNode = {
            type: NodeType.Object,
            value: [{ type: NodeType.StringTemplate, key: "g", value: `Hi ${interp}` }],
        };

        const result = assemble(nodes, nodes);
        expect(result).not.toBeNull();
        expect(JSON.parse(result as string)).toEqual({ g: `Hi ${interp}` });
    });
});
