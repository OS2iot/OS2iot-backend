import {
    Body,
    Controller,
    Get,
    Post,
    Req,
    Res,
    UseGuards,
    Request,
    Logger,
    UnauthorizedException,
    UseFilters,
} from "@nestjs/common";
import {
    ApiBearerAuth,
    ApiOperation,
    ApiTags,
    ApiUnauthorizedResponse,
} from "@nestjs/swagger";
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
import { OrganizationPermission } from "@entities/permissions/organization-permission.entity";
import { User } from "@entities/user.entity";
import { PermissionType } from "@enum/permission-type.enum";
import { AuthService } from "@services/user-management/auth.service";
import { OrganizationService } from "@services/user-management/organization.service";
import { UserService } from "@services/user-management/user.service";
import { KombitAuthGuard } from "@auth/kombit-auth.guard";
import { Request as expressRequest, Response } from "express";
import { KombitStrategy } from "@auth/kombit.strategy";
import { ErrorCodes } from "@enum/error-codes.enum";
import { CustomExceptionFilter } from "@auth/custom-exception-filter";
import { isOrganizationPermission } from "@helpers/security-helper";

@UseFilters(new CustomExceptionFilter())
@ApiTags("Auth")
@Controller("auth")
export class AuthController {
    constructor(
        private authService: AuthService,
        private userService: UserService,
        private organisationService: OrganizationService,
        private strategy: KombitStrategy
    ) {}

    private readonly logger = new Logger(AuthController.name);

    @Get("kombit/login")
    @ApiOperation({ summary: "Initiate login with Kombit adgangsstyring" })
    @UseGuards(KombitAuthGuard)
    async kombitLogin(@Req() req: expressRequest, @Res() res: Response): Promise<any> {
        return res.status(401).send("<h1>Login Failure</h1>");
    }

    @Post("kombit/login/callback")
    @ApiOperation({ summary: "Login callback from Kombit adgangsstyring" })
    @UseGuards(KombitAuthGuard)
    async kombitLoginCallback(
        @Req() req: AuthenticatedRequestKombitStrategy,
        @Res() res: Response
    ): Promise<any> {
        const redirectTarget = req.cookies["redirect"];

        // Login without proper roles
        if (!(req.user instanceof User)) {
            if (req.user == ErrorCodes.MissingRole) {
                // Send back to frontend with an error
                if (redirectTarget) {
                    return res.redirect(
                        `${redirectTarget}?error=${ErrorCodes.MissingRole}`
                    );
                } else {
                    throw new UnauthorizedException(ErrorCodes.MissingRole);
                }
            }
            throw new UnauthorizedException();
        }

        const { nameId, id } = req.user;
        const jwt = await this.authService.issueJwt(nameId, id, true);
        if (redirectTarget) {
            return res.redirect(`${redirectTarget}?jwt=${jwt.accessToken}`);
        }

        return await res.status(201).json(jwt);
    }

    @Get("kombit/logout")
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: "Initiates the SAML logout flow" })
    public async logout(@Req() req: expressRequest, @Res() res: Response): Promise<any> {
        this.logger.debug("Get logout Logging out ...");
        this.strategy.logout(req, (err: Error, url: string): void => {
            req.logout();
            this.logger.debug("Inside callback");
            if (!err) {
                this.logger.debug("No errors");
                res.redirect(url);
            } else {
                this.logger.error(`Logout failed with error: ${JSON.stringify(err)}`);
            }
        });
    }

    @Get("kombit/logout/callback")
    // @UseGuards(KombitAuthGuard)
    @ApiOperation({ summary: "Handles the SAML logout" })
    public async logoutCallback(
        @Req() req: expressRequest,
        @Res() res: Response
    ): Promise<void> {
        this.logger.debug("Get callback Logging out ...");
        req.logout();
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
    async login(
        @Request() req: AuthenticatedRequestLocalStrategy,
        @Body() _: LoginDto
    ): Promise<any> {
        const { email, id } = req.user;
        return this.authService.issueJwt(email, id, false);
    }

    @Get("profile")
    @ApiOperation({
        summary: "Return id and username (email) of the user logged in",
    })
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    async getProfile(@Request() req: AuthenticatedRequest): Promise<JwtPayloadDto> {
        return {
            sub: req.user.userId,
            username: req.user.username,
        };
    }

    @Get("me")
    @ApiOperation({
        summary:
            "Get basic info on the current user and the organizations it has some permissions to.",
    })
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    async getInfoAboutCurrentUser(
        @Request() req: AuthenticatedRequest
    ): Promise<CurrentUserInfoDto> {
        const user = await this.userService.findOneWithOrganizations(req.user.userId);
        const orgs = await this.getAllowedOrganisations(req, user);
        return {
            user: user,
            organizations: orgs,
        };
    }

    private async getAllowedOrganisations(
        req: AuthenticatedRequest,
        user: User
    ): Promise<Organization[]> {
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
