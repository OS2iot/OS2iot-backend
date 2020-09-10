import {
    Controller,
    Post,
    Request,
    UseGuards,
    Body,
    Get,
} from "@nestjs/common";
import { ApiOperation, ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { LocalAuthGuard } from "./local-auth.guard";
import { LoginDto } from "./login.dto";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { AuthService } from "./auth.service";
import { UserBootstrapperService } from "../user/user-bootstrapper.service";
import { RequestHasAtLeastAUser } from "./has-at-least-user";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
    constructor(private authService: AuthService) {}

    @Post("login")
    @ApiOperation({ summary: "Login using username and password" })
    @UseGuards(LocalAuthGuard)
    async login(@Body() user: LoginDto, @Request() req: any): Promise<any> {
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
