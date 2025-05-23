import { JwtAuthGuard } from "@auth/jwt-auth.guard";
import { UserAdmin } from "@auth/roles.decorator";
import { RolesGuard } from "@auth/roles.guard";
import { ApiKeyResponseDto } from "@dto/api-key/api-key-response.dto";
import { CreateApiKeyDto } from "@dto/api-key/create-api-key.dto";
import { ListAllApiKeysResponseDto } from "@dto/api-key/list-all-api-keys-response.dto";
import { ListAllApiKeysDto } from "@dto/api-key/list-all-api-keys.dto";
import { DeleteResponseDto } from "@dto/delete-application-response.dto";
import { AuthenticatedRequest } from "@dto/internal/authenticated-request";
import { ApiKey } from "@entities/api-key.entity";
import { ActionType } from "@entities/audit-log-entry";
import { ErrorCodes } from "@enum/error-codes.enum";
import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
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
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { ApiKeyService } from "@services/api-key-management/api-key.service";
import { AuditLog } from "@services/audit-log.service";
import { OrganizationService } from "@services/user-management/organization.service";
import { UpdateApiKeyDto } from "@dto/api-key/update-api-key.dto";
import { checkIfUserHasAccessToOrganization, OrganizationAccessScope } from "@helpers/security-helper";

@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@UserAdmin()
@ApiForbiddenResponse()
@ApiUnauthorizedResponse()
@ApiTags("API Key Management")
@Controller("api-key")
export class ApiKeyController {
  constructor(private apiKeyService: ApiKeyService, private organizationService: OrganizationService) {}

  @Post()
  @ApiOperation({ summary: "Create new API key" })
  async createApiKey(@Req() req: AuthenticatedRequest, @Body() dto: CreateApiKeyDto): Promise<ApiKeyResponseDto> {
    await this.checkIfUserHasAccessToPermissions(req, dto.permissionIds);

    try {
      const result = await this.apiKeyService.create(dto, req.user.userId);

      AuditLog.success(ActionType.CREATE, ApiKey.name, req.user.userId, result.id, result.name);
      return result;
    } catch (err) {
      AuditLog.fail(ActionType.CREATE, ApiKey.name, req.user.userId);
      throw err;
    }
  }

  @Put(":id")
  @ApiOperation({ summary: "Update API key" })
  @ApiBadRequestResponse()
  async updateApiKey(
    @Req() req: AuthenticatedRequest,
    @Param("id", new ParseIntPipe()) id: number,
    @Body() dto: UpdateApiKeyDto
  ): Promise<ApiKeyResponseDto> {
    await this.checkIfUserHasAccessToPermissions(req, dto.permissionIds);

    try {
      const result = await this.apiKeyService.update(id, dto, req.user.userId);

      AuditLog.success(ActionType.UPDATE, ApiKey.name, req.user.userId, result.id, result.name);
      return result;
    } catch (err) {
      AuditLog.fail(ActionType.UPDATE, ApiKey.name, req.user.userId, id);
      throw err;
    }
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete an API key entity" })
  async deleteApiKey(
    @Req() req: AuthenticatedRequest,
    @Param("id", new ParseIntPipe()) id: number
  ): Promise<DeleteResponseDto> {
    try {
      await this.checkIfUserHasAccessToApiKey(req, id);

      const result = await this.apiKeyService.delete(id);

      AuditLog.success(ActionType.DELETE, ApiKey.name, req.user.userId, id);
      return result;
    } catch (err) {
      AuditLog.fail(ActionType.DELETE, ApiKey.name, req.user.userId, id);
      throw err;
    }
  }

  @Get()
  @ApiOperation({ summary: "Get list of all API keys in organization" })
  getAllApiKeysInOrganization(
    @Req() req: AuthenticatedRequest,
    @Query() query: ListAllApiKeysDto
  ): Promise<ListAllApiKeysResponseDto> {
    checkIfUserHasAccessToOrganization(req, query.organizationId, OrganizationAccessScope.UserAdministrationWrite);

    try {
      return this.apiKeyService.findAllByOrganizationId(query);
    } catch (err) {
      throw new NotFoundException(ErrorCodes.IdDoesNotExists);
    }
  }

  @Get(":id")
  @ApiOperation({ summary: "Get API key" })
  @ApiNotFoundResponse()
  async getOneApiKey(
    @Req() req: AuthenticatedRequest,
    @Param("id", new ParseIntPipe()) id: number
  ): Promise<ApiKeyResponseDto> {
    await this.checkIfUserHasAccessToApiKey(req, id);

    try {
      return await this.apiKeyService.findOneByIdWithPermissions(id);
    } catch (err) {
      throw new NotFoundException(ErrorCodes.IdDoesNotExists);
    }
  }

  private async checkIfUserHasAccessToApiKey(req: AuthenticatedRequest, id: number) {
    const apiKey = await this.apiKeyService.findOneByIdWithRelations(id);
    await this.checkIfUserHasAccessToPermissions(
      req,
      apiKey.permissions.map(x => x.id)
    );
  }

  private async checkIfUserHasAccessToPermissions(req: AuthenticatedRequest, permissionIds: number[]) {
    if (!permissionIds?.length) throw new ForbiddenException();

    const apiKeyOrganizations = await this.organizationService.findByPermissionIds(permissionIds);

    for (const id of apiKeyOrganizations.map(org => org.id)) {
      checkIfUserHasAccessToOrganization(req, id, OrganizationAccessScope.UserAdministrationWrite);
    }
  }
}
