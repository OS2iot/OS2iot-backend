import { User } from "@entities/user.entity";
import { ApiKeyResponseDto } from "@dto/api-key/api-key-response.dto";
import { CreateApiKeyDto } from "@dto/api-key/create-api-key.dto";
import { ListAllApiKeysResponseDto } from "@dto/api-key/list-all-api-keys-response.dto";
import { ListAllApiKeysDto } from "@dto/api-key/list-all-api-keys.dto";
import { DeleteResponseDto } from "@dto/delete-application-response.dto";
import { ApiKey } from "@entities/api-key.entity";
import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { PermissionService } from "@services/user-management/permission.service";
import { Repository } from "typeorm";
import { v4 as uuidv4 } from "uuid";
import { UpdateApiKeyDto } from "@dto/api-key/update-api-key.dto";
import { nameof } from "@helpers/type-helper";

@Injectable()
export class ApiKeyService {
  constructor(
    @InjectRepository(ApiKey)
    private apiKeyRepository: Repository<ApiKey>,
    @Inject(forwardRef(() => PermissionService))
    private permissionService: PermissionService
  ) {}

  findOne(key: string): Promise<ApiKey> {
    return this.apiKeyRepository.findOne({
      where: { key },
      relations: ["systemUser"],
    });
  }

  findOneByIdWithPermissions(id: number): Promise<ApiKey> {
    return this.apiKeyRepository.findOne({
      where: { id },
      relations: [nameof<ApiKey>("permissions")],
    });
  }

  findOneByIdWithRelations(id: number): Promise<ApiKey> {
    return this.apiKeyRepository.findOne({
      where: { id },
      relations: [nameof<ApiKey>("permissions"), nameof<ApiKey>("systemUser")],
    });
  }

  async findAllByOrganizationId(query: ListAllApiKeysDto): Promise<ListAllApiKeysResponseDto> {
    const permIds = (await this.permissionService.getAllPermissionsInOrganizations([query.organizationId])).data.map(
      x => x.id
    );

    let dbQuery = this.apiKeyRepository
      .createQueryBuilder("api_key")
      .innerJoinAndSelect("api_key.permissions", "perm")
      .innerJoinAndSelect("perm.organization", "org")
      .take(query.limit ? +query.limit : 100)
      .skip(query.offset ? +query.offset : 0);

    if (permIds.length) {
      dbQuery = dbQuery.where("perm.id IN (:...permIds)", { permIds });
    }

    if (query.orderOn && query.sort) {
      dbQuery = dbQuery.orderBy(`api_key.${query.orderOn}`, query.sort.toUpperCase() as "ASC" | "DESC", "NULLS LAST");
    }

    const [data, count] = await dbQuery.getManyAndCount();

    return {
      data,
      count,
    };
  }

  async create(dto: CreateApiKeyDto, userId: number): Promise<ApiKeyResponseDto> {
    // Create the key
    const apiKey = new ApiKey();
    apiKey.key = uuidv4();
    apiKey.name = dto.name;
    apiKey.updatedBy = userId;
    apiKey.createdBy = userId;
    apiKey.expiresOn = dto.expiresOn;

    // Create the system user
    const systemUser = new User();
    systemUser.active = false;
    systemUser.isSystemUser = true;
    systemUser.passwordHash = uuidv4(); // Random password, user can never log in
    systemUser.name = apiKey.name;
    systemUser.expiresOn = dto.expiresOn;
    apiKey.systemUser = systemUser;

    if (dto.permissionIds?.length > 0) {
      const permissionsDb = await this.permissionService.findManyByIds(dto.permissionIds);

      apiKey.permissions = permissionsDb.map(pm => ({ ...pm, apiKeys: null }));
    }

    return await this.apiKeyRepository.save(apiKey);
  }

  async update(id: number, dto: UpdateApiKeyDto, userId: number): Promise<ApiKeyResponseDto> {
    const apiKey = await this.findOneByIdWithRelations(id);
    apiKey.name = dto.name;
    apiKey.updatedBy = userId;
    apiKey.expiresOn = dto.expiresOn;

    if (dto.permissionIds?.length) {
      const permissionsDb = await this.permissionService.findManyByIds(dto.permissionIds);
      apiKey.permissions = permissionsDb.map(pm => ({
        ...pm,
        apiKeys: [],
      }));
    }

    if (dto.name !== apiKey.name) {
      apiKey.systemUser.name = dto.name;
      apiKey.name = dto.name;
    }

    return await this.apiKeyRepository.save(apiKey);
  }

  async delete(id: number): Promise<DeleteResponseDto> {
    const res = await this.apiKeyRepository.delete(id);
    return new DeleteResponseDto(res.affected);
  }
}
