import { Injectable } from "@nestjs/common";
import { AES, enc } from "crypto-js";

@Injectable()
export class EncryptionHelperService {
    private encryptionKey;
    constructor() {
        this.encryptionKey = process.env.ENCRYPTION_SYMMETRIC_KEY || "SecretKey";
    }

    public basicEncrypt(input: string): string {
        return AES.encrypt(input, this.encryptionKey).toString();
    }

    public basicDecrypt(encryptedInput: string): string {
        if (!encryptedInput) {
            return undefined;
        }
        return AES.decrypt(encryptedInput, this.encryptionKey).toString(enc.Utf8);
    }
}
