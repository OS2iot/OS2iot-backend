import { join, sep } from "path";

const recurseLimit = 10;
const srcFolder = `${sep}src`;
const buildFolder = `${sep}dist`;

const traverseUpUntilSrcFolder = (currentPath: string, traverseCount = 0): string => {
    const parentFolder = join(currentPath, "..");

    if (traverseCount > recurseLimit || parentFolder === currentPath) {
        return currentPath;
    }

    if (
        currentPath.endsWith(srcFolder) ||
        currentPath.endsWith(`${srcFolder}${sep}`) ||
        currentPath.endsWith(buildFolder) ||
        currentPath.endsWith(`${buildFolder}${sep}`)
    ) {
        return currentPath;
    }

    return traverseUpUntilSrcFolder(parentFolder, ++traverseCount);
};

export const ChirpstackStateTemplatePath = join(
    traverseUpUntilSrcFolder(__dirname),
    "..",
    `resources/chirpstack-state.proto`
);

export const caCertPath = join(traverseUpUntilSrcFolder(__dirname), "..", "resources/ca.crt");

export const caKeyPath = join(traverseUpUntilSrcFolder(__dirname), "..", "resources/ca.key");
