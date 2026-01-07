import type { JSX } from "solid-js/jsx-runtime";
import type { TranslationNode } from "~/lib/types";

export interface NodeRendererProps<T extends TranslationNode = TranslationNode> {
    path: string[];
    node: T;
    isEditable: boolean;
    postInlineContent?: JSX.Element;
    onChange: node_OnChangeHandler;
}

export type node_OnChangeHandler = (path: string[], node: TranslationNode) => void;
