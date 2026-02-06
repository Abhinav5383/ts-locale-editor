// assembling templates for locales other than english
const ASSEMBLING_TEMPLATE_DEFAULTS = {
    translation: `import type { Locale } from "~/locales/types";

export default {} satisfies Locale;`,

    tags: `import type tags from "~/locales/en/tags";

export default {} satisfies typeof tags;`,

    about: `import type { AboutUsProps } from "~/locales/en/about";

export const AboutUs = (props: AboutUsProps) => { };`,
};

export function getAssemblingTemplate(
    fileName: string,
    refLocaleCode: string | undefined,
    translatingLocaleCode: string | undefined,
) {
    if (translatingLocaleCode) return translatingLocaleCode;

    return (
        ASSEMBLING_TEMPLATE_DEFAULTS[fileName as keyof typeof ASSEMBLING_TEMPLATE_DEFAULTS] ||
        refLocaleCode ||
        "export default {};"
    );
}
