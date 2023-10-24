/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require("fs");
const path = require("path");

function lintFilesAndDirectories(objects) {
    objects.forEach((obj) => {
        const {
            path: basePath,
            directoryRegex,
            regex,
            extensions = [],
            ignoreRegex,
        } = obj;

        fs.readdirSync(basePath).forEach((name) => {
            const fullPath = path.join(basePath, name);

            if (ignoreRegex && ignoreRegex.test(name)) {
                // Ignorieren, wenn der Name zum ignoreRegex passt
                return;
            }

            // teste ob die Dateiendung zu den erlaubten Endungen passt
            const extension = path.extname(name);
            if (!extensions.includes(extension)) {
                // Ignorieren, wenn die Dateiendung nicht zu den erlaubten Endungen passt
                return;
            }

            if (name.includes("[" || "]")) {
                // Ignorieren, wenn der Name eckige Klammern enthält (z.B. [id] bei Nuxt.js)
                return;
            }

            if (fs.statSync(fullPath).isDirectory()) {
                // Überprüfe den Verzeichnisnamen
                if (directoryRegex && !directoryRegex.test(name)) {
                    console.error(
                        `Fehler im Verzeichnis "${fullPath}": Der Name erfüllt nicht den Anforderungen des Verzeichnisregex.`,
                    );
                    process.exit(1);
                }
                // Wenn es sich um ein Verzeichnis handelt, überprüfe die Dateien darin
                lintFilesAndDirectories([
                    { path: fullPath, directoryRegex, regex, extensions, ignoreRegex },
                ]);
            } else {
                // Überprüfe den Dateinamen (ohne Erweiterung)
                let fileNameWithoutExtension;
                // trenne den Dateinamen von der Erweiterung beim ersten Punkt (z.B. "index" bei "index.vue") oder (z.B. "index" bei "index.test.ts")
                if (name.includes(".")) {
                    fileNameWithoutExtension = name.split(".")[0];
                } else {
                    fileNameWithoutExtension = name;
                }

                if (regex && !regex.test(fileNameWithoutExtension)) {
                    console.error(
                        `Fehler in "${fullPath}": Der Dateiname ohne Erweiterung erfüllt nicht den Anforderungen des regex.`,
                    );
                    process.exit(1);
                }
            }
        });
    });
}

const objectsToLint = [
    {
        path: "./pages",
        directoryRegex: /^[a-zA-Z0-9]+(-[a-zA-Z0-9]+)*$/,
        regex: /^[a-zA-Z0-9]+(-[a-zA-Z0-9]+)*$/,
        extensions: [".vue"],
    },
    {
        path: "./server/api",
        directoryRegex: /^[a-zA-Z0-9]+(-[a-zA-Z0-9]+)*$/,
        regex: /^[a-zA-Z0-9]+(-[a-zA-Z0-9]+)*$/,
        extensions: [".ts"],
    },
    {
        path: "./server/middleware",
        directoryRegex: /^[a-zA-Z0-9]+(-[a-zA-Z0-9]+)*$/,
        regex: /^[a-zA-Z0-9]+(-[a-zA-Z0-9]+)*$/,
        extensions: [".ts"],
    },
    {
        path: "./server/Dolphin",
        directoryRegex: /^[A-Z][a-zA-Z0-9]*$/,
        regex: /^[A-Z][a-zA-Z0-9]*$/,
        extensions: [".ts"],
        ignoreRegex: /\.test\.ts$/,
    },
];

lintFilesAndDirectories(objectsToLint);
process.exit(0);
