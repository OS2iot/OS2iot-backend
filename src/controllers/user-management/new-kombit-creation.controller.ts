import { JwtAuthGuard } from "@auth/jwt-auth.guard";
import { AuthenticatedRequest } from "@dto/internal/authenticated-request";
import { ListAllMinimalOrganizationsResponseDto } from "@dto/list-all-organizations-response.dto";
import { ListAllUsersMinimalResponseDto } from "@dto/list-all-users-minimal-response.dto";
import { CreateNewKombitUserDto } from "@dto/user-management/create-new-kombit-user.dto";
import { UpdateUserOrgsDto } from "@dto/user-management/update-user-orgs.dto";
import { UserResponseDto } from "@dto/user-response.dto";
import { ActionType } from "@entities/audit-log-entry";
import { Organization } from "@entities/organization.entity";
import { User } from "@entities/user.entity";
import { ErrorCodes } from "@enum/error-codes.enum";

import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Put,
  Req,
  UseGuards,
} from "@nestjs/common";
import {
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { AuditLog } from "@services/audit-log.service";
import { OrganizationService } from "@services/user-management/organization.service";
import { PermissionService } from "@services/user-management/permission.service";
import { UserService } from "@services/user-management/user.service";
import { ApiAuth } from "@auth/swagger-auth-decorator";
import { checkIfUserHasAccessToUser } from "@helpers/security-helper";

@UseGuards(JwtAuthGuard)
@ApiAuth()
@ApiForbiddenResponse()
@ApiUnauthorizedResponse()
@ApiTags("KombitEmailCreation")
@Controller("kombitCreation")
export class NewKombitCreationController {
  constructor(
    private organizationService: OrganizationService,
    private userService: UserService,
    private permissionService: PermissionService
  ) {}

  @Put("createNewKombitUser")
  @ApiOperation({ summary: "Create kombit-user Email" })
  async newKombitUser(@Req() req: AuthenticatedRequest, @Body() dto: CreateNewKombitUserDto): Promise<User> {
    try {
      const dbUser: User = await this.userService.findOne(req.user.userId);
      const permissions = await this.permissionService.findManyWithRelations(dto.requestedOrganizationIds);

      const requestedOrganizations: Organization[] = await this.organizationService.mapPermissionsToOrganizations(
        permissions
      );

      if (!dbUser.email) {
        // The desired email is already in use for another user (this would also throw an error in the database)
        if (await this.userService.isEmailUsedByAUser(dto.email)) {
          throw new BadRequestException(ErrorCodes.EmailAlreadyInUse);
        }

        const updatedUser: User = await this.userService.newKombitUser(dto, requestedOrganizations, dbUser);

        for (let index = 0; index < dto.requestedOrganizationIds.length; index++) {
          const dbOrg = await this.organizationService.findByIdWithUsers(requestedOrganizations[index].id);

          await this.organizationService.updateAwaitingUsers(dbOrg, updatedUser);
        }

        AuditLog.success(ActionType.UPDATE, User.name, req.user.userId);
        return updatedUser;
      } else {
        throw new BadRequestException(ErrorCodes.EmailAlreadyExists);
      }
    } catch (err) {
      AuditLog.fail(ActionType.UPDATE, User.name, req.user.userId);
      throw err;
    }
  }

  @Get("minimal")
  @ApiOperation({
    summary: "Get list of the minimal representation of organizations, i.e. id and name.",
  })
  async findAllMinimal(): Promise<ListAllMinimalOrganizationsResponseDto> {
    return await this.organizationService.findAllMinimal();
  }

  @Get("minimalUsers")
  @ApiOperation({ summary: "Get all id,names of users" })
  async findAllMinimalUsers(): Promise<ListAllUsersMinimalResponseDto> {
    return await this.userService.findAllMinimal();
  }

  @Put("updateUserOrgs")
  @ApiOperation({ summary: "Updates the users organizations" })
  @ApiNotFoundResponse()
  async updateUserOrgs(
    @Req() req: AuthenticatedRequest,
    @Body() updateUserOrgsDto: UpdateUserOrgsDto
  ): Promise<UpdateUserOrgsDto> {
    try {
      const user = await this.userService.findOne(req.user.userId);
      const permissions = await this.permissionService.findManyWithRelations(
        updateUserOrgsDto.requestedOrganizationIds
      );

      const requestedOrganizations = this.organizationService.mapPermissionsToOrganizations(permissions);

      for (let index = 0; index < requestedOrganizations.length; index++) {
        await this.userService.sendOrganizationRequestMail(user, requestedOrganizations[index]);
      }

      for (const org of requestedOrganizations) {
        const dbOrg = await this.organizationService.findByIdWithUsers(org.id);
        await this.organizationService.updateAwaitingUsers(dbOrg, user);
      }

      AuditLog.success(ActionType.UPDATE, User.name, req.user.userId);
      return updateUserOrgsDto;
    } catch (err) {
      AuditLog.fail(ActionType.UPDATE, User.name, req.user.userId);
      throw err;
    }
  }

  @Get(":id")
  @ApiOperation({ summary: "Get one user" })
  async find(@Req() req: AuthenticatedRequest, @Param("id", new ParseIntPipe()) id: number): Promise<UserResponseDto> {
    let dbUser;

    try {
      dbUser = await this.userService.findOne(id);
    } catch (err) {
      throw new NotFoundException(ErrorCodes.IdDoesNotExists);
    }

    try {
      checkIfUserHasAccessToUser(req, dbUser);

      dbUser.permissions.forEach(perm => {
        delete perm.organization;
      });

      // Don't leak the passwordHash
      const { passwordHash: _, ...user } = dbUser;

      return user;
    } catch (err) {
      throw err;
    }
  }
}
