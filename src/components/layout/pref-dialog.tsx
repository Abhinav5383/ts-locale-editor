import { batch, createSignal } from "solid-js";
import GearIcon from "~/components/icons/gear-icon";
import Dialog from "~/components/ui/dialog";
import { type PrefsObj, resetPreferences, savePreferences } from "~/lib/preferences";

export interface PreferenceDialogProps {
    currPrefs: PrefsObj;
    setPrefs: (prefs: PrefsObj) => void;
}

export function PreferenceDialog(props: PreferenceDialogProps) {
    const [open, setOpen] = createSignal(false);
    const [repo, setRepo] = createSignal(props.currPrefs.repo);
    const [localesDir, setLocalesDir] = createSignal(props.currPrefs.localesDir);

    function handleSave() {
        const newPrefs = {
            repo: repo(),
            localesDir: localesDir(),
        };

        batch(() => {
            savePreferences(newPrefs);
            props.setPrefs(newPrefs);
            setOpen(false);
        });
    }

    function handleReset() {
        const defaults = resetPreferences();

        batch(() => {
            setRepo(defaults.repo);
            setLocalesDir(defaults.localesDir);

            props.setPrefs(defaults);
            setRepo(props.currPrefs.repo);
        });
    }

    return (
        <div class="preference-dialog">
            <button class="trigger" type="button" onClick={() => setOpen(true)}>
                <GearIcon />
            </button>
            <Dialog open={open()} onOpenChange={setOpen}>
                <div class="pref-settings">
                    <h2 class="title">Preferences</h2>

                    <div class="input-row">
                        <label for="repo">Repo</label>
                        <input
                            id="repo"
                            type="text"
                            value={repo()}
                            onInput={(e) => {
                                setRepo(e.currentTarget.value);
                            }}
                        />
                    </div>

                    <div class="input-row">
                        <label for="localesDir">Locales Directory</label>
                        <input
                            id="localesDir"
                            type="text"
                            value={localesDir()}
                            onInput={(e) => {
                                setLocalesDir(e.currentTarget.value);
                            }}
                        />
                    </div>

                    <div class="action-buttons">
                        <button type="button" onclick={handleReset}>
                            Reset
                        </button>
                        <button type="button" class="primary" onclick={handleSave}>
                            Save changes
                        </button>
                    </div>
                </div>
            </Dialog>
        </div>
    );
}
