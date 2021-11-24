import { ApiKey } from "@entities/api-key.entity";
import { forwardRef, Inject, Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { PermissionService } from "../user-management/permission.service";

@Injectable()
export class ApiKeyService {
    constructor(
        @InjectRepository(ApiKey)
        private apiKeyRepository: Repository<ApiKey>,
        @Inject(forwardRef(() => PermissionService))
        private permissionService: PermissionService
    ) {}
    private readonly logger = new Logger(ApiKeyService.name, true);

    async findOne(apiKey: string): Promise<ApiKey> {
        return await this.apiKeyRepository.findOne({
            where: { key: apiKey },
        });
    }
}
