import { Match, Switch } from "solid-js";
import { NodeType } from "~/lib/types";
import { ArrayRenderer } from "./array";
import { FunctionRenderer } from "./function";
import { StringRenderer } from "./string";
import type { NodeRendererProps } from "./types";
import { VariableRenderer } from "./variable";

export function NodeRenderer(props: NodeRendererProps) {
    return (
        <Switch>
            <Match
                keyed
                when={
                    props.node.type === NodeType.String ||
                    props.node.type === NodeType.StringTemplate
                        ? props.node
                        : false
                }
            >
                {(node) => (
                    <StringRenderer
                        node={node}
                        path={props.path}
                        onChange={props.onChange}
                        isEditable={props.isEditable}
                        postInlineContent={props.postInlineContent}
                    />
                )}
            </Match>

            <Match keyed when={props.node.type === NodeType.Variable ? props.node : false}>
                {(node) => (
                    <VariableRenderer
                        node={node}
                        path={props.path}
                        onChange={props.onChange}
                        isEditable={props.isEditable}
                        postInlineContent={props.postInlineContent}
                    />
                )}
            </Match>

            <Match keyed when={props.node.type === NodeType.Array ? props.node : false}>
                {(node) => (
                    <ArrayRenderer
                        node={node}
                        path={props.path}
                        onChange={props.onChange}
                        isEditable={props.isEditable}
                        postInlineContent={props.postInlineContent}
                    />
                )}
            </Match>

            <Match when={props.node.type === NodeType.Object ? props.node : false}>
                <span> </span>
            </Match>

            <Match keyed when={props.node.type === NodeType.Function ? props.node : false}>
                {(node) => (
                    <FunctionRenderer
                        node={node}
                        path={props.path}
                        onChange={props.onChange}
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
