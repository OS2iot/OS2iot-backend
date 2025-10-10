import {
  Body,
  Controller,
  Get,
  Logger,
  Post,
  Req,
  Request,
  Res,
  UnauthorizedException,
  UseFilters,
  UseGuards,
} from "@nestjs/common";
import { ApiOperation, ApiTags, ApiUnauthorizedResponse } from "@nestjs/swagger";
import * as _ from "lodash";
import * as fs from "fs";

import { JwtAuthGuard } from "@auth/jwt-auth.guard";
import { LocalAuthGuard } from "@auth/local-auth.guard";
import { CurrentUserInfoDto } from "@dto/current-user-info.dto";
import {
  AuthenticatedRequest,
  AuthenticatedRequestKombitStrategy,
  AuthenticatedRequestLocalStrategy,
} from "@dto/internal/authenticated-request";
import { JwtPayloadDto } from "@dto/internal/jwt-payload.dto";
import { LoginDto } from "@dto/login.dto";
import { Organization } from "@entities/organization.entity";
import { User } from "@entities/user.entity";
import { AuthService } from "@services/user-management/auth.service";
import { OrganizationService } from "@services/user-management/organization.service";
import { UserService } from "@services/user-management/user.service";
import { KombitAuthGuard } from "@auth/kombit-auth.guard";
import { Request as expressRequest, Response } from "express";
import { KombitStrategy } from "@auth/kombit.strategy";
import { ErrorCodes } from "@enum/error-codes.enum";
import { CustomExceptionFilter } from "@auth/custom-exception-filter";
import { isOrganizationPermission } from "@helpers/security-helper";
import Configuration from "@config/configuration";
import { ApiAuth } from "@auth/swagger-auth-decorator";
import { RequestWithUser } from "@node-saml/passport-saml/lib/types";

@UseFilters(new CustomExceptionFilter())
@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private organisationService: OrganizationService,
    private strategy: KombitStrategy
  ) {}

  @Get("kombit/login")
  @ApiOperation({ summary: "Initiate login with Kombit adgangsstyring" })
  @UseGuards(KombitAuthGuard)
  async kombitLogin(@Req() req: expressRequest, @Res() res: Response): Promise<any> {
    return res.status(401).send("<h1>Login Failure</h1>");
  }

  @Post("kombit/login/callback")
  @ApiOperation({ summary: "Login callback from Kombit adgangsstyring" })
  @UseGuards(KombitAuthGuard)
  async kombitLoginCallback(@Req() req: AuthenticatedRequestKombitStrategy, @Res() res: Response): Promise<any> {
    const redirectTarget = req.cookies["redirect"];

    // Login without proper roles
    if (!(req.user instanceof User)) {
      if (req.user === ErrorCodes.MissingRole) {
        // Send back to frontend with an error
        if (redirectTarget) {
          return res.redirect(`${redirectTarget}?error=${ErrorCodes.MissingRole}`);
        } else {
          throw new UnauthorizedException(ErrorCodes.MissingRole);
        }
      }
      throw new UnauthorizedException();
    }

    const { nameId, id } = req.user;
    const jwt = await this.authService.issueJwt(nameId, id, true);
    const baseUrl = redirectTarget ? redirectTarget : Configuration()["frontend"]["baseurl"];
    if (!baseUrl.includes("applications")) {
      return res.redirect(`${baseUrl}/applications?jwt=${jwt.accessToken}`);
    }
    return res.redirect(`${baseUrl}?jwt=${jwt.accessToken}`);
  }

  @Get("kombit/logout")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Initiates the SAML logout flow" })
  public async logout(@Req() req: expressRequest, @Res() res: Response): Promise<any> {
    this.logger.debug("Logging out ...");
    const reqConverted: RequestWithUser = req as RequestWithUser;

    // Inspecting the source code (v3.2.1), we gather that
    // - ID is unknown. Might be unused or required for @InResponseTo in saml.js
    // - nameID is used. Corresponds to user.nameId in DB
    // - nameIDFormat is used. Correspond to <NameIDFormat> in the public certificate
    reqConverted.samlLogoutRequest = null; // Property must be set, but it is unused in the source code
    reqConverted.user.nameIDFormat = "urn:oasis:names:tc:SAML:1.1:nameid-format:X509SubjectName";

    this.strategy.logout(reqConverted, (err: Error, url: string): void => {
      req.logout(err1 => {
        this.logger.debug("Inside callback");
        if (Object.keys(err1).length === 0) {
          this.logger.debug("No errors");
          res.redirect(url);
        } else {
          this.logger.error(`Logout failed with error: ${JSON.stringify(err)} and inner Err: ${JSON.stringify(err1)}`);
        }
      });
    });
  }

  @Get("kombit/logout/callback")
  // @UseGuards(KombitAuthGuard)
  @ApiOperation({ summary: "Handles the SAML logout" })
  public async logoutCallback(@Req() req: expressRequest, @Res() res: Response): Promise<void> {
    this.logger.debug("Get callback Logging out ...");
    // This callback openes in a new window for some reason, without sending something to it a timout error happens
    res.send("Logged out ...");
  }

  @Get("kombit/metadata")
  async kombitMetadata(@Res() res: Response): Promise<any> {
    res.set("Content-Type", "text/xml");
    res.send(
      this.strategy.generateServiceProviderMetadata(
        fs.readFileSync("secrets/FOCES_PUBLIC.crt", "utf-8"),
        fs.readFileSync("secrets/FOCES_PUBLIC.crt", "utf-8")
      )
    );
  }

  @Post("login")
  @ApiOperation({ summary: "Login using username and password" })
  @ApiUnauthorizedResponse()
  @UseGuards(LocalAuthGuard)
  async login(@Request() req: AuthenticatedRequestLocalStrategy, @Body() _: LoginDto): Promise<any> {
    const { email, id } = req.user;
    return this.authService.issueJwt(email, id, false);
  }

  @Get("profile")
  @ApiOperation({
    summary: "Return id and username (email) of the user logged in",
  })
  @ApiAuth()
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req: AuthenticatedRequest): Promise<JwtPayloadDto> {
    return {
      sub: req.user.userId,
      username: req.user.username,
    };
  }

  @Get("me")
  @ApiOperation({
    summary: "Get basic info on the current user and the organizations it has some permissions to.",
  })
  @ApiAuth()
  @UseGuards(JwtAuthGuard)
  async getInfoAboutCurrentUser(@Request() req: AuthenticatedRequest): Promise<CurrentUserInfoDto> {
    const user = await this.userService.findOneWithOrganizations(req.user.userId);
    const orgs = await this.getAllowedOrganisations(req, user);
    return {
      user: user,
      organizations: orgs,
    };
  }

  private async getAllowedOrganisations(req: AuthenticatedRequest, user: User): Promise<Organization[]> {
    if (req.user.permissions.isGlobalAdmin) {
      return (await this.organisationService.findAll()).data;
    }

    const orgs = user.permissions.reduce((arr, orgP) => {
      if (isOrganizationPermission(orgP)) {
        arr.push(orgP.organization);
      }
      return arr;
    }, []);
    return _.uniqBy(orgs, x => x.id);
  }
}
