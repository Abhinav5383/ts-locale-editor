import { GithubIcon } from "~/components/icons/github-icon";
import "./navbar.css";
import { PreferenceDialog, type PreferenceDialogProps } from "./pref-dialog";

interface NavbarProps extends PreferenceDialogProps {}

export default function Navbar(props: NavbarProps) {
    return (
        <header class="nav-header">
            <nav>
                <span>&lt;/&gt;</span>

                <div class="right">
                    <a class="github-link" href="https://github.com/Abhinav5383/ts-locale-editor">
                        <GithubIcon />
                    </a>

                    <PreferenceDialog currPrefs={props.currPrefs} setPrefs={props.setPrefs} />
                </div>
            </nav>
        </header>
    );
}
