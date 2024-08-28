import { ErrorCodes } from "@enum/error-codes.enum";
import { ExecutionContext, Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Request as expressRequest, Response } from "express";
import { RedirectingException } from "./redirecting-exception";

@Injectable()
export class KombitAuthGuard extends AuthGuard("kombit") {
  constructor() {
    super();
  }

  private readonly logger = new Logger(KombitAuthGuard.name);

  handleRequest(err: any, user: any, info: any, context: ExecutionContext, status: any) {
    if (err || !user) {
      const req: expressRequest = context.switchToHttp().getRequest();
      const res: Response = context.switchToHttp().getResponse();
      const redirectTarget = req.cookies["redirect"];
      this.logger.error(`Login with KOMBIT failed, got error: ${err}`, err);

      if (redirectTarget) {
        const redirectError =
          err?.message == ErrorCodes.UserInactive ? ErrorCodes.UserInactive : ErrorCodes.KOMBITLoginFailed;
        throw new RedirectingException(`${redirectTarget}?error=${redirectError}`);
      } else {
        throw new UnauthorizedException(ErrorCodes.MissingRole);
      }
    }
    return user;
  }
}
