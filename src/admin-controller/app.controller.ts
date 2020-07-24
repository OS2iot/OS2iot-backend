import { Controller, Get } from "@nestjs/common";
import { AppService } from "@services/app.service";

@Controller()
export class AppController {
    constructor(private readonly appService: AppService) {}

    @Get()
    getDefault(): string {
        return this.appService.getDefault();
    }

    @Get("/heathcheck")
    getHeathCheck(): string {
        // This is the healthcheck for k8s
        // TODO: Check database status?
        return "asdf"
    }
}
