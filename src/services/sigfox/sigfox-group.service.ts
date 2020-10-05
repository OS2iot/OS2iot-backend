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
import { ListAllSigFoxGroupReponseDto } from "@dto/sigfox/internal/list-all-sigfox-groups-response.dto";
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

    async findAll(organizationId: number): Promise<ListAllSigFoxGroupReponseDto> {
        const [data, count] = await this.repository.findAndCount({
            where: {
                belongsTo: {
                    id: organizationId,
                },
            },
            select: ["username", "password"],
            relations: ["belongsTo"],
        });

        await this.addSigFoxDataToAllGroups(data);

        return {
            data: data,
            count: count,
        };
    }

    private async addSigFoxDataToAllGroups(data: SigFoxGroup[]) {
        await Promise.all(data.map(async x => await this.addSigFoxDataToGroup(x)));
    }

    private async addSigFoxDataToGroup(group: SigFoxGroup) {
        // if password was not included, then include it now.
        if (group.password == null) {
            group = await this.findOneWithPassword(group.id);
        }
        let apiGroupResponse;
        try {
            apiGroupResponse = await this.sigfoxApiGroupService.getGroups(group);
        } catch (err) {
            this.logger.warn(`Got error from SigFox: ${err?.response?.error}`);
            group.sigFoxGroupData = null;
            return group;
        }
        if (apiGroupResponse.data.length > 1) {
            this.logger.warn(`API user ${group.id} has access to more than one group`);
        }
        const firstGroup = apiGroupResponse.data[0];
        group.sigFoxGroupData = firstGroup;
        // remove password again ...
        group.password = undefined;
    }

    async findOne(id: number): Promise<SigFoxGroup> {
        const res = await this.findOneWithPassword(id);

        await this.addSigFoxDataToAllGroups([res]);

        return res;
    }

    async findOneWithPassword(id: number): Promise<SigFoxGroup> {
        return await this.repository.findOneOrFail(id, {
            relations: ["belongsTo"],
            select: ["username", "password"],
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

        const res = await this.mapAndSave(sigfoxGroup, query);
        await this.addSigFoxDataToAllGroups([res]);
        return res;
    }

    async update(
        sigfoxGroup: SigFoxGroup,
        query: UpdateSigFoxGroupRequestDto
    ): Promise<SigFoxGroup> {
        const res = await this.mapAndSave(sigfoxGroup, query);
        await this.addSigFoxDataToAllGroups([res]);
        return res;
    }

    private async mapAndSave(
        sigfoxGroup: SigFoxGroup,
        query: UpdateSigFoxGroupRequestDto
    ): Promise<SigFoxGroup> {
        sigfoxGroup.username = query.username;
        sigfoxGroup.password = query.password;

        // Test that new credentials are good.
        if (!(await this.genericSigfoxAdministationService.testConnection(sigfoxGroup))) {
            throw new UnauthorizedException(ErrorCodes.SIGFOX_BAD_LOGIN);
        }

        return await this.repository.save(sigfoxGroup);
    }
}
