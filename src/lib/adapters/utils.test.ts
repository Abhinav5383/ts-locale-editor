import { describe, expect, test } from "bun:test";
import { NodeType, type ObjectNode } from "~/lib/types";
import { sortNodes } from "./utils";

describe("sortNodes", () => {
    test("orders by ref key order, appends extras, recurses into nested objects", () => {
        const ref: ObjectNode = {
            type: NodeType.Object,
            value: [
                { type: NodeType.String, key: "a", value: "" },
                {
                    type: NodeType.Object,
                    key: "nested",
                    value: [
                        { type: NodeType.String, key: "x", value: "" },
                        { type: NodeType.String, key: "y", value: "" },
                    ],
                },
                { type: NodeType.String, key: "z", value: "" },
            ],
        };

        const translated: ObjectNode = {
            type: NodeType.Object,
            value: [
                {
                    type: NodeType.Object,
                    key: "nested",
                    value: [
                        { type: NodeType.String, key: "y", value: "Y" },
                        { type: NodeType.String, key: "x", value: "X" },
                        { type: NodeType.String, key: "extra", value: "E" },
                    ],
                },
                { type: NodeType.String, key: "newKey", value: "N" },
                { type: NodeType.String, key: "a", value: "A" },
            ],
        };

        const result = sortNodes(translated, ref);
        expect(result.value.map((n) => n.key)).toEqual(["a", "nested", "newKey"]);

        const nested = result.value[1];
        expect(nested.type === NodeType.Object && nested.value.map((n) => n.key)).toEqual([
            "x",
            "y",
            "extra",
        ]);
    });

    test("drops keys present in ref but missing from translated", () => {
        const ref: ObjectNode = {
            type: NodeType.Object,
            value: [
                { type: NodeType.String, key: "a", value: "" },
                { type: NodeType.String, key: "b", value: "" },
            ],
        };
        const translated: ObjectNode = {
            type: NodeType.Object,
            value: [{ type: NodeType.String, key: "b", value: "B" }],
        };

        expect(sortNodes(translated, ref).value.map((n) => n.key)).toEqual(["b"]);
    });
});
