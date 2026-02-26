import { For, Match, Show, Switch } from "solid-js";
import {
    type FunctionNode,
    NodeType,
    type TranslationFn_BlockExprBody,
    type TranslationNode,
} from "~/lib/types";
import { NodeRenderer } from "./node";
import { ContentEditable } from "./string";
import type { NodeRendererProps } from "./types";

export function FunctionRenderer(props: NodeRendererProps<FunctionNode>) {
    function handleBlockFnChange(newValue: string) {
        props.onChange(props.path, {
            ...props.node,
            body: {
                type: NodeType.BlockExpression,
                value: newValue,
            },
        } satisfies FunctionNode<TranslationFn_BlockExprBody>);
    }

    function handleArrowFnChange(path: string[], bodyNode: TranslationNode) {
        const updatedBody = updateFnBody(props.node, bodyNode);
        if (!updatedBody) return;

        props.onChange(path, updatedBody);
    }

    return (
        <Switch>
            <Match
                keyed
                when={props.node.body.type === NodeType.BlockExpression && props.node.body}
            >
                {(fnBody) => (
                    <div class="node-function block-func">
                        <div class="function-signature">
                            <span class="token token-keyword">function</span>
                            <span class="token token-punctuation">&nbsp;{"("}</span>
                            <For each={props.node.params}>
                                {(param, index) => (
                                    <>
                                        <span class="token token-parameter">{param.name}</span>

                                        <Show when={!props.isEditable}>
                                            <span class="token token-punctuation">:&nbsp;</span>
                                            <span class="token token-type">{param.type}</span>
                                        </Show>

                                        <Show when={index() < props.node.params.length - 1}>
                                            <span class="token token-punctuation">,&nbsp;</span>
                                        </Show>
                                    </>
                                )}
                            </For>
                            <span class="token token-punctuation">{") {"}</span>
                        </div>
                        <Show
                            when={props.isEditable}
                            fallback={
                                <div class="code-block">
                                    <code class="token token-code">{fnBody.value}</code>
                                </div>
                            }
                        >
                            <ContentEditable
                                value={fnBody.value}
                                onChange={handleBlockFnChange}
                                className="code-editable"
                            />
                        </Show>
                        <div>
                            <span class="token token-punctuation">{"}"}</span>
                            {props.postInlineContent}
                        </div>
                    </div>
                )}
            </Match>

            <Match
                keyed
                when={props.node.body.type !== NodeType.BlockExpression && props.node.body}
            >
                {(fnBody) => (
                    <div class="node-function inline-func">
                        <div class="function-signature">
                            <span class="token token-punctuation">{"("}</span>
                            <For each={props.node.params}>
                                {(param, index) => (
                                    <>
                                        <span class="token token-parameter">
                                            {param.name}

                                            <Show when={!props.isEditable}>
                                                <span class="token token-punctuation">:&nbsp;</span>
                                            </Show>
                                        </span>

                                        <Show when={!props.isEditable}>
                                            <span class="token token-type">{param.type}</span>
                                        </Show>

                                        <Show when={index() < props.node.params.length - 1}>
                                            <span class="token token-punctuation">,&nbsp;</span>
                                        </Show>
                                    </>
                                )}
                            </For>
                            <span class="token token-punctuation">{") =>"}&nbsp;</span>
                        </div>

                        <NodeRenderer
                            node={fnBody}
                            path={props.path}
                            onChange={handleArrowFnChange}
                            isEditable={props.isEditable}
                        />
                    </div>
                )}
            </Match>
        </Switch>
    );
}

function updateFnBody(oldNode: FunctionNode, newBody: TranslationNode) {
    switch (newBody.type) {
        case NodeType.String:
        case NodeType.StringTemplate:
        case NodeType.Variable:
        case NodeType.Array:
            return {
                ...oldNode,
                body: newBody,
            } satisfies FunctionNode<typeof newBody>;

        default:
            return null;
    }
}
