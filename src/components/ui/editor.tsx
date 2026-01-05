import type { ObjectNode } from "~/lib/types";

interface EditorProps {
    refLocale: ObjectNode; // the base reference locale
    editLocale: ObjectNode; // the locale being edited
}

export default function Editor(props: EditorProps) {
    return <div class="editor-wrapper"></div>;
}
