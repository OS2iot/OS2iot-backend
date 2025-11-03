import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  InternalServerErrorException,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiBadRequestResponse, ApiOperation, ApiProduces, ApiTags } from "@nestjs/swagger";

import { GatewayAdmin, Read } from "@auth/roles.decorator";
import { RolesGuard } from "@auth/roles.guard";
import { ChirpstackResponseStatus } from "@dto/chirpstack/chirpstack-response.dto";
import { CreateGatewayDto } from "@dto/chirpstack/create-gateway.dto";
import { SingleGatewayResponseDto } from "@dto/chirpstack/single-gateway-response.dto";
import { UpdateGatewayDto, UpdateGatewayOrganizationDto } from "@dto/chirpstack/update-gateway.dto";
import { ErrorCodes } from "@enum/error-codes.enum";
import { ChirpstackGatewayService } from "@services/chirpstack/chirpstack-gateway.service";
import { checkIfUserHasAccessToOrganization, OrganizationAccessScope } from "@helpers/security-helper";
import { AuthenticatedRequest } from "@dto/internal/authenticated-request";
import { AuditLog } from "@services/audit-log.service";
import { ActionType } from "@entities/audit-log-entry";
import { ComposeAuthGuard } from "@auth/compose-auth.guard";
import { ApiAuth } from "@auth/swagger-auth-decorator";
import { ListAllGatewaysDto } from "@dto/chirpstack/list-all-gateways.dto";
import { ListAllGatewaysResponseDto } from "@dto/chirpstack/list-all-gateways-response.dto";
import { Gateway as DbGateway } from "@entities/gateway.entity";

@ApiTags("Chirpstack")
@Controller("chirpstack/gateway")
@UseGuards(ComposeAuthGuard, RolesGuard)
@ApiAuth()
export class ChirpstackGatewayController {
  constructor(private chirpstackGatewayService: ChirpstackGatewayService) {}

  @Post()
  @ApiProduces("application/json")
  @ApiOperation({ summary: "Create a new Chirpstack Gateway" })
  @ApiBadRequestResponse()
  @GatewayAdmin()
  async create(@Req() req: AuthenticatedRequest, @Body() dto: CreateGatewayDto): Promise<ChirpstackResponseStatus> {
    checkIfUserHasAccessToOrganization(req, dto.organizationId, OrganizationAccessScope.GatewayWrite);
    this.chirpstackGatewayService.validatePackageAlarmInput(dto);
    try {
      const gateway = await this.chirpstackGatewayService.createNewGateway(dto, req.user.userId);
      AuditLog.success(
        ActionType.CREATE,
        "ChirpstackGateway",
        req.user.userId,
        dto.gateway.gatewayId,
        dto.gateway.name
      );
      return gateway;
    } catch (err) {
      AuditLog.fail(ActionType.CREATE, "ChirpstackGateway", req.user.userId, dto.gateway.gatewayId, dto.gateway.name);
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
  async getAll(@Query() query?: ListAllGatewaysDto): Promise<ListAllGatewaysResponseDto> {
    return await this.chirpstackGatewayService.getWithPaginationAndSorting(query, query.organizationId);
  }

  @Get("getAllForMaps")
  @ApiProduces("application/json")
  @ApiOperation({ summary: "List all Chirpstack gateways for maps" })
  @Read()
  async getAllForMaps(@Query() query?: ListAllGatewaysDto): Promise<ListAllGatewaysResponseDto> {
    return await this.chirpstackGatewayService.getForMaps(query.organizationId);
  }

  @Get(":gatewayId")
  @ApiProduces("application/json")
  @ApiOperation({ summary: "Single Chirpstack gateway" })
  @Read()
  async getOne(@Param("gatewayId") gatewayId: string): Promise<SingleGatewayResponseDto> {
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
  @ApiOperation({ summary: "Updates a Chirpstack Gateway" })
  @ApiBadRequestResponse()
  @GatewayAdmin()
  async update(
    @Req() req: AuthenticatedRequest,
    @Param("gatewayId") gatewayId: string,
    @Body() dto: UpdateGatewayDto
  ): Promise<ChirpstackResponseStatus> {
    try {
      this.chirpstackGatewayService.validatePackageAlarmInput(dto);
      if (dto.gateway.gatewayId) {
        throw new BadRequestException(ErrorCodes.GatewayIdNotAllowedInUpdate);
      }
      const gateway = await this.chirpstackGatewayService.modifyGateway(gatewayId, dto, req);
      AuditLog.success(ActionType.UPDATE, "ChirpstackGateway", req.user.userId, gatewayId, dto.gateway.name);
      return gateway;
    } catch (err) {
      AuditLog.fail(ActionType.UPDATE, "ChirpstackGateway", req.user.userId, gatewayId, dto.gateway.name);
      throw err;
    }
  }

  @Put("updateGatewayOrganization/:id")
  @ApiProduces("application/json")
  @ApiOperation({ summary: "Update gateway organization" })
  @ApiBadRequestResponse()
  @GatewayAdmin()
  async changeOrganization(
    @Req() req: AuthenticatedRequest,
    @Param("id", new ParseIntPipe()) id: number,
    @Body() dto: UpdateGatewayOrganizationDto
  ): Promise<DbGateway> {
    try {
      checkIfUserHasAccessToOrganization(req, dto.organizationId, OrganizationAccessScope.GatewayWrite);
      const gateway = await this.chirpstackGatewayService.changeOrganization(id, dto);
      AuditLog.success(ActionType.UPDATE, "ChirpstackGateway", req.user.userId, id, gateway.name);
      return gateway;
    } catch (error) {
      AuditLog.fail(ActionType.UPDATE, "ChirpstackGateway", req.user.userId, id);
      throw error;
    }
  }

  @Delete(":gatewayId")
  @GatewayAdmin()
  async delete(
    @Req() req: AuthenticatedRequest,
    @Param("gatewayId") gatewayId: string
  ): Promise<ChirpstackResponseStatus> {
    try {
      const gw = await this.chirpstackGatewayService.getOne(gatewayId);
      if (gw.gateway.organizationId != null) {
        checkIfUserHasAccessToOrganization(req, +gw.gateway.organizationId, OrganizationAccessScope.GatewayWrite);
      }
      const deleteResult = await this.chirpstackGatewayService.deleteGateway(gatewayId);
      AuditLog.success(ActionType.DELETE, "ChirpstackGateway", req.user.userId, gatewayId);
      return deleteResult;
    } catch (err) {
      AuditLog.fail(ActionType.DELETE, "ChirpstackGateway", req.user.userId, gatewayId);
      throw err;
    }
  }
}
