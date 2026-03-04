// assembling templates for locales other than en-GB (default locale)
const ASSEMBLING_TEMPLATE_DEFAULTS = {
    translation: `import type { Locale } from "~/locales/types";\n
export default {} satisfies Locale;`,

    tags: `import type tags from "~/locales/en-GB/tags";\n
export default {} satisfies typeof tags;`,

    about: `import type { AboutUsProps } from "~/locales/en-GB/about";\n
export const AboutUs = (props: AboutUsProps) => \`\`;`,

    terms: `import type { TermsProps } from "~/locales/en-GB/terms";\n
export const TermsOfUse = (props: TermsProps) => \`\`;`,

    security: `import type { SecurityProps } from "~/locales/en-GB/legal/security";\n
export const SecurityNotice = (props: SecurityProps) => \`\`;`,

    rules: `import type { RulesProps } from "~/locales/en-GB/legal/rules";\n
export const Rules = (props: RulesProps) => \`\`;`,

    privacy: `import type { PrivacyProps } from "~/locales/en-GB/legal/privacy";\n
export const PrivacyPolicy = (props: PrivacyProps) => \`\`;`,

    copyright: `import type { CopyrightProps } from "~/locales/en-GB/legal/copyright";\n
export const CopyrightPolicy = (props: CopyrightProps) => \`\`;`,
};

export function getAssemblingTemplate(fileName: string, translatingLocaleCode: string | undefined) {
    if (translatingLocaleCode) return translatingLocaleCode;

    const defaultTemplate =
        ASSEMBLING_TEMPLATE_DEFAULTS[
            fileName.split(".")[0] as keyof typeof ASSEMBLING_TEMPLATE_DEFAULTS
        ];
    return defaultTemplate ?? "export default {};";
}
