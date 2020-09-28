import { ListAllSigFoxGroupReponseDto } from "@dto/sigfox/internal/list-all-sigfox-groups-response.dto";
import { SigFoxGroup } from "@entities/sigfox-group.entity";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

@Injectable()
export class SigFoxGroupService {
    constructor(
        @InjectRepository(SigFoxGroup)
        private repository: Repository<SigFoxGroup>
    ) {}

    async findAll(organizationId: number): Promise<ListAllSigFoxGroupReponseDto> {
        const [data, count] = await this.repository.findAndCount({
            where: {
                belongsTo: {
                    id: organizationId,
                },
            },
        });

        return {
            data: data,
            count: count,
        };
    }
}
