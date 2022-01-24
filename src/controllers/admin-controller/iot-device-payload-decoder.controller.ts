import {
    Controller,
    Get,
    NotFoundException,
    Param,
    ParseIntPipe,
    Query,
    Req,
    UseGuards,
} from "@nestjs/common";
import {
    ApiBearerAuth,
    ApiForbiddenResponse,
    ApiOperation,
    ApiTags,
    ApiUnauthorizedResponse,
} from "@nestjs/swagger";

import { ComposeAuthGuard } from '@auth/compose-auth.guard';
import { Read } from "@auth/roles.decorator";
import { RolesGuard } from "@auth/roles.guard";
import { IoTDeviceService } from "@services/device-management/iot-device.service";
import {
    ListAllIoTDevicesMinimalResponseDto,
    PayloadDecoderIoDeviceMinimalQuery,
} from "@dto/list-all-iot-devices-minimal-response.dto";
import { ErrorCodes } from "@enum/error-codes.enum";
import { AuthenticatedRequest } from "@dto/internal/authenticated-request";

@ApiTags("IoT Device")
@Controller("iot-device/minimalByPayloadDecoder")
@UseGuards(ComposeAuthGuard, RolesGuard)
@ApiBearerAuth()
@Read()
@ApiForbiddenResponse()
@ApiUnauthorizedResponse()
export class IoTDevicePayloadDecoderController {
    constructor(private iotDeviceService: IoTDeviceService) {}

    @Get(":payloadDecoderId")
    @ApiOperation({ summary: "Get IoT-Devices connected to a given payload decoder" })
    async findAllByPayloadDecoder(
        @Req() req: AuthenticatedRequest,
        @Param("payloadDecoderId", new ParseIntPipe()) payloadDecoderId: number,
        @Query() query: PayloadDecoderIoDeviceMinimalQuery
    ): Promise<ListAllIoTDevicesMinimalResponseDto> {
        try {
            return await this.iotDeviceService.findAllByPayloadDecoder(
                req,
                payloadDecoderId,
                +query.limit,
                +query.offset
            );
        } catch (err) {
            throw new NotFoundException(ErrorCodes.IdDoesNotExists);
        }
    }
}
