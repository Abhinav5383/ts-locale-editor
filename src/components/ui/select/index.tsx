import { For, Show } from "solid-js";
import ChevronDown from "~/components/icons/chevron-down";
import "./styles.css";

interface SelectProps {
    id?: string;
    options: SelectOption[];
    value: string;
    onChange: (value: string) => void;
}

interface SelectOption {
    value: string;
    label?: string;
    description?: string;
}

export function Select(props: SelectProps) {
    return (
        <div id={props.id} class="select-wrapper">
            <select
                onChange={(e) => {
                    props.onChange(e.currentTarget.value);
                }}
            >
                <button type="button" class="select-trigger">
                    {/* @ts-expect-error */}
                    <selectedcontent></selectedcontent>
                    <span class="arrow">
                        <ChevronDown />
                    </span>
                </button>

                <For each={props.options}>
                    {(option) => (
                        <option value={option.value} selected={option.value === props.value}>
                            <div class="opt-content">
                                <span class="opt-label">{option.label ?? option.value}</span>
                                <Show when={option.description}>
                                    <span class="opt-desc">{option.description}</span>
                                </Show>
                            </div>
                        </option>
                    )}
                </For>
            </select>
        </div>
    );
}
