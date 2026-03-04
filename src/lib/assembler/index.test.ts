import { describe, expect, test } from "bun:test";
import { NodeType, type ObjectNode } from "~/lib/types";
import { AssembleTranslation } from "./index";

const nodes = (v: string): { refNodes: ObjectNode; translatedNodes: ObjectNode } => ({
    refNodes: { type: NodeType.Object, value: [{ type: NodeType.String, key: "k", value: "ref" }] },
    translatedNodes: {
        type: NodeType.Object,
        value: [{ type: NodeType.String, key: "k", value: v }],
    },
});

describe("AssembleTranslation", () => {
    test.each(["ts", "tsx", "js", "jsx"])("routes .%s to TypeScript assembler", (ext) => {
        const result = AssembleTranslation({
            fileName: `f.${ext}`,
            ...nodes("Hola"),
        });
        expect(result).toContain('k: "Hola"');
    });

    test("routes .json to JSON assembler", () => {
        const result = AssembleTranslation({
            fileName: "f.json",
            ...nodes("Hola"),
        });
        expect(result).toBe(JSON.stringify({ k: "Hola" }, null, 4));
    });

    test("throws for unsupported extension", () => {
        expect(() =>
            AssembleTranslation({
                fileName: "f.md",
                ...nodes("x"),
            }),
        ).toThrow("Unsupported file extension: md");
    });
});
