import { Injectable, Logger, NestMiddleware } from "@nestjs/common";
import { Request, Response } from "express";

@Injectable()
export class HandleRedirectUrlParameterMiddleware implements NestMiddleware {
    // eslint-disable-next-line @typescript-eslint/ban-types
    use(req: Request, res: Response, next: Function): void {
        const redirectParam = req.query["redirect"];
        if (redirectParam) {
            Logger.debug(`Has 'redirect' param: ${redirectParam}`);
            res.cookie("redirect", redirectParam, {
                expires: new Date(Date.now() + 900000),
            });
        }

        next();
    }
}
