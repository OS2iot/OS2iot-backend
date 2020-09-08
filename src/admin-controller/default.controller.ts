import {
    Controller,
    Request,
    Get,
    HttpCode,
    UseGuards,
    Post,
    Logger,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { LocalAuthGuard } from "../auth/local-auth.guard";
import { AuthService } from "src/auth/auth.service";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";

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

    @UseGuards(LocalAuthGuard)
    @Post("auth/login")
    async login(@Request() req: any): Promise<any> {
        return this.authService.login(req.user);
    }

    @UseGuards(JwtAuthGuard)
    @Get("profile")
    getProfile(@Request() req: any): Promise<any> {
        return req.user;
    }
}
