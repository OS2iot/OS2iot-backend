import {
    Controller,
    Post,
    Request,
    UseGuards,
    Get,
    Body,
} from "@nestjs/common";
import { ApiOperation, ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { LocalAuthGuard } from "./local-auth.guard";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { AuthService } from "./auth.service";
import {
    AuthenticatedRequest,
    AuthenticatedRequestLocalStrategy,
} from "./authenticated-request";
import { LoginDto } from "./login.dto";

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
    async getProfile(@Request() req: AuthenticatedRequest): Promise<any> {
        return {
            userId: req.user.userId,
            email: req.user.username,
        };
    }
}
