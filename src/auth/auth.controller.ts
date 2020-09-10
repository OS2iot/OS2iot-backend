import { Controller, Post, Request, UseGuards, Get } from "@nestjs/common";
import { ApiOperation, ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { LocalAuthGuard } from "./local-auth.guard";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { AuthService } from "./auth.service";
import { RequestHasAtLeastAUser, RequestHasAtLeastAUserLocalStrategy } from "./has-at-least-user";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
    constructor(private authService: AuthService) {}

    @Post("login")
    @ApiOperation({ summary: "Login using username and password" })
    @UseGuards(LocalAuthGuard)
    async login(
        @Request() req: RequestHasAtLeastAUserLocalStrategy
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
    async getProfile(@Request() req: RequestHasAtLeastAUser): Promise<any> {
        return {
            userId: req.user.userId,
            email: req.user.username,
        };
    }
}
