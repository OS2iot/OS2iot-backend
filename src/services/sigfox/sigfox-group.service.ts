import { Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { CreateSigFoxGroupRequestDto } from "@dto/sigfox/internal/create-sigfox-group-request.dto";
import { ListAllSigFoxGroupReponseDto } from "@dto/sigfox/internal/list-all-sigfox-groups-response.dto";
import { UpdateSigFoxGroupRequestDto } from "@dto/sigfox/internal/update-sigfox-group-request.dto";
import { SigFoxGroup } from "@entities/sigfox-group.entity";
import { OrganizationService } from "@services/user-management/organization.service";

@Injectable()
export class SigFoxGroupService {
    constructor(
        @InjectRepository(SigFoxGroup)
        private repository: Repository<SigFoxGroup>,
        @Inject(OrganizationService)
        private organizationService: OrganizationService
    ) {}

    async findAll(organizationId: number): Promise<ListAllSigFoxGroupReponseDto> {
        const [data, count] = await this.repository.findAndCount({
            where: {
                belongsTo: {
                    id: organizationId,
                },
            },
            relations: ["belongsTo"],
        });

        return {
            data: data,
            count: count,
        };
    }

    async findOne(id: number): Promise<SigFoxGroup> {
        return await this.repository.findOneOrFail(id, {
            relations: ["belongsTo"],
        });
    }

    async create(query: CreateSigFoxGroupRequestDto): Promise<SigFoxGroup> {
        const sigfoxGroup = new SigFoxGroup();

        sigfoxGroup.belongsTo = await this.organizationService.findById(
            query.organizationId
        );

        return this.mapAndSave(sigfoxGroup, query);
    }

    async update(sigfoxGroup: SigFoxGroup, query: UpdateSigFoxGroupRequestDto): Promise<SigFoxGroup> {
        return this.mapAndSave(sigfoxGroup, query);
    }

    private async mapAndSave(
        sigfoxGroup: SigFoxGroup,
        query: UpdateSigFoxGroupRequestDto
    ): Promise<SigFoxGroup> {
        sigfoxGroup.username = query.username;
        sigfoxGroup.password = query.password;

        return await this.repository.save(sigfoxGroup);
    }
}
