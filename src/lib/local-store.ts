// import type { ObjectNode } from "./types";

// function saveTranslationWork(obj: ObjectNode, locale: string, fileName: string) {}

// function getDbInstance() {
//     const db = window.indexedDB.open("saves", 1);

//     db.onerror = (ev) => {
//         console.error("IndexedDB error:", ev);
//     };

//     db.onupgradeneeded = (ev) => {
//         const evTarget = ev.target;
//         if (!(evTarget instanceof IDBOpenDBRequest)) return;

//         const db = evTarget.result;

//         const objStore = db.createObjectStore("translations", {});
//     };
// }

// function key(locale: string, fileName: string) {
//     return `${locale}/${fileName}`;
// }
