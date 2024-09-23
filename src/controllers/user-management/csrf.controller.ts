import { doubleCsrfUtilities } from "@loaders/nestjs";
import { Controller, Get, Req, Res } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Request, Response } from "express";

@ApiTags("Csrf")
@Controller("csrf")
export class CsrfController {
  constructor() {}

  @Get("token")
  @ApiOperation({ summary: "Get CSRF token" })
  async getCsrfToken(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<{ token: string }> {
    const token = doubleCsrfUtilities.generateToken(req, res);
    return { token: token };
  }
}
