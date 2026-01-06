import type { JSX } from "solid-js/jsx-runtime";
import type { TranslationNodeUnion } from "~/lib/types";

export interface NodeRendererProps<T extends TranslationNodeUnion = TranslationNodeUnion> {
    node: T;
    isEditable: boolean;
    postInlineContent?: JSX.Element;
}
