import { createSignal, For, Show } from "solid-js";
import type {
    ArrayNode,
    FunctionNode,
    ObjectNode,
    StringNode,
    TranslationNode,
    VariableNode,
} from "~/lib/types";
import "./editor.css";
import { flattenLocaleEntries } from "./utils";

interface EditorProps {
    refLocale: ObjectNode; // the base reference locale
    editLocale: ObjectNode; // the locale being edited
}

export default function Editor(props: EditorProps) {
    return (
        <div class="editor-wrapper">
            <div class="editor-header">
                <div class="header-column"> </div>
                <div class="header-column">Reference Locale</div>
                <div class="header-column">Edit Locale</div>
            </div>
            <EditorContent refLocale={props.refLocale} editLocale={props.editLocale} />
        </div>
    );
}

interface EditorContentProps {
    refLocale: ObjectNode;
    editLocale: ObjectNode;
}

function EditorContent(props: EditorContentProps) {
    const flattenedItems = () =>
        flattenLocaleEntries(props.refLocale.value, props.editLocale.value);

    return (
        <div class="object-renderer">
            <For each={flattenedItems()}>
                {(item) => (
                    <div
                        class={`node-row ${item.refNode.type === "object" ? "node-row-object" : ""}`}
                        style={{ "--depth": `${item.depth}` } as Record<string, string>}
                    >
                        <div class="node-key">{item.key}</div>
                        <div class="node-value-ref">
                            <NodeRenderer node={item.refNode} isEditable={false} />
                        </div>
                        <div class="node-value-edit">
                            <NodeRenderer node={item.editNode} isEditable={true} />
                        </div>
                    </div>
                )}
            </For>
        </div>
    );
}

interface NodeRendererProps {
    node: TranslationNode;
    isEditable: boolean;
}

function NodeRenderer(props: NodeRendererProps) {
    const node = props.node;

    switch (node.type) {
        case "string":
            return <StringRenderer node={node} isEditable={props.isEditable} />;
        case "string_template":
            return <StringRenderer node={node} isEditable={props.isEditable} />;
        case "variable":
            return <VariableRenderer node={node} />;
        case "array":
            return <ArrayRenderer node={node} isEditable={props.isEditable} />;
        case "object":
            return <span class="token token-object"> </span>;
        case "function":
            return <FunctionRenderer node={node} isEditable={props.isEditable} />;
        default:
            return <div class="node-unknown">Unknown node type</div>;
    }
}

interface StringRendererProps {
    node: StringNode;
    isEditable: boolean;
}

function StringRenderer(props: StringRendererProps) {
    const [value, setValue] = createSignal(props.node.value);
    const isTemplate = props.node.type === "string_template";

    return (
        <div class="node-string">
            <Show
                when={props.isEditable}
                fallback={
                    <pre
                        style={{
                            "text-wrap": "wrap",
                            "word-wrap": "break-word",
                            "word-break": "break-all",
                            margin: 0,
                            padding: 0,
                        }}
                        class="token token-string-content"
                    >
                        <span class="token token-string">{isTemplate ? "`" : '"'}</span>
                        {value()}
                        <span class="token token-string">{isTemplate ? "`" : '"'}</span>
                    </pre>
                }
            >
                <span
                    class="string-editable token token-string-content"
                    contenteditable={true}
                    spellcheck={false}
                    onInput={(e) => setValue(e.currentTarget.textContent || "")}
                >
                    {value()}
                </span>
            </Show>
        </div>
    );
}

interface VariableRendererProps {
    node: VariableNode;
}

function VariableRenderer(props: VariableRendererProps) {
    return (
        <div class="node-variable">
            <span class="token token-variable">{props.node.name}</span>
        </div>
    );
}

interface ArrayRendererProps {
    node: ArrayNode;
    isEditable: boolean;
}

function ArrayRenderer(props: ArrayRendererProps) {
    const [items] = createSignal(props.node.value);

    return (
        <div class="node-array">
            <span class="token token-bracket">[</span>
            <div class="array-items">
                <For each={items()}>
                    {(item, index) => (
                        <div class="array-item">
                            <NodeRenderer
                                node={item as TranslationNode}
                                isEditable={props.isEditable}
                            />
                            <Show when={index() < items().length - 1}>
                                <span class="token token-comma">,</span>
                            </Show>
                        </div>
                    )}
                </For>
            </div>
            <span class="token token-bracket">]</span>
        </div>
    );
}

interface FunctionRendererProps {
    node: FunctionNode;
    isEditable: boolean;
}

function FunctionRenderer(props: FunctionRendererProps) {
    const [bodyValue, setBodyValue] = createSignal(
        props.node.body.type === "BlockExpression" ? props.node.body.value : "",
    );

    const isBlockExpression = props.node.body.type === "BlockExpression";
    const minHeightEm = () => bodyValue().split("\n").length * 1.5 + 1;

    return (
        <Show
            when={isBlockExpression}
            fallback={
                <div class="node-function">
                    <div class="function-signature">
                        <span class="token token-punctuation">(</span>
                        <For each={props.node.params}>
                            {(param, index) => (
                                <>
                                    <span class="token token-parameter">{param.name}</span>
                                    <span class="token token-punctuation">:&nbsp;</span>
                                    <span class="token token-type">{param.type}</span>
                                    <Show when={index() < props.node.params.length - 1}>
                                        <span class="token token-punctuation">,&nbsp;</span>
                                    </Show>
                                </>
                            )}
                        </For>
                        <span class="token token-punctuation">)&nbsp;=&gt;</span>
                    </div>
                    <div>
                        <NodeRenderer
                            node={props.node.body as TranslationNode}
                            isEditable={props.isEditable}
                        />
                    </div>
                </div>
            }
        >
            <div class="node-function">
                <div class="function-signature">
                    <span class="token token-keyword">function</span>
                    <span class="token token-punctuation">&nbsp;(</span>
                    <For each={props.node.params}>
                        {(param, index) => (
                            <>
                                <span class="token token-parameter">{param.name}</span>
                                <span class="token token-punctuation">:&nbsp;</span>
                                <span class="token token-type">{param.type}</span>
                                <Show when={index() < props.node.params.length - 1}>
                                    <span class="token token-punctuation">,&nbsp;</span>
                                </Show>
                            </>
                        )}
                    </For>
                    <span class="token token-punctuation">)&nbsp;{"{"}</span>
                </div>
                <Show
                    when={props.isEditable}
                    fallback={
                        <div class="code-block">
                            <code class="token token-code">{bodyValue()}</code>
                        </div>
                    }
                >
                    <div
                        class="code-editable"
                        contenteditable={true}
                        onInput={(e) => setBodyValue(e.currentTarget.textContent || "")}
                        spellcheck={false}
                        style={{
                            "min-height": `${minHeightEm()}em`,
                        }}
                    >
                        {bodyValue()}
                    </div>
                </Show>
                <span class="token token-punctuation">{"}"}</span>
            </div>
        </Show>
    );
}
