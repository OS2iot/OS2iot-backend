import { Injectable } from "@nestjs/common";
import * as fs from "fs";
import { encryptionKey } from "@resources/resource-paths";
import { AES, enc } from "crypto-js";

@Injectable()
export class EncryptionHelperService {
    public basicEncrypt(input: string): string {
        const key = fs.readFileSync(encryptionKey).toString();
        return AES.encrypt(input, key).toString();
    }

    public basicDecrypt(encryptedInput: string): string {
        if (!encryptedInput) {
            return undefined;
        }
        const key = fs.readFileSync(encryptionKey).toString();
        return AES.decrypt(encryptedInput, key).toString(enc.Utf8);
    }
}
