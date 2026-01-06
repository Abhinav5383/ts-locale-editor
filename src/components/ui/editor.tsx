import { createSignal, For, type JSX, Match, Show, Switch } from "solid-js";
import type {
    ArrayNode,
    FunctionNode,
    ObjectNode,
    StringNode,
    TranslationNode,
    TranslationNodeUnion,
    VariableNode,
} from "~/lib/types";
import { ContentEditable } from "./editable-string";
import "./editor.css";
import { flattenLocaleEntries, IterationItemType } from "./utils";

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
                {(item) => {
                    switch (item.type) {
                        case IterationItemType.OBJ_ENTRY:
                            return (
                                <div
                                    class={`node-row ${item.isLastChild ? "last-entry" : ""}`}
                                    style={{ "--depth": `${item.depth}` }}
                                >
                                    <div class="node-key">
                                        {item.key}
                                        <span class="token">{": "}</span>
                                    </div>
                                    <div class="node-value-ref">
                                        <NodeRenderer node={item.refNode} isEditable={false} />
                                    </div>
                                    <div class="node-value-edit">
                                        <NodeRenderer node={item.editNode} isEditable={true} />
                                    </div>
                                </div>
                            );

                        case IterationItemType.OBJ_START:
                            return (
                                <div
                                    class="node-row obj-brace obj-start-brace"
                                    style={{ "--depth": `${item.depth}` }}
                                >
                                    <div>
                                        <span class="node-key">{item.key}</span>
                                        <span class="token">{": {"}</span>
                                    </div>
                                </div>
                            );

                        case IterationItemType.OBJ_END:
                            return (
                                <div
                                    class="node-row obj-brace obj-end-brace"
                                    style={{ "--depth": `${item.depth}` }}
                                >
                                    <div>
                                        <span class="token">{item.isLastChild ? "}" : "},"}</span>
                                    </div>
                                </div>
                            );
                    }
                }}
            </For>
        </div>
    );
}

interface NodeRendererProps<T extends TranslationNodeUnion = TranslationNodeUnion> {
    node: T;
    isEditable: boolean;
    postInlineContent?: JSX.Element;
}

function NodeRenderer(props: NodeRendererProps) {
    return (
        <Switch>
            <Match
                keyed
                when={
                    props.node.type === "string" || props.node.type === "string_template"
                        ? props.node
                        : false
                }
            >
                {(node) => (
                    <StringRenderer
                        node={node}
                        isEditable={props.isEditable}
                        postInlineContent={props.postInlineContent}
                    />
                )}
            </Match>

            <Match keyed when={props.node.type === "variable" ? props.node : false}>
                {(node) => (
                    <VariableRenderer
                        node={node}
                        isEditable={props.isEditable}
                        postInlineContent={props.postInlineContent}
                    />
                )}
            </Match>

            <Match keyed when={props.node.type === "array" ? props.node : false}>
                {(node) => (
                    <ArrayRenderer
                        node={node}
                        isEditable={props.isEditable}
                        postInlineContent={props.postInlineContent}
                    />
                )}
            </Match>

            <Match when={props.node.type === "object" ? props.node : false}>
                <span> </span>
            </Match>

            <Match keyed when={props.node.type === "function" ? props.node : false}>
                {(node) => (
                    <FunctionRenderer
                        node={node}
                        isEditable={props.isEditable}
                        postInlineContent={props.postInlineContent}
                    />
                )}
            </Match>

            <Match when={true}>
                <div class="node-unknown">Unknown node type</div>
            </Match>
        </Switch>
    );
}

function StringRenderer(props: NodeRendererProps<StringNode>) {
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
                            margin: 0,
                            padding: 0,
                        }}
                        class="token token-string-content"
                    >
                        <span class="token no-select">{isTemplate ? "`" : '"'}</span>
                        {value()}
                        <span class="token no-select">{isTemplate ? "`" : '"'}</span>
                        {props.postInlineContent}
                    </pre>
                }
            >
                <ContentEditable
                    value={value()}
                    onChange={setValue}
                    className="string-editable token token-string-content"
                />
                {props.postInlineContent}
            </Show>
        </div>
    );
}

function VariableRenderer(props: NodeRendererProps<VariableNode>) {
    return (
        <div class="node-variable">
            <span class="token token-variable">{props.node.name}</span>
            {props.postInlineContent}
        </div>
    );
}

function ArrayRenderer(props: NodeRendererProps<ArrayNode>) {
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
                                postInlineContent={
                                    index() < items().length - 1 ? (
                                        <span class="token">,</span>
                                    ) : null
                                }
                            />
                        </div>
                    )}
                </For>
            </div>
            <div>
                <span class="token token-bracket">]</span>
                {props.postInlineContent}
            </div>
        </div>
    );
}

function FunctionRenderer(props: NodeRendererProps<FunctionNode>) {
    const [editorBodyTxt, setEditorBodyTxt] = createSignal(
        props.node.body.type === "BlockExpression" ? props.node.body.value : "",
    );
    const isBlockExpression = props.node.body.type === "BlockExpression";

    return (
        <Show
            when={isBlockExpression}
            fallback={
                <div class="node-function inline-func">
                    <div class="function-signature">
                        <span class="token token-punctuation">{"("}</span>
                        <For each={props.node.params}>
                            {(param, index) => (
                                <>
                                    <span class="token token-parameter">
                                        {param.name}
                                        <span class="token token-punctuation">:&nbsp;</span>
                                    </span>
                                    <span class="token token-type">
                                        {param.type}
                                        <Show when={index() < props.node.params.length - 1}>
                                            <span class="token token-punctuation">,&nbsp;</span>
                                        </Show>
                                    </span>
                                </>
                            )}
                        </For>
                        <span class="token token-punctuation">{") =>"}&nbsp;</span>
                    </div>

                    <NodeRenderer
                        node={props.node.body as TranslationNode}
                        isEditable={props.isEditable}
                    />
                </div>
            }
        >
            <div class="node-function block-func">
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
                            <code class="token token-code">{editorBodyTxt()}</code>
                        </div>
                    }
                >
                    <ContentEditable
                        value={editorBodyTxt()}
                        onChange={setEditorBodyTxt}
                        className="code-editable"
                    />
                </Show>
                <div>
                    <span class="token token-punctuation">{"}"}</span>
                    {props.postInlineContent}
                </div>
            </div>
        </Show>
    );
}
