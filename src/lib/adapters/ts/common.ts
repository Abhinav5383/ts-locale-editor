import * as t from "@babel/types";
import { ExportType } from "~/lib/types";
import { type ExportItem, unwrapExpression } from "./parser";

export function getExportItemIdentifier(item: ExportItem) {
    const decl = unwrapExpression(item.decl);

    if (t.isFunctionDeclaration(decl)) {
        return decl.id ? decl.id.name : ExportType.Default;
    } else if (t.isVariableDeclaration(decl)) {
        for (const declarator of decl.declarations) {
            const initializer = declarator.init ? unwrapExpression(declarator.init) : null;
            if (!t.isIdentifier(declarator.id) || !initializer) return null;

            return declarator.id.name;
        }
    }

    return ExportType.Default;
}
