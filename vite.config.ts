import { defineConfig } from "vite";
import solid from "vite-plugin-solid";

export default defineConfig({
    plugins: [solid()],
    resolve: {
        alias: {
            "~": "/src",
        },
    },
    define: {
        process: {
            env: {
                NODE_ENV: "production",
            },
        },
    },
});
