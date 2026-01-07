import { Match, Switch } from "solid-js";
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
                    props.node.type === "string" || props.node.type === "string_template"
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

            <Match keyed when={props.node.type === "variable" ? props.node : false}>
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

            <Match keyed when={props.node.type === "array" ? props.node : false}>
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

            <Match when={props.node.type === "object" ? props.node : false}>
                <span> </span>
            </Match>

            <Match keyed when={props.node.type === "function" ? props.node : false}>
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
