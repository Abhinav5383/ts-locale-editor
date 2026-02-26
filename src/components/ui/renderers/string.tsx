import { createEffect, For, Show } from "solid-js";
import { NodeType, type StringNode } from "~/lib/types";
import type { NodeRendererProps } from "./types";

export function StringRenderer(props: NodeRendererProps<StringNode>) {
    function handleChange(newValue: string) {
        props.onChange(props.path, {
            ...props.node,
            value: newValue,
        });
    }

    const hasNewLine = () => props.node.value.includes("\n");
    const isFullWidth = () => hasNewLine() || props.node.value.length > 60;

    return (
        <div
            class={`node-string ${isFullWidth() ? "full-width" : ""} ${hasNewLine() ? "multiline" : ""}`}
        >
            <Show
                when={props.isEditable}
                fallback={
                    <pre
                        style={{
                            "text-wrap": "wrap",
                            "word-break": "break-word",
                            margin: 0,
                            padding: 0,
                        }}
                        class="token token-string-content"
                    >
                        <StringPreview
                            value={props.node.value}
                            isStrTemplate={props.node.type === NodeType.StringTemplate}
                        />
                        {props.postInlineContent}
                    </pre>
                }
            >
                <ContentEditable
                    value={props.node.value}
                    onChange={handleChange}
                    className="string-editable token token-string-content nowrap-on-multiline"
                />
                {props.postInlineContent}
            </Show>
        </div>
    );
}

function StringPreview(props: { value: string; isStrTemplate: boolean }) {
    return (
        <Show
            when={props.value.includes("\n")}
            fallback={
                <>
                    <span class="token no-select">{props.isStrTemplate ? "`" : '"'}</span>
                    {props.value}
                    <span class="token no-select">{props.isStrTemplate ? "`" : '"'}</span>
                </>
            }
        >
            <For each={props.value.split("\n")}>
                {(line, index) => {
                    const leadingWhitespace = line.match(/^[\t ]+/)?.[0] ?? "";
                    const restOfLine = line.slice(leadingWhitespace.length);
                    const isLastLine = index() === props.value.split("\n").length - 1;

                    return (
                        <span>
                            <Show when={leadingWhitespace.length > 0}>
                                <span
                                    class="whitespace-wrap"
                                    style={{
                                        position: "relative",
                                        display: "inline-block",
                                    }}
                                >
                                    <span
                                        class="whitespace-raw"
                                        style={{
                                            color: "transparent",
                                            "user-select": "text",
                                            "white-space": "pre",
                                        }}
                                    >
                                        {leadingWhitespace}
                                    </span>
                                    <span
                                        class="whitespace-indicator"
                                        style={{
                                            position: "absolute",
                                            left: 0,
                                            top: 0,
                                            color: "var(--gh-text-secondary)",
                                            opacity: 0.5,
                                            "user-select": "none",
                                            "white-space": "pre",
                                            "pointer-events": "none",
                                        }}
                                    >
                                        {leadingWhitespace
                                            .split("")
                                            .map((ch) => (ch === "\t" ? "→" : "␣"))
                                            .join("")}
                                    </span>
                                </span>
                            </Show>
                            {restOfLine}

                            <Show when={!isLastLine}>
                                <span
                                    class="newline-indicator"
                                    style={{
                                        opacity: 0.5,
                                        color: "var(--gh-text-secondary)",
                                        "user-select": "none",
                                        "margin-left": "2px",
                                        "margin-right": "2px",
                                    }}
                                    title="Newline (\n)"
                                >
                                    ↵
                                </span>
                                <br />
                            </Show>
                        </span>
                    );
                }}
            </For>
        </Show>
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
        props.onChange(target.textContent);
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
            divRef.textContent = props.value || "";
        }
    });

    return (
        <div
            ref={divRef}
            class={props.className}
            contenteditable="plaintext-only"
            spellcheck="false"
            onInput={handleInput}
            onPaste={handlePaste}
        />
    );
}
