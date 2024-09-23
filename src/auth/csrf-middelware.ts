import { doubleCsrfUtilities } from "@loaders/nestjs";
import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response } from "express";

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: Function): void {
    const valid = doubleCsrfUtilities.validateRequest(req);

    if (!valid && !["GET", "OPTIONS"].includes(req.method)) throw new Error("csrf failed");

    next();
  }
}
