import type { JSX } from "solid-js/jsx-runtime";
import type { TranslationNode } from "~/lib/types";

export interface NodeRendererProps<T extends TranslationNode = TranslationNode> {
    path: string[];
    node: T;
    isEditable: boolean;
    postInlineContent?: JSX.Element;
    onEdit: node_OnEditHandler;
}

export type node_OnEditHandler = (path: string[], node: TranslationNode) => void;
