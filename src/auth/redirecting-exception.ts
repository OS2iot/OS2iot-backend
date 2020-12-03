import { HttpException } from "@nestjs/common";

export class RedirectingException extends HttpException {
    constructor(public url: string) {
        super("Redirect to " + url, 302);
    }
}
