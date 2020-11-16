import { Controller, Get, HttpCode, InternalServerErrorException } from "@nestjs/common";
import { ApiInternalServerErrorResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { HealthCheckService } from "@services/health/health-check.service";

@ApiTags("os2iot")
@Controller()
export class DefaultController {
    constructor(private healthCheckService: HealthCheckService) {}

    @Get()
    getDefault(): string {
        return "OS2IoT backend - See /api/v1/docs for Swagger";
    }

    @Get("/heathcheck")
    @ApiOkResponse()
    @ApiInternalServerErrorResponse()
    getHeathCheck(): string {
        const isKafkaOk = this.healthCheckService.isKafkaOk();
        // This is the healthcheck for k8s
        if (!isKafkaOk) {
            throw new InternalServerErrorException("Kafka failed! :'(")
        }
        return "OK";
    }
}
