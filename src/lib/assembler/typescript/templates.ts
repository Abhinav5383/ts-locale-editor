// assembling templates for locales other than en-US (default locale)
const ASSEMBLING_TEMPLATE_DEFAULTS = {
    translation: `import type { Locale } from "~/locales/types";\n
export default {} satisfies Locale;`,

    tags: `import type tags from "~/locales/en-US/tags";\n
export default {} satisfies typeof tags;`,

    about: `import type { AboutUsProps } from "~/locales/en-US/about";\n
export const AboutUs = (props: AboutUsProps) => \`\`;`,

    terms: `import type { TermsProps } from "~/locales/en-US/terms";\n
export const TermsOfUse = (props: TermsProps) => \`\`;`,

    security: `import type { SecurityProps } from "~/locales/en-US/legal/security";\n
export const SecurityNotice = (props: SecurityProps) => \`\`;`,

    rules: `import type { RulesProps } from "~/locales/en-US/legal/rules";\n
export const Rules = (props: RulesProps) => \`\`;`,

    privacy: `import type { PrivacyProps } from "~/locales/en-US/legal/privacy";\n
export const PrivacyPolicy = (props: PrivacyProps) => \`\`;`,

    copyright: `import type { CopyrightProps } from "~/locales/en-US/legal/copyright";\n
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
