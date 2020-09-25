import { Controller, Post, Request, UseGuards, Get, Body } from "@nestjs/common";
import {
    ApiOperation,
    ApiBearerAuth,
    ApiTags,
    ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { AuthService } from "@services/user-management/auth.service";
import { LocalAuthGuard } from "@auth/local-auth.guard";
import {
    AuthenticatedRequestLocalStrategy,
    AuthenticatedRequest,
} from "@dto/internal/authenticated-request";
import { LoginDto } from "@dto/login.dto";
import { JwtAuthGuard } from "@auth/jwt-auth.guard";
import { JwtPayloadDto } from "@dto/internal/jwt-payload.dto";
import { UserService } from "@services/user-management/user.service";
import { PermissionType } from "@enum/permission-type.enum";
import { OrganizationPermission } from "@entities/organizion-permission.entity";
import { OrganizationService } from "@services/user-management/organization.service";
import * as _ from "lodash";
import { User } from "@entities/user.entity";
import { Organization } from "@entities/organization.entity";
import { CurrentUserInfoDto } from "@dto/current-user-info.dto";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
    constructor(
        private authService: AuthService,
        private userService: UserService,
        private organisationService: OrganizationService
    ) {}

    @Post("login")
    @ApiOperation({ summary: "Login using username and password" })
    @ApiUnauthorizedResponse()
    @UseGuards(LocalAuthGuard)
    async login(
        @Request() req: AuthenticatedRequestLocalStrategy,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        @Body() body: LoginDto
    ): Promise<any> {
        const { email, id } = req.user;
        return this.authService.issueJwt(email, id);
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
            "Get basic info on the current user and the organisations it has some permissions to.",
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

        const orgs = user.permissions.map(x => {
            if (
                [
                    PermissionType.OrganizationAdmin,
                    PermissionType.Write,
                    PermissionType.Read,
                ].some(p => p == x.type)
            ) {
                return (x as OrganizationPermission).organization;
            }
        });
        return _.uniqBy(orgs, x => x.id);
    }
}
