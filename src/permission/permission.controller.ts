import { Controller, Logger, Post, Body, Put, Param } from "@nestjs/common";
import { PermissionService } from "./permission.service";
import { ApiOperation } from "@nestjs/swagger";
import { Permission } from "@entities/permission.entity";
import { CreatePermissionDto } from "./create-permission.dto";
import { UpdatePermissionDto } from "./update-permission.dto";

@Controller("permission")
export class PermissionController {
    constructor(private permissionService: PermissionService) {}
    private readonly logger = new Logger(PermissionController.name);

    @Post()
    @ApiOperation({ summary: "" })
    async createPermission(
        @Body() dto: CreatePermissionDto
    ): Promise<Permission> {
        return this.permissionService.createNewPermission(dto);
    }

    @Put(":id")
    @ApiOperation({ summary: "Update permission" })
    async updatePermission(
        @Param("id") id: number,
        @Body() dto: UpdatePermissionDto
    ): Promise<Permission> {
        return this.permissionService.updatePermission(id, dto);
    }
}
