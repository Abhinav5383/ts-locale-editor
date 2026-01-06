import { createEffect, createSignal, Show } from "solid-js";
import type { StringNode } from "~/lib/types";
import type { NodeRendererProps } from "./types";

export function StringRenderer(props: NodeRendererProps<StringNode>) {
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

interface ContentEditableProps {
    value: string;
    onChange: (newValue: string) => void;
    className?: string;
}
type EditElem = HTMLDivElement;

export function ContentEditable(props: ContentEditableProps) {
    let divRef: EditElem | undefined;

    function handleInput(e: InputEvent & { currentTarget: EditElem }) {
        const target = e.currentTarget;
        props.onChange(target.innerText);
    }

    function handlePaste(e: ClipboardEvent & { currentTarget: EditElem }) {
        e.preventDefault();
        const text = e.clipboardData?.getData("text/plain");
        if (!text) return;

        const selection = window.getSelection();
        if (!selection) return;

        const range = selection.getRangeAt(0);
        const startOffset = range.startOffset;
        const endOffset = range.endOffset;

        const editorText = e.currentTarget.textContent;
        const updatedText = editorText.slice(0, startOffset) + text + editorText.slice(endOffset);

        props.onChange(updatedText);
        if (divRef) divRef.textContent = updatedText;

        // update cursor position
        const newCursorPos = startOffset + text.length;
        const newRange = document.createRange();
        newRange.setStart(e.currentTarget.firstChild || e.currentTarget, newCursorPos);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);
    }

    createEffect(() => {
        if (divRef && divRef.textContent !== props.value) {
            divRef.textContent = props.value;
        }
    });

    return (
        <div
            ref={divRef}
            class={props.className}
            contenteditable="true"
            spellcheck="false"
            onInput={handleInput}
            onPaste={handlePaste}
        />
    );
}
