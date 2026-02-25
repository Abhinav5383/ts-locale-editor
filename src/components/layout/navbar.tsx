import { createEffect, createSignal, onCleanup, onMount } from "solid-js";
import { GithubIcon } from "~/components/icons/github-icon";
import MoonIcon from "~/components/icons/moon-icon";
import SunIcon from "~/components/icons/sun-icon";
import CursorIcon from "../icons/cursor";
import "./navbar.css";
import { PreferenceDialog, type PreferenceDialogProps } from "./pref-dialog";

interface NavbarProps extends PreferenceDialogProps {}

export default function Navbar(props: NavbarProps) {
    const [theme, setTheme] = createSignal<Theme>(getInitialTheme());

    function toggleTheme() {
        const next = theme() === "dark" ? "light" : "dark";
        setTheme(next);
    }

    createEffect(() => {
        applyTheme(theme());
    });

    const match = window.matchMedia("(prefers-color-scheme: dark)");
    function handleChange(e: MediaQueryListEvent) {
        setTheme(e.matches ? "dark" : "light");
    }

    onMount(() => {
        match.addEventListener("change", handleChange);

        onCleanup(() => {
            match.removeEventListener("change", handleChange);
        });
    });

    return (
        <header class="nav-header">
            <nav>
                <div class="site-title">
                    <CursorIcon />
                    <span>Locale Editor</span>
                </div>

                <div class="right">
                    <a class="github-link" href="https://github.com/Abhinav5383/ts-locale-editor">
                        <GithubIcon />
                    </a>

                    <button
                        type="button"
                        class="theme-toggle"
                        onClick={toggleTheme}
                        aria-label={
                            theme() === "dark" ? "Switch to light mode" : "Switch to dark mode"
                        }
                    >
                        {theme() === "dark" ? <SunIcon /> : <MoonIcon />}
                    </button>

                    <PreferenceDialog currPrefs={props.currPrefs} setPrefs={props.setPrefs} />
                </div>
            </nav>
        </header>
    );
}

type Theme = "dark" | "light";

function getInitialTheme(): Theme {
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function applyTheme(theme: Theme) {
    if (theme === "light") {
        document.documentElement.setAttribute("data-theme", "light");
    } else {
        document.documentElement.removeAttribute("data-theme");
    }
}
