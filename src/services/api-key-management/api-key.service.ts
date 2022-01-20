import { User } from '@entities/user.entity';
import { ApiKeyResponseDto } from "@dto/api-key/api-key-response.dto";
import { CreateApiKeyDto } from "@dto/api-key/create-api-key.dto";
import { ListAllApiKeysResponseDto } from "@dto/api-key/list-all-api-keys-response.dto";
import { ListAllApiKeysDto } from "@dto/api-key/list-all-api-keys.dto";
import { DeleteResponseDto } from "@dto/delete-application-response.dto";
import { ApiKeyPermission } from "@entities/api-key-permission.entity";
import { ApiKey } from "@entities/api-key.entity";
import { forwardRef, Inject, Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { PermissionService } from "@services/user-management/permission.service";
import { Repository } from "typeorm";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class ApiKeyService {
    constructor(
        @InjectRepository(ApiKey)
        private apiKeyRepository: Repository<ApiKey>,
        @Inject(forwardRef(() => PermissionService))
        private permissionService: PermissionService
    ) {}
    private readonly logger = new Logger(ApiKeyService.name, true);

    findOne(key: string): Promise<ApiKey> {
        return this.apiKeyRepository.findOne({
            where: { key },
			relations: ["systemUser"]
        });
    }

    findOneById(id: number): Promise<ApiKey> {
        return this.apiKeyRepository.findOne({
            where: { id },
        });
    }

    findOneByIdWithPermissions(id: number): Promise<ApiKey> {
        return this.apiKeyRepository.findOne({
            where: { id },
            relations: ["permissions"],
        });
    }

    async findAllByOrganizationId(
        query: ListAllApiKeysDto
    ): Promise<ListAllApiKeysResponseDto> {
        const permIds = (
            await this.permissionService.getAllPermissionsInOrganizations([
                query.organisationId,
            ])
        ).data.map(x => x.id);

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
            dbQuery = dbQuery.orderBy(
                `api_key.${query.orderOn}`,
                query.sort.toUpperCase() as "ASC" | "DESC"
            );
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

		// Create the system user
		const systemUser = new User();
		systemUser.active = false;
		systemUser.isSystemUser = true;
		systemUser.passwordHash = uuidv4(); // Random password, user can never log in
		systemUser.name = apiKey.name;		
		apiKey.systemUser = systemUser;

        if (dto.permissions?.length > 0) {
            const permissionsDb = await this.permissionService.findManyByIds(
                dto.permissions
            );

            apiKey.permissions = permissionsDb.map(
                pm => ({ ...pm, apiKeys: null } as ApiKeyPermission)
            );
        }

        return await this.apiKeyRepository.save(apiKey);
    }

    async delete(id: number): Promise<DeleteResponseDto> {
        const res = await this.apiKeyRepository.delete(id);
        return new DeleteResponseDto(res.affected);
    }
}
