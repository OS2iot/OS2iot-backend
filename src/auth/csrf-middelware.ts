import { doubleCsrfUtilities } from "@loaders/nestjs";
import { Injectable, Logger, NestMiddleware } from "@nestjs/common";
import { Request, Response } from "express";

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  // eslint-disable-next-line @typescript-eslint/ban-types
  use(req: Request, res: Response, next: Function): void {
    const valid = doubleCsrfUtilities.validateRequest(req);

    if (!valid) throw new Error("csrf");

    next();
  }
}
