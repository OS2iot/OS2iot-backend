import {
    Controller,
    Post,
    Request,
    UseGuards,
    Get,
    Body,
} from "@nestjs/common";
import { ApiOperation, ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AuthService } from "@services/user-management/auth.service";
import { LocalAuthGuard } from "@auth/local-auth.guard";
import {
    AuthenticatedRequestLocalStrategy,
    AuthenticatedRequest,
} from "@dto/internal/authenticated-request";
import { LoginDto } from "@dto/login.dto";
import { JwtAuthGuard } from "@auth/jwt-auth.guard";
import { JwtPayloadDto } from "@dto/internal/jwt-payload.dto";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
    constructor(private authService: AuthService) {}

    @Post("login")
    @ApiOperation({ summary: "Login using username and password" })
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
    async getProfile(
        @Request() req: AuthenticatedRequest
    ): Promise<JwtPayloadDto> {
        return {
            sub: req.user.userId,
            username: req.user.username,
        };
    }
}
