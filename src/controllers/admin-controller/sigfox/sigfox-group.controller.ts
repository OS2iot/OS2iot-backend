import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import {
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiTags,
} from "@nestjs/swagger";

import { ComposeAuthGuard } from "@auth/compose-auth.guard";
import { ApplicationAdmin, Read } from "@auth/roles.decorator";
import { RolesGuard } from "@auth/roles.guard";
import { AuthenticatedRequest } from "@dto/internal/authenticated-request";
import { CreateSigFoxGroupRequestDto } from "@dto/sigfox/internal/create-sigfox-group-request.dto";
import { ListAllSigFoxGroupResponseDto } from "@dto/sigfox/internal/list-all-sigfox-groups-response.dto";
import { SigFoxGetAllRequestDto } from "@dto/sigfox/internal/sigfox-get-all-request.dto";
import { UpdateSigFoxGroupRequestDto } from "@dto/sigfox/internal/update-sigfox-group-request.dto";
import { SigFoxGroup } from "@entities/sigfox-group.entity";
import { SigFoxGroupService } from "@services/sigfox/sigfox-group.service";
import { SigFoxTestResponse } from "@dto/sigfox/internal/sigfox-test-response.dto";
import { GenericSigfoxAdministationService } from "@services/sigfox/generic-sigfox-administation.service";
import { ErrorCodes } from "@enum/error-codes.enum";
import { AuditLog } from "@services/audit-log.service";
import { ActionType } from "@entities/audit-log-entry";
import { checkIfUserHasAccessToOrganization, OrganizationAccessScope } from "@helpers/security-helper";
import { ApiAuth } from "@auth/swagger-auth-decorator";

@ApiTags("SigFox")
@Controller("sigfox-group")
@UseGuards(ComposeAuthGuard, RolesGuard)
@ApiAuth()
@Read()
@ApiForbiddenResponse()
export class SigfoxGroupController {
  constructor(
    private service: SigFoxGroupService,

    private sigfoxApiService: GenericSigfoxAdministationService
  ) {}
  DUPLICATE_KEY_ERROR = "duplicate key value violates unique constraint";

  @Get()
  @ApiProduces("application/json")
  @ApiOperation({ summary: "List all SigFox Groups" })
  @Read()
  async getAll(
    @Req() req: AuthenticatedRequest,
    @Query() query: SigFoxGetAllRequestDto
  ): Promise<ListAllSigFoxGroupResponseDto> {
    checkIfUserHasAccessToOrganization(req, query.organizationId, OrganizationAccessScope.ApplicationRead);
    return await this.service.findAllForOrganization(query.organizationId);
  }

  @Get(":id")
  @ApiProduces("application/json")
  @ApiOperation({ summary: "Get one group by ID" })
  @Read()
  async getOne(@Req() req: AuthenticatedRequest, @Param("id", new ParseIntPipe()) id: number): Promise<SigFoxGroup> {
    let group: SigFoxGroup;
    try {
      group = await this.service.findOne(id);
    } catch (err) {
      return null;
    }
    checkIfUserHasAccessToOrganization(req, group.belongsTo.id, OrganizationAccessScope.ApplicationRead);
    return group;
  }

  @Post()
  @ApiProduces("application/json")
  @ApiOperation({ summary: "Create a SigFox Group connection" })
  @ApiCreatedResponse()
  @ApplicationAdmin()
  async create(@Req() req: AuthenticatedRequest, @Body() query: CreateSigFoxGroupRequestDto): Promise<SigFoxGroup> {
    try {
      checkIfUserHasAccessToOrganization(req, query.organizationId, OrganizationAccessScope.ApplicationWrite);
      const group = await this.service.create(query, req.user.userId);

      AuditLog.success(ActionType.CREATE, SigFoxGroup.name, req.user.userId, group.id);
      return group;
    } catch (err) {
      AuditLog.fail(ActionType.CREATE, SigFoxGroup.name, req.user.userId);
      if (err.message.startsWith(this.DUPLICATE_KEY_ERROR)) {
        throw new BadRequestException(ErrorCodes.GroupCanOnlyBeCreatedOncePrOrganization);
      }
      throw err;
    }
  }

  @Put(":id")
  @ApiProduces("application/json")
  @ApiOperation({ summary: "Update a SigFox Groups" })
  @ApplicationAdmin()
  async update(
    @Req() req: AuthenticatedRequest,
    @Param("id", new ParseIntPipe()) id: number,
    @Body() dto: UpdateSigFoxGroupRequestDto
  ): Promise<SigFoxGroup> {
    let group: SigFoxGroup;
    try {
      group = await this.service.findOneForPermissionCheck(id);
    } catch (err) {
      AuditLog.fail(ActionType.CREATE, SigFoxGroup.name, req.user.userId, id);
      throw new NotFoundException();
    }
    checkIfUserHasAccessToOrganization(req, group.belongsTo.id, OrganizationAccessScope.ApplicationWrite);
    try {
      const changeGroup = await this.service.update(group, dto, req.user.userId);
      AuditLog.success(ActionType.UPDATE, SigFoxGroup.name, req.user.userId, group.id);
      return changeGroup;
    } catch (err) {
      AuditLog.fail(ActionType.CREATE, SigFoxGroup.name, req.user.userId, id);
      if (err.message.startsWith(this.DUPLICATE_KEY_ERROR)) {
        throw new BadRequestException(ErrorCodes.GroupCanOnlyBeCreatedOncePrOrganization);
      }
      throw err;
    }
  }

  @Post("test-connection")
  @ApiOkResponse()
  @HttpCode(200)
  async testConnection(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateSigFoxGroupRequestDto
  ): Promise<SigFoxTestResponse> {
    checkIfUserHasAccessToOrganization(req, dto.organizationId, OrganizationAccessScope.ApplicationWrite);

    const group = new SigFoxGroup();
    group.username = dto.username;
    group.password = dto.password;

    return {
      status: await this.sigfoxApiService.testConnection(group),
    };
  }
}
