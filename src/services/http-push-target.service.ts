import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { HttpPushTarget } from "@entities/http-push-target.entity";
import { Repository, DeleteResult, getConnection } from "typeorm";
import { CreateHttpPushTargetDto } from "@dto/create/create-http-push-target.dto";
import { UpdateHttpPushTargetDto } from "@dto/update/update-http-push-target.dto";
import {ListAllHttpPushTargetDto} from "@dto/list/list-all-http-push-target.dto"
import {ListAllHttpPushTargetResponseDto} from "@dto/list/list-all-http-push-target-response.dto"
@Injectable()
export class HttpPushTargetService {
    constructor(
        @InjectRepository(HttpPushTarget)
        private httpPushTargetRepository: Repository<HttpPushTarget>
    ) {}

    
    async findAndCountWithPagination(
        query?: ListAllHttpPushTargetDto
    ): Promise<ListAllHttpPushTargetResponseDto> {
        const [result, total] =  await getConnection()
        .createQueryBuilder()
        .select("httpPush")
        .from(HttpPushTarget, "httpPush").limit(query.limit).offset(query.offset)
        .orderBy(query.orderOn, "ASC")
        .getManyAndCount();

        return {
            data: result,
            count: total,
        };
    }
    async findOneWithoutRelations(id: number): Promise<HttpPushTarget> {
        return await this.httpPushTargetRepository.findOneOrFail(id);
    }

    async findOne(id: number): Promise<HttpPushTarget> {
        return await this.httpPushTargetRepository.findOneOrFail(id, {
        });
    }
    
    async create(
        createHttpPushTargetDto: CreateHttpPushTargetDto
    ): Promise<HttpPushTarget> {
        const httpPushTarget = new HttpPushTarget();

        const mappedHttpPushTarget = this.mapHttpPushTargetDtoToHttpPushTarget(
            createHttpPushTargetDto,
            httpPushTarget
        );

        return this.httpPushTargetRepository.save(mappedHttpPushTarget);
    }

    async update(
        id: string,
        updateHttpPushTargetDto: UpdateHttpPushTargetDto
    ): Promise<HttpPushTarget> {
        const existingHttpPushTarget = await this.httpPushTargetRepository.findOneOrFail(
            id
        );

        const mappedHttpPushTarget = this.mapHttpPushTargetDtoToHttpPushTarget(
            updateHttpPushTargetDto,
            existingHttpPushTarget
        );

        return this.httpPushTargetRepository.save(mappedHttpPushTarget);
    }

    async delete(id: string): Promise<DeleteResult> {
        return this.httpPushTargetRepository.delete(id);
    }

    private mapHttpPushTargetDtoToHttpPushTarget

    (
        httpPushTargetDto: CreateHttpPushTargetDto | UpdateHttpPushTargetDto,
        httpPushTarget: HttpPushTarget
    ): HttpPushTarget {
        httpPushTarget.targetUrl = httpPushTargetDto.targetUrl;
        httpPushTarget.timeout = httpPushTargetDto.timeout;
        httpPushTarget.authorizationHeader = httpPushTargetDto.authorizationHeader;



        return httpPushTarget;
    }
}
