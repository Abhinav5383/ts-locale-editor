/** biome-ignore-all lint/style/noNonNullAssertion: --- */

import { type SearchParams, useSearchParams } from "@solidjs/router";
import { createResource, createSignal, Show } from "solid-js";
import "~/App.css";
import Navbar from "~/components/layout/navbar";
import Editor from "~/components/ui/editor";
import { mergeNodes, updateNodeValue } from "~/components/ui/node-updater";
import type { node_OnEditHandler } from "~/components/ui/renderers/types";
import { getFilesListFromLocale, getLocaleFileContents, getLocalesList } from "~/lib/gh_api";
import { EMPTY_OBJECT_NODE, getTranslationNodesFromTxtFile } from "~/lib/parser";
import { getDefaultLocaleFile, loadPreferences } from "~/lib/preferences";
import { NodeType, type ObjectNode, type TranslationNode } from "~/lib/types";
import { getSavedTranslation, saveTranslationWork } from "./lib/local-store";

interface TranslationNodesResult {
	src: string | undefined;
	nodes: ObjectNode;
}

export default function App() {
	const [preferences, setPreferences] = createSignal(loadPreferences());
	const [localesList] = createResource(preferences, async (prefs) => {
		return await getLocalesList(prefs.repo, prefs.localesDir);
	});
	const [localeFilesList] = createResource(preferences, async (prefs) => {
		return await getFilesListFromLocale(prefs.repo, `${prefs.localesDir}/${prefs.defaultLocale}`);
	});

	const [searchParams, setSearchParams] = useSearchParams();
	const selectedFile = () =>
		getSearchParam(searchParams, "file", getDefaultLocaleFile((localeFilesList() ?? []).map((file) => file.name)));
	function setSelectedFile(file: string) {
		setSearchParams({ file });
	}

	const translatingFrom = () => getSearchParam(searchParams, "from", preferences().defaultLocale);
	function setTranslatingFrom(locale: string) {
		setSearchParams({ from: locale });
	}

	const translatingTo = () => getSearchParam(searchParams, "to", "");
	function setTranslatingTo(locale: string) {
		setSearchParams({ to: locale });
	}

	const refDeps = () => ({
		prefs: preferences(),
		selectedFile: selectedFile(),
		translatingFrom: translatingFrom(),
	});

	const [refLocale] = createResource(refDeps, async (deps): Promise<TranslationNodesResult> => {
		if (!deps.selectedFile) {
			return {
				src: undefined,
				nodes: EMPTY_OBJECT_NODE,
			};
		}

		return await getTranslationNodes(
			deps.prefs.repo,
			`${deps.prefs.localesDir}/${deps.translatingFrom}/${deps.selectedFile}`,
		);
	});

	const translatingTo_Deps = () => ({
		prefs: preferences(),
		selectedFile: selectedFile(),
		translatingTo: translatingTo(),
	});

	const [translatingLocale] = createResource(translatingTo_Deps, async (deps): Promise<TranslationNodesResult> => {
		let result: TranslationNodesResult;

		if (deps.translatingTo) {
			const fetched = await getTranslationNodes(
				deps.prefs.repo,
				`${deps.prefs.localesDir}/${deps.translatingTo}/${deps.selectedFile}`,
			);
			result = fetched;
		} else {
			result = {
				src: undefined,
				nodes: EMPTY_OBJECT_NODE,
			};
		}

		const saved = await getSavedTranslation(deps.translatingTo, deps.selectedFile);
		if (saved) {
			result.nodes = mergeNodes(result.nodes, saved);
			console.log("Loaded saved edits");
		}

		return result;
	});

	const [changedNodes, { mutate: setChangedNodes }] = createResource(translatingTo_Deps, async (deps) => {
		const saved = await getSavedTranslation(deps.translatingTo, deps.selectedFile);
		if (saved) return saved;

		return {
			type: NodeType.Object,
			value: [],
		} as ObjectNode;
	});

	let saveTimeoutRef: number | null = null;
	function saveToLocalStorage(data: ObjectNode, noDelay = false) {
		if (saveTimeoutRef) {
			clearTimeout(saveTimeoutRef);
			saveTimeoutRef = null;
		}

		if (noDelay) {
			saveTranslationWork(data, translatingTo(), selectedFile());
		} else {
			saveTimeoutRef = window.setTimeout(() => {
				saveTranslationWork(data, translatingTo(), selectedFile());
			}, 5_000);
		}
	}

	const handleTranslatingLocaleEdit: node_OnEditHandler = (path: string[], node: TranslationNode) => {
		setChangedNodes((prev) => {
			if (!prev) return prev;
			// NOTE: updates the existing object, if reactivity is needed for this variable return a new Object
			const updated = updateNodeValue(path, prev, node);
			saveToLocalStorage(updated);

			return updated;
		});
	};

	return (
		<main class="main-wrapper">
			<Navbar currPrefs={preferences()} setPrefs={setPreferences} />

			<Show
				when={
					localesList.loading === false &&
					localesList() &&
					localeFilesList.loading === false &&
					localeFilesList() &&
					refLocale.loading === false &&
					refLocale() &&
					translatingLocale.loading === false &&
					translatingLocale() &&
					changedNodes.loading === false &&
					changedNodes()
				}
				fallback={
					<div class="loading">
						<p>Loading...</p>
					</div>
				}
			>
				<Editor
					refLocale={refLocale()!.nodes}
					editingLocaleSrc={translatingLocale()!.src}
					editingLocale={translatingLocale()!.nodes}
					changedNodes={changedNodes()!}
					onEdit={handleTranslatingLocaleEdit}
					preferences={preferences()}
					// select controls
					localesList={localesList()!}
					localeFilesList={localeFilesList()!}
					selectedFile={selectedFile()}
					setSelectedFile={setSelectedFile}
					translatingFrom={translatingFrom()}
					setTranslatingFrom={setTranslatingFrom}
					translatingTo={translatingTo()}
					setTranslatingTo={setTranslatingTo}
				/>
			</Show>

			{/* Errors */}
			<Show when={localesList.error}>
				<p>Error: {localesList.error?.message}</p>
			</Show>

			<Show when={localeFilesList.error}>
				<p>Error: {localeFilesList.error?.message}</p>
			</Show>
		</main>
	);
}

async function getTranslationNodes(repo: string, localeFile: string) {
	const fileContents =
		(await getLocaleFileContents(repo, localeFile).catch((error) => {
			console.error(error);
			return null;
		})) ?? undefined;

	return {
		src: fileContents,
		nodes: getTranslationNodesFromTxtFile(localeFile, fileContents),
	};
}

function getSearchParam(searchParams: SearchParams, key: string, defaultValue: string): string {
	const value = searchParams[key];
	if (typeof value === "string") return value;
	return defaultValue;
}
