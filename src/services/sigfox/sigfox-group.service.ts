import {
    BadRequestException,
    Inject,
    Injectable,
    Logger,
    UnauthorizedException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { CreateSigFoxGroupRequestDto } from "@dto/sigfox/internal/create-sigfox-group-request.dto";
import { ListAllSigFoxGroupResponseDto } from "@dto/sigfox/internal/list-all-sigfox-groups-response.dto";
import { UpdateSigFoxGroupRequestDto } from "@dto/sigfox/internal/update-sigfox-group-request.dto";
import { SigFoxGroup } from "@entities/sigfox-group.entity";
import { OrganizationService } from "@services/user-management/organization.service";
import { ErrorCodes } from "@enum/error-codes.enum";
import { SigfoxApiGroupService } from "@services/sigfox/sigfox-api-group.service";
import { GenericSigfoxAdministationService } from "./generic-sigfox-administation.service";

@Injectable()
export class SigFoxGroupService {
    constructor(
        @InjectRepository(SigFoxGroup)
        private repository: Repository<SigFoxGroup>,
        @Inject(OrganizationService)
        private organizationService: OrganizationService,
        private sigfoxApiGroupService: SigfoxApiGroupService,
        private genericSigfoxAdministationService: GenericSigfoxAdministationService
    ) {}

    private readonly logger = new Logger(SigFoxGroupService.name);

    async findAll(): Promise<SigFoxGroup[]> {
        return await this.repository.find({
            select: ["username", "password"],
        });
    }

    async findAllForOrganization(
        organizationId: number
    ): Promise<ListAllSigFoxGroupResponseDto> {
        const [data, count] = await this.repository.findAndCount({
            where: {
                belongsTo: {
                    id: organizationId,
                },
            },
            select: ["username", "password", "id"],
            relations: ["belongsTo"],
        });

        // TODO: Find a better way to do this
        //  - Deduplicate lookups at least.
        await this.addSigFoxDataToAllGroupsAndSave(data);

        return {
            data: data,
            count: count,
        };
    }

    private async addSigFoxDataToAllGroupsAndSave(data: SigFoxGroup[]) {
        await Promise.all(data.map(async x => await this.addSigFoxDataToGroupAndSave(x)));
    }

    private async addSigFoxDataToGroupAndSave(group: SigFoxGroup) {
        // if password was not included, then include it now.
        if (group.password == null) {
            group = await this.findOneWithPassword(group.id);
        }
        let apiGroupResponse;
        try {
            apiGroupResponse = await this.sigfoxApiGroupService.getGroups(group);
        } catch (err) {
            this.logger.warn(`Got error from SigFox: ${err?.response?.error}`);
            group.sigfoxGroupData = null;
            return group;
        }
        if (apiGroupResponse.data.length > 1) {
            this.logger.warn(`API user ${group.id} has access to more than one group`);
        }
        const firstGroup = apiGroupResponse.data[0];
        group.sigfoxGroupData = firstGroup;
        group.sigfoxGroupId = group.sigfoxGroupData.id;
        await this.repository.save(group);
        // remove password again ...
        group.password = undefined;
    }

    async findOne(id: number): Promise<SigFoxGroup> {
        const res = await this.findOneWithPassword(id);

        await this.addSigFoxDataToAllGroupsAndSave([res]);

        return res;
    }

    async findOneForPermissionCheck(id: number): Promise<SigFoxGroup> {
        return await this.repository.findOneOrFail(id, {
            relations: ["belongsTo"],
            select: ["username", "sigfoxGroupId", "id"],
        });
    }

    async findOneWithPassword(id: number): Promise<SigFoxGroup> {
        return await this.repository.findOneOrFail(id, {
            relations: ["belongsTo"],
            select: ["username", "password", "sigfoxGroupId", "id"],
        });
    }

    async findOneByGroupId(groupId: string): Promise<SigFoxGroup> {
        return await this.repository.findOneOrFail({
            where: { sigfoxGroupId: groupId },
            relations: ["belongsTo"],
            select: ["id", "username", "password", "sigfoxGroupId"],
        });
    }

    async create(query: CreateSigFoxGroupRequestDto): Promise<SigFoxGroup> {
        const sigfoxGroup = new SigFoxGroup();
        try {
            sigfoxGroup.belongsTo = await this.organizationService.findById(
                query.organizationId
            );
        } catch (err) {
            throw new BadRequestException(ErrorCodes.OrganizationDoesNotExists);
        }

        const res = await this.map(sigfoxGroup, query);
        await this.addSigFoxDataToAllGroupsAndSave([res]);
        return res;
    }

    async update(
        sigfoxGroup: SigFoxGroup,
        query: UpdateSigFoxGroupRequestDto
    ): Promise<SigFoxGroup> {
        const res = await this.map(sigfoxGroup, query);
        await this.addSigFoxDataToAllGroupsAndSave([res]);
        return res;
    }

    private async map(
        sigfoxGroup: SigFoxGroup,
        query: UpdateSigFoxGroupRequestDto
    ): Promise<SigFoxGroup> {
        sigfoxGroup.username = query.username;
        sigfoxGroup.password = query.password;

        // Test that new credentials are good.
        if (!(await this.genericSigfoxAdministationService.testConnection(sigfoxGroup))) {
            throw new UnauthorizedException(ErrorCodes.SigFoxBadLogin);
        }

        return sigfoxGroup;
    }
}
