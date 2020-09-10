import { Controller, Get, HttpCode } from "@nestjs/common";
import { AuthService } from "../auth/auth.service";
import { ApiTags } from "@nestjs/swagger";

@ApiTags("os2iot")
@Controller()
export class DefaultController {
    constructor() {}

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
}
