import * as fs from "fs";
import { SamlConfig } from "passport-saml";

/**
 *  https://github.com/bergie/passport-saml
 */
const BASE_URL = "https://localhost:8443";

export const samlPassportConf: SamlConfig = {
    // audience: BASEURL + "",
    issuer: "https://localhost:8443/api/v1/auth/kombit/metadata", // `${BASE_URL}/api/v1/auth/kombit/metadata`,

    identifierFormat: "", // "urn:oasis:names:tc:SAML:1.1:nameid-format:X509SubjectName",

    callbackUrl: `${BASE_URL}/api/v1/auth/kombit/login/callback`,
    logoutCallbackUrl: `${BASE_URL}/api/v1/auth/kombit/logout/callback`,
    logoutUrl:
        "https://adgangsstyring.eksterntest-stoettesystemerne.dk/runtime/saml2/issue.idp", //`${BASE_URL}/api/v1/auth/kombit/logout`,
    entryPoint:
        "https://adgangsstyring.eksterntest-stoettesystemerne.dk/runtime/saml2/issue.idp",
    privateCert: fs.readFileSync("secrets/FOCES_PRIVATE_NO_PASSWORD.pem", "utf-8"),
    decryptionPvk: fs.readFileSync("secrets/FOCES_PRIVATE_NO_PASSWORD.pem", "utf-8"),

    signatureAlgorithm: "sha256",
    disableRequestedAuthnContext: true,
    // forceAuthn: false,
    authnRequestBinding: "HTTP-Redirect",
    // RACComparison: "minimum",
    // passive: false,
};
