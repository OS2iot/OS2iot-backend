import configuration from "@config/configuration";
import { lstatSync, readFileSync } from "fs";
import { join } from "path";

type CertificateInfo = {
    cert: string;
    id: string;
};

const certTagStart = "<X509Certificate>";
const certTagEnd = "</X509Certificate>";
const entityDescriptorTagStart = "<EntityDescriptor";
const entityDescriptorTagEnd = `">`;
const entityDescriptorIdAttrPrefix = ` ID="`
let cachedCertificate: CertificateInfo | null = null;

/**
 * Temporary, fake certificate
 */
const defaultCert = "temppubcert";
const defaultId = "TEMP-ID";

/**
 * Reads the certificate from the given path. If it has been read successfully before,
 * then the previous value is returned
 * @param relativePath
 * @param ignoreCache
 * @returns
 */
export const readCertFromPath = (
    relativePath: string = configuration()["kombit"]["certificatePublicKeyPath"],
    ignoreCache = false
): CertificateInfo | null => {
    if (!ignoreCache && cachedCertificate) return cachedCertificate;

    try {
        const filePath = join(__dirname, relativePath);

        if (lstatSync(filePath).isFile()) {
            const content = readFileSync(filePath, { encoding: "utf8" });
            const cert = getCert(content);
            const id = getId(content);

            cachedCertificate = { cert, id };
            return cachedCertificate;
        }
    } catch (e) {
        console.error(e);
    }

    return { cert: defaultCert, id: defaultId };
};

const getCert = (fileContent: string): string => {
    const startIndex = fileContent.indexOf(certTagStart);
    const endIndex = fileContent.indexOf(certTagEnd);

    if (startIndex >= 0 && startIndex < endIndex) {
        const cert = fileContent
            .substring(startIndex + certTagStart.length, endIndex)
            .trim();

        return cert;
    }

    return defaultCert;
};

const getId = (fileContent: string): string => {
    const startIndex = fileContent.indexOf(entityDescriptorTagStart);
    const endIndex = fileContent.indexOf(entityDescriptorTagEnd, startIndex);
    const idAttr = fileContent.indexOf(entityDescriptorIdAttrPrefix, startIndex)

    if (startIndex >= 0 && startIndex < endIndex && idAttr < endIndex) {
        const id = fileContent
            .substring(idAttr + entityDescriptorIdAttrPrefix.length, endIndex)
            .trim();

        return id;
    }

    return defaultId
}
