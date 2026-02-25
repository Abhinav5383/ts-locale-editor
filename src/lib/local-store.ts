import { isEmptyNode } from "~/components/ui/node-updater";
import type { ObjectNode } from "./types";

const DB_VERSION = 1;
const DB_NAME = "saves";
const TRANSLATIONS_STORE = "translations";

const dbInstance = await getDbInstance();

export function saveTranslationWork(obj: ObjectNode, locale: string, fileName: string) {
    const db = dbInstance;
    if (!db) {
        console.error("Database not initialized");
        return;
    }

    const isEmpty = isEmptyNode(obj);

    const transaction = db.transaction(TRANSLATIONS_STORE, "readwrite");
    const store = transaction.objectStore(TRANSLATIONS_STORE);

    const res = isEmpty
        ? store.delete(key(locale, fileName))
        : store.put(obj, key(locale, fileName));

    res.onsuccess = () => {
        console.log("Translation saved successfully");
    };

    res.onerror = (ev) => {
        console.error("Error saving translation:");
        if (res.error) {
            console.error(res.error?.name);
            console.error(res.error?.message);
        } else {
            console.error(ev);
        }
    };
}

export function getSavedTranslation(locale: string, fileName: string): Promise<ObjectNode | null> {
    return new Promise((resolve, reject) => {
        const db = dbInstance;
        if (!db) {
            reject(new Error("Database not initialized"));
            return;
        }

        const transaction = db.transaction(TRANSLATIONS_STORE, "readonly");
        const store = transaction.objectStore(TRANSLATIONS_STORE);

        const req = store.get(key(locale, fileName));
        req.onsuccess = () => {
            resolve(req.result || null);
        };

        req.onerror = () => {
            console.error("Error retrieving translation!");
            resolve(null);
        };
    });
}

export function deleteSavedTranslation(locale: string, fileName: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const db = dbInstance;
        if (!db) {
            reject(new Error("Database not initialized"));
            return;
        }

        const transaction = db.transaction(TRANSLATIONS_STORE, "readwrite");
        const store = transaction.objectStore(TRANSLATIONS_STORE);

        const req = store.delete(key(locale, fileName));
        req.onsuccess = () => {
            resolve();
        };

        req.onerror = () => {
            console.error("Error deleting translation!");
            if (req.error) {
                console.error(req.error.name);
                console.error(req.error.message);
            }
            reject(new Error("Failed to delete translation"));
        };
    });
}

export function deleteAllSaves(): Promise<void> {
    return new Promise((resolve, reject) => {
        const db = dbInstance;
        if (!db) {
            reject(new Error("Database not initialized"));
            return;
        }

        const transaction = db.transaction(TRANSLATIONS_STORE, "readwrite");
        const store = transaction.objectStore(TRANSLATIONS_STORE);

        const req = store.clear();
        req.onsuccess = () => {
            resolve();
        };

        req.onerror = () => {
            console.error("Error clearing translations!");
            if (req.error) {
                console.error(req.error.name);
                console.error(req.error.message);
            }
            reject(new Error("Failed to clear translations"));
        };
    });
}

function getDbInstance(): Promise<IDBDatabase | null> {
    return new Promise((resolve) => {
        const openReq = indexedDB.open(DB_NAME, DB_VERSION);

        openReq.onerror = (ev) => {
            console.error("IndexedDB error:", ev);
            resolve(null);
        };

        openReq.onupgradeneeded = (ev) => {
            const evTarget = ev.target;
            if (!(evTarget instanceof IDBOpenDBRequest)) return;

            const db = evTarget.result;

            // const objStore = db.createObjectStore("translations", {});
            switch (db.version) {
                default:
                    initializeDb(db);
                    break;
            }
        };

        openReq.onblocked = () => {
            alert("Please close other tabs with this site open to allow database upgrade.");
            resolve(null);
        };

        openReq.onsuccess = (ev) => {
            const evTarget = ev.target;
            if (!(evTarget instanceof IDBOpenDBRequest)) return;

            const db = evTarget.result;
            resolve(db);
        };
    });
}

function initializeDb(db: IDBDatabase) {
    db.createObjectStore(TRANSLATIONS_STORE);
}

function key(locale: string, fileName: string) {
    return `${locale}/${fileName}`;
}
