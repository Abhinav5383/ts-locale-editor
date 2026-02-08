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
    const supportsFancySelect = () => CSS.supports("appearance", "base-select");

    return (
        <Show
            when={supportsFancySelect()}
            fallback={
                <RegularSelect
                    id={props.id}
                    options={props.options}
                    value={props.value}
                    onChange={props.onChange}
                />
            }
        >
            <FancySelect
                id={props.id}
                options={props.options}
                value={props.value}
                onChange={props.onChange}
            />
        </Show>
    );
}

function RegularSelect(props: SelectProps) {
    return (
        <div class="select-wrapper">
            <select
                id={props.id}
                onChange={(e) => {
                    props.onChange(e.currentTarget.value);
                }}
            >
                <For each={props.options}>
                    {(option) => (
                        <option value={option.value} selected={option.value === props.value}>
                            {option.description || option.label || option.value}
                        </option>
                    )}
                </For>
            </select>
        </div>
    );
}

function FancySelect(props: SelectProps) {
    return (
        <div class="select-wrapper">
            <select
                id={props.id}
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
