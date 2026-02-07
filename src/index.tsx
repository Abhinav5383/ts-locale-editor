/* @refresh reload */
import { type RouteDefinition, Router } from "@solidjs/router";
import { render } from "solid-js/web";
import App from "./App.tsx";
import "./globals.css";

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found!");

const routes: RouteDefinition[] = [
    {
        path: "/",
        component: App,
    },
];

render(() => {
    return <Router>{routes}</Router>;
}, root);
