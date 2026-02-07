import "./navbar.css";
import { PreferenceDialog, type PreferenceDialogProps } from "./pref-dialog";

interface NavbarProps extends PreferenceDialogProps {}

export default function Navbar(props: NavbarProps) {
    return (
        <header class="nav-header">
            <nav>
                <span>&lt;/&gt;</span>

                <PreferenceDialog currPrefs={props.currPrefs} setPrefs={props.setPrefs} />
            </nav>
        </header>
    );
}
