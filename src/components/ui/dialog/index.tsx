import { createEffect, createSignal, type JSX, type Setter } from "solid-js";
import "./styles.css";

interface DialogProps {
    open: boolean;
    onOpenChange: Setter<boolean>;
    children: JSX.Element;
}

export default function Dialog(props: DialogProps) {
    const [dialogRef, setDialogRef] = createSignal<HTMLDialogElement>();

    function handleClose() {
        props.onOpenChange(false);
    }

    createEffect(() => {
        const dialog = dialogRef();
        if (dialog) {
            if (props.open) {
                dialog.showModal();
            } else {
                dialog.close();
            }
        }
    });

    return (
        <dialog ref={setDialogRef} closedby="any" onClose={handleClose}>
            {props.children}
        </dialog>
    );
}
