# Locale Editor for JS/TS Translation Files

A web-based editor for managing TypeScript/JavaScript translation (i18n) files. Parse complex translation object structures, edit string values in an intuitive UI, and reassemble the modified code back into valid TS/JS while preserving your existing code structure.

Try it here https://locale-editor.devabhinav.online


## Usage

1. **Configure your repository** in the preferences (gear icon in the navbar):
   - Set the GitHub repository (format: `owner/repo` or `owner/repo/tree/dev` for custom branch)
   - Specify the directory containing your translation files (e.g., `src/locales`)
2. **Select a translation file** to edit from the file selector
3. **Choose reference and target locales**
4. **Edit translations** in the UI
5. **Download your changes** - The editor generates the updated file code which you can copy and commit back to your repository


## Features

- **Parse Complex Structures** - Converts JS/TS translation objects into an interactive editor UI, handling nested objects, functions, arrays, and more
- **Edit Strings Directly** - Modify translation strings without touching the underlying code structure
- **Drag-and-Drop Arrays** - Reorder array items through the UI
- **GitHub Integration** - Fetch and work with translation files directly from your GitHub repositories
- **Function Support** - View function signatures and edit function body code for complex dynamic translations
- **Named & Default Exports** - Works with both `export default` and `export const` style translation files
- Reconstructs translations back into valid JS/TS code, replacing only the export expressions while leaving everything else untouched


## Built With

[<img src="imgs/typescript.svg" height="48px" />](https://www.typescriptlang.org)
[<img src="imgs/solidjs.svg" height="48px" />](https://www.solidjs.com)
[<img src="imgs/babel.svg" height="48px" />](https://babeljs.io)


## How It Works

It utilizes **Babel's AST parser** to extract data from the source files. Below is a summary of how it works:


#### 1. Parsing
Fetches the source file(s) from GitHub and uses Babel to parse that into an AST (abstract syntax tree). \
From there it looks for exports and maps them into an [intermediate representation](src/lib/types.ts) which the editor can work with.

#### 2. Visualization
The editor displays different translation node types with appropriate UI components:

- **Strings** - Editable text fields
- **Objects** - Renders a list of key value pairs where the value is displayed based on its type (string, array etc)
- **Arrays** - Interactive lists with drag-and-drop reordering
- **Functions** - Function signatures shown with editable body content

#### 3. Editing
- Edit string values directly through the UI
- Reorder array items via drag-and-drop
- Edit function body code for complex translations
- All changes are immediately reflected in the UI

#### 4. Reassembly
When done editing, use the `Copy` or `Download` button to export your work. \
(Note: Click "translation" next to the download button to log the assembled output to the browser console instead.)

- Uses the original source file as a template to preserve all non-translation code
- Extracts the position information from the Babel AST
- Replaces only the export expression(s) with the newly assembled output
- Everything else in the file (imports, comments outside the export, etc.) remains unchanged


### Supported Translation Structures

```typescript
// default exports
export default {
    greeting: "Hello",
    nested: {
        greetUser: (name: string) => `Hello, ${name}!`,
        authoredBy: (authorLink: React.ReactNode) => ["Authored by ", authorLink, "."]
    }
}

// named exports
export const AboutPage = (props: AboutPageProps) => `
# About Us
...

Visit our [GitHub page](${props.repoUrl}) for setup instructions.
`;

export const en = {
    name: "English",
    code: "en",
}
```

_In its current state, it doesn't support referenced exports. So defining the object somewhere else and then exporting a variable won't work._



## Development Setup

### Prerequisites
- Bun or Node.js v18+

### Installation

1. Clone the repo:
```bash
git clone https://github.com/Abhinav5383/ts-locale-editor
cd ts-locale-editor
```

2. Install dependencies:
```bash
bun install
```


### Dev server

Start the development server with hot module reloading:

```bash
bun run dev
```

The application will be available at `http://localhost:5173`.


### Build

Create an optimized production build:

```bash
bun run build
```


## Contributing

Contributions are always welcome. Feel free to submit a pull request or open an issue if you find bugs (or for feature requests even).

## Screenshots

<img src="imgs/img1.png" style="max-width: 800px;" />
<img src="imgs/img2.png" style="max-width: 800px;" />
