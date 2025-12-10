import { useEffect, useState } from "react";
import "./index.css";
import { getFileContents } from "./lib/gh_api";
import { extractTranslationsFromObject, getDefaultExportObject } from "./lib/parser";
import type { ArrayNode, FunctionNode, ObjectNode, StringNode, TranslationNode, VariableNode } from "./lib/types";

export default function AppRoot() {
    const [refParsed, setRefParsed] = useState<TranslationNode[] | null>(null);

    async function fetchRefFile() {
        const res = await getFileContents("", "", "");
        setRefParsed(extractTranslationsFromObject(getDefaultExportObject(res)!));
    }

    // biome-ignore lint/correctness/useExhaustiveDependencies: --
    useEffect(() => {
        fetchRefFile();
    }, []);

    return (
        <main>
            <div
                style={{
                    padding: "1rem 2rem",
                }}
            >
                {refParsed && <RenderObject parentKeys={[]} node={{ type: "object", value: refParsed }} />}
            </div>
        </main>
    );
}

type RenderProps<T> = {
    parentKeys: (string | number)[];
    node: T;
    startBlockPadding?: boolean;
    endBlockPadding?: boolean;
};

function RenderObject(props: RenderProps<ObjectNode>) {
    return (
        <div
            style={{
                fontFamily: "monospace",
                fontSize: "16px",
                marginBlock: "10px",
            }}
        >
            {padding(props.parentKeys.length)}
            {props.parentKeys.length > 0 ? (
                <RenderKey customClassName="object" keyName={props.parentKeys.at(-1)} />
            ) : (
                "export default "
            )}{" "}
            <Delimiter char="{" />
            <div>
                {props.node.value.map((node) => {
                    const parentKeys = [...props.parentKeys, node.key];
                    const componentKey = parentKeys.join(".");

                    const pad = padding(props.parentKeys.length + 1);

                    switch (node.type) {
                        case "string":
                            return (
                                <div key={componentKey}>
                                    {pad}
                                    <span className="key">{node.key}</span>
                                    <Delimiter char=":" />{" "}
                                    <RenderString key={componentKey} parentKeys={parentKeys} node={node} />
                                    <Delimiter char="," />
                                </div>
                            );

                        case "variable":
                            return (
                                <div key={componentKey}>
                                    {pad}
                                    <span className="key">{node.key}</span>
                                    <Delimiter char=":" />{" "}
                                    <RenderVariable key={componentKey} parentKeys={parentKeys} node={node} />
                                    <Delimiter char="," />
                                </div>
                            );

                        case "array":
                            return (
                                <div key={componentKey}>
                                    {pad}
                                    <span className="key">{node.key}</span>
                                    <Delimiter char=":" /> <Delimiter char="[" className="special-delimiter" />
                                    <RenderArray key={componentKey} parentKeys={parentKeys} node={node} />
                                    {pad}
                                    <Delimiter char="]" className="special-delimiter" />
                                    <Delimiter char="," />
                                </div>
                            );

                        case "function":
                            return <RenderFunction key={componentKey} parentKeys={parentKeys} node={node} />;

                        case "object":
                            return <RenderObject key={componentKey} parentKeys={parentKeys} node={node} />;

                        default:
                            return null;
                    }
                })}
            </div>
            {padding(props.parentKeys.length)}
            <Delimiter char="}" />
            {props.parentKeys.length > 0 ? <Delimiter char="," /> : ""}
        </div>
    );
}

function RenderArray(props: RenderProps<ArrayNode>) {
    return props.node.value.map((item, index) => {
        const parentKeys = [...props.parentKeys, index];
        const componentKey = parentKeys.join(".");

        let renderedItem: React.ReactNode = null;
        switch (item.type) {
            case "string":
                renderedItem = <RenderString parentKeys={parentKeys} node={item} />;
                break;
            case "variable":
                renderedItem = <RenderVariable parentKeys={parentKeys} node={item} />;
                break;
            default:
                renderedItem = null;
        }

        return (
            <div key={componentKey}>
                {padding(props.parentKeys.length + 1)}
                {renderedItem}
                {index < props.node.length - 1 ? <Delimiter char="," /> : ""}
            </div>
        );
    });
}

function RenderFunction(props: RenderProps<FunctionNode>) {
    if (props.node.body.type === "BlockExpression") {
        let paddedBody = "";
        for (const line of props.node.body.value.split("\n")) {
            paddedBody += padding(props.parentKeys.length + 1) + line + "\n";
        }

        return (
            <div>
                {padding(props.parentKeys.length)}
                <RenderKey keyName={props.parentKeys.at(-1)} customClassName="function" />{" "}
                <span className="decl">function</span> <RenderFnParams fnParams={props.node.params} />{" "}
                <Delimiter className="special-delimiter" char="{" />
                <pre>{paddedBody}</pre>
                {padding(props.parentKeys.length)}
                <Delimiter className="special-delimiter" char="}" />
                <Delimiter char="," />
            </div>
        );
    }

    let renderedBody: React.ReactNode = null;
    switch (props.node.body.type) {
        case "string":
        case "string_template":
            renderedBody = <RenderString parentKeys={props.parentKeys.map((_, i) => i)} node={props.node.body} />;
            break;
        case "variable":
            renderedBody = <RenderVariable parentKeys={props.parentKeys.map((_, i) => i)} node={props.node.body} />;
            break;
        case "array":
            renderedBody = (
                <>
                    <Delimiter char="[" className="special-delimiter" />
                    <RenderArray
                        parentKeys={props.parentKeys.map((_, i) => i)}
                        node={props.node.body}
                        startBlockPadding={false}
                    />
                    {padding(props.parentKeys.length)}
                    <Delimiter char="]" className="special-delimiter" />
                </>
            );
            break;
        default:
            renderedBody = "[Function Body]";
    }

    return (
        <div>
            {padding(props.parentKeys.length)}
            <RenderKey keyName={props.parentKeys.at(-1)} customClassName="decl" />{" "}
            <RenderFnParams fnParams={props.node.params} /> <Delimiter char="=>" /> {renderedBody}
            <Delimiter char="," />
        </div>
    );
}

function RenderFnParams(props: { fnParams: FunctionNode["params"] }) {
    return (
        <>
            <Delimiter char="(" className="parens" />
            {props.fnParams.map((p, index) => {
                return (
                    <>
                        <span className="variable">{p.name}</span>
                        {p.type ? (
                            <>
                                <Delimiter char=": " />
                                <span className="type">{p.type}</span>
                            </>
                        ) : null}
                        {index < props.fnParams.length - 1 ? <Delimiter char=", " /> : null}
                    </>
                );
            })}
            <Delimiter char=")" className="parens" />
        </>
    );
}

function RenderVariable(props: RenderProps<VariableNode>) {
    return <span className="variable">{props.node.name}</span>;
}

function RenderString(props: RenderProps<StringNode>) {
    if (props.node.type === "string_template") {
        // the backticks are part of the string template
        return <span className="string">{props.node.value}</span>;
    }
    return <span className="string">"{props.node.value}"</span>;
}

function RenderKey(props: { keyName: string | number | undefined; customClassName?: string }) {
    if (typeof props.keyName !== "string") return null;

    return (
        <>
            <span className={props.customClassName ?? "key"}>{props.keyName}</span>
            <Delimiter char=":" />
        </>
    );
}

function Delimiter(props: { char: string; className?: string }) {
    return <span className={props.className ?? "delimiter"}>{props.char}</span>;
}

function padding(indent: number) {
    // 4 spaces per indent level
    return "\u00A0".repeat(indent * 4);
}
