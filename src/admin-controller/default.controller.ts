import {
    Controller,
    Request,
    Get,
    HttpCode,
    UseGuards,
    Post,
    Logger,
    Body,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { LocalAuthGuard } from "../auth/local-auth.guard";
import { AuthService } from "../auth/auth.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { ApiOperation, ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { LoginDto } from "../auth/login.dto";
import { User } from "../entities/user.entity";

@ApiTags("os2iot")
@Controller()
export class DefaultController {
    constructor(private authService: AuthService) {}

    @Get()
    getDefault(): string {
        return "OS2IoT backend - See /api/v1/docs for Swagger";
    }

    @Get("/heathcheck")
    @HttpCode(200)
    getHeathCheck(): string {
        // This is the healthcheck for k8s
        // TODO: Check database status?
        return "OK";
    }

    @Post("auth/login")
    @ApiOperation({ summary: "Login" })
    @UseGuards(LocalAuthGuard)
    async login(@Body() user: LoginDto, @Request() req: any): Promise<any> {
        const { email, id } = req.user;
        return this.authService.issueJwt(email, id);
    }

    @Get("profile")
    @ApiOperation({ summary: "Test login" })
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    getProfile(@Request() req: any): Promise<any> {
        return req.user;
    }
}
