import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from "@nestjs/common";
import {
    ApiBearerAuth,
    ApiForbiddenResponse,
    ApiOperation,
    ApiTags,
    ApiUnauthorizedResponse,
} from "@nestjs/swagger";

import { JwtAuthGuard } from "@auth/jwt-auth.guard";
import { Read } from "@auth/roles.decorator";
import { RolesGuard } from "@auth/roles.guard";
import { IoTDeviceService } from "@services/device-management/iot-device.service";
import { ListAllIoTDevicesMinimalResponseDto } from "@dto/list-all-iot-devices-minimal-response.dto";

@ApiTags("IoT Device")
@Controller("iot-device/minimalByPayloadDecoder")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Read()
@ApiForbiddenResponse()
@ApiUnauthorizedResponse()
export class IoTDevicePayloadDecoderController {
    constructor(private iotDeviceService: IoTDeviceService) {}

    @Get(":payloadDecoderId")
    @ApiOperation({ summary: "Get IoT-Devices connected to a given payload decoder" })
    async findAllByPayloadDecoder(
        @Param("payloadDecoderId") payloadDecoderId: number
    ): Promise<ListAllIoTDevicesMinimalResponseDto> {
        return await this.iotDeviceService.findAllByPayloadDecoder(
            payloadDecoderId,
            10,
            0
        );
    }
}
