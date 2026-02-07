import { defineConfig } from "vite";
import solid from "vite-plugin-solid";

export default defineConfig({
    plugins: [solid()],

    server: {
        port: 3000,

        proxy: {
            "/PuzzlesHQ": {
                target: "https://raw.githubusercontent.com",
                changeOrigin: true,
                headers: {
                    Accept: "application/vnd.github.v3+json",
                },
            },
        },
    },

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
