import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    InternalServerErrorException,
    Param,
    Post,
    Put,
    Query,
    Req,
    UseGuards,
} from "@nestjs/common";
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiOperation,
    ApiProduces,
    ApiTags,
} from "@nestjs/swagger";

import { Read, Write } from "@auth/roles.decorator";
import { RolesGuard } from "@auth/roles.guard";
import { ChirpstackResponseStatus } from "@dto/chirpstack/chirpstack-response.dto";
import { CreateGatewayDto } from "@dto/chirpstack/create-gateway.dto";
import { ListAllGatewaysResponseDto } from "@dto/chirpstack/list-all-gateways.dto";
import { SingleGatewayResponseDto } from "@dto/chirpstack/single-gateway-response.dto";
import { UpdateGatewayDto } from "@dto/chirpstack/update-gateway.dto";
import { ErrorCodes } from "@enum/error-codes.enum";
import { ChirpstackGatewayService } from "@services/chirpstack/chirpstack-gateway.service";
import { checkIfUserHasWriteAccessToOrganization } from "@helpers/security-helper";
import { AuthenticatedRequest } from "@dto/internal/authenticated-request";
import { AuditLog } from "@services/audit-log.service";
import { ActionType } from "@entities/audit-log-entry";
import { ChirpstackGetAll } from "@dto/chirpstack/chirpstack-get-all.dto";
import { ComposeAuthGuard } from "@auth/compose-auth.guard";

@ApiTags("Chirpstack")
@Controller("chirpstack/gateway")
@UseGuards(ComposeAuthGuard, RolesGuard)
@ApiBearerAuth()
@Write()
export class ChirpstackGatewayController {
    constructor(private chirpstackGatewayService: ChirpstackGatewayService) {}

    @Post()
    @ApiProduces("application/json")
    @ApiOperation({ summary: "Create a new Chirpstack Gateway" })
    @ApiBadRequestResponse()
    async create(
        @Req() req: AuthenticatedRequest,
        @Body() dto: CreateGatewayDto
    ): Promise<ChirpstackResponseStatus> {
        checkIfUserHasWriteAccessToOrganization(req, dto.organizationId);
        try {
            const gateway = await this.chirpstackGatewayService.createNewGateway(
                dto,
                req.user.userId
            );
            AuditLog.success(
                ActionType.CREATE,
                "ChirpstackGateway",
                req.user.userId,
                dto.gateway.id,
                dto.gateway.name
            );
            return gateway;
        } catch (err) {
            AuditLog.fail(
                ActionType.CREATE,
                "ChirpstackGateway",
                req.user.userId,
                dto.gateway.id,
                dto.gateway.name
            );
            if (err?.response?.data?.message == "object already exists") {
                throw new BadRequestException(ErrorCodes.IdInvalidOrAlreadyInUse);
            }

            throw new InternalServerErrorException(err);
        }
    }

    @Get()
    @ApiProduces("application/json")
    @ApiOperation({ summary: "List all Chirpstack gateways" })
    @Read()
    async getAll(
        @Query() query?: ChirpstackGetAll
    ): Promise<ListAllGatewaysResponseDto> {
        return await this.chirpstackGatewayService.getAll(
            query.organizationId
        );
    }

    @Get(":gatewayId")
    @ApiProduces("application/json")
    @ApiOperation({ summary: "List all Chirpstack gateways" })
    async getOne(
        @Param("gatewayId") gatewayId: string
    ): Promise<SingleGatewayResponseDto> {
        if (gatewayId?.length != 16) {
            throw new BadRequestException(ErrorCodes.WrongLength);
        }

        if (!/[0-9A-Fa-f]{16}/.test(gatewayId)) {
            throw new BadRequestException(ErrorCodes.NotValidFormat);
        }

        return await this.chirpstackGatewayService.getOne(gatewayId);
    }

    @Put(":gatewayId")
    @ApiProduces("application/json")
    @ApiOperation({ summary: "Create a new Chirpstack Gateway" })
    @ApiBadRequestResponse()
    async update(
        @Req() req: AuthenticatedRequest,
        @Param("gatewayId") gatewayId: string,
        @Body() dto: UpdateGatewayDto
    ): Promise<ChirpstackResponseStatus> {
        try {
            if (dto.gateway.id) {
                throw new BadRequestException(ErrorCodes.GatewayIdNotAllowedInUpdate);
            }
            const gateway = await this.chirpstackGatewayService.modifyGateway(
                gatewayId,
                dto,
                req
            );
            AuditLog.success(
                ActionType.UPDATE,
                "ChirpstackGateway",
                req.user.userId,
                gatewayId,
                dto.gateway.name
            );
            return gateway;
        } catch (err) {
            AuditLog.fail(
                ActionType.UPDATE,
                "ChirpstackGateway",
                req.user.userId,
                gatewayId,
                dto.gateway.name
            );
            throw err;
        }
    }

    @Delete(":gatewayId")
    async delete(
        @Req() req: AuthenticatedRequest,
        @Param("gatewayId") gatewayId: string
    ): Promise<ChirpstackResponseStatus> {
        try {
            const gw = await this.chirpstackGatewayService.getOne(gatewayId);
            if (gw.gateway.internalOrganizationId != null) {
                checkIfUserHasWriteAccessToOrganization(
                    req,
                    +gw.gateway.internalOrganizationId
                );
            }
            const deleteResult = await this.chirpstackGatewayService.deleteGateway(
                gatewayId
            );
            AuditLog.success(
                ActionType.DELETE,
                "ChirpstackGateway",
                req.user.userId,
                gatewayId
            );
            return deleteResult;
        } catch (err) {
            AuditLog.fail(
                ActionType.DELETE,
                "ChirpstackGateway",
                req.user.userId,
                gatewayId
            );
            throw err;
        }
    }
}
