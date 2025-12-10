import { extractTranslationsFromObject, getDefaultExportObject } from "./parser";

const code = `
export default {
    greeting: "Hello",
    nested: {
        welcome: "Welcome",
        array: [ "one", "two", "three" ],
        function: (name: string) => \`Hello \${name}\`,
        complexFunction: function(count: number) {
            if (count > 1) {
                return \`\${count} items\`;
            } else {
                return "one item";
            }
        },

        edgeCase: function(param: React.ReactNode) {
            const strVal = typeof param === "string" ? param : "default";
            return \`\${strVal} An edge case\`;
        }
    }
} satisfies Locale;
`;

console.dir(extractTranslationsFromObject(getDefaultExportObject(code)!), { depth: null });
