// assembling templates for locales other than english
const ASSEMBLING_TEMPLATE_DEFAULTS = {
    translation: `import type { Locale } from "~/locales/types";\n
export default {} satisfies Locale;`,

    tags: `import type tags from "~/locales/en-US/tags";\n
export default {} satisfies typeof tags;`,

    about: `import type { AboutUsProps } from "~/locales/en-US/about";\n
export const AboutUs = (props: AboutUsProps) => \`\`;`,

    terms: `import type { TermsProps } from "~/locales/en-US/terms";\n
export const TermsOfUse = (props: TermsProps) => \`\`;`,
};

export function getAssemblingTemplate(fileName: string, translatingLocaleCode: string | undefined) {
    if (translatingLocaleCode) return translatingLocaleCode;

    const defaultTemplate =
        ASSEMBLING_TEMPLATE_DEFAULTS[
            fileName.split(".")[0] as keyof typeof ASSEMBLING_TEMPLATE_DEFAULTS
        ];
    return defaultTemplate ?? "export default {};";
}
