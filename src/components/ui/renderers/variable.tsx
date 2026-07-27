import type { VariableNode } from "~/lib/types";
import type { NodeRendererProps } from "./types";

export function VariableRenderer(props: NodeRendererProps<VariableNode>) {
    return (
        <div class="node-variable">
            <span class="token token-variable">{props.node.name}</span>
            {props.postInlineContent}
        </div>
    );
}
