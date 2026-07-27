import { AssembleJsonTranslation } from "~/lib/adapters/json/assembler";
import { AssembleTsTranslation } from "~/lib/adapters/ts/assembler";
import type { AssembleTranslationProps } from "~/lib/adapters/utils";

export function AssembleTranslation(props: AssembleTranslationProps): string | null {
    const fileExtension = props.fileName.split(".").pop()?.toLowerCase();

    switch (fileExtension) {
        case "ts":
        case "tsx":
        case "js":
        case "jsx":
            return AssembleTsTranslation(props);

        case "json":
            return AssembleJsonTranslation(props);

        default:
            throw new Error(`Unsupported file extension: ${fileExtension}`);
    }
}
