import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { HttpPush } from "@entities/http-push.entity";
import { Repository, DeleteResult, getConnection } from "typeorm";
import { CreateHttpPushDto } from "@dto/create/create-http-push.dto";
import { UpdateHttpPushDto } from "@dto/update/update-http-push.dto";
import {ListAllHttpPushDto} from "@dto/list/list-all-http-push.dto"
import {ListAllHttpPushResponseDto} from "@dto/list/list-all-http-push-response.dto"
@Injectable()
export class HttpPushService {
    constructor(
        @InjectRepository(HttpPush)
        private httpPushRepository: Repository<HttpPush>
    ) {}

    
    async findAndCountWithPagination(
        query?: ListAllHttpPushDto
    ): Promise<ListAllHttpPushResponseDto> {
        const [result, total] =  await getConnection()
        .createQueryBuilder()
        .select("HttpPush")
        .from(HttpPush, "HttpPush").orderBy({id:"DESC"})
        .getManyAndCount();

        return {
            data: result,
            count: total,
        };
    }
    async findOneWithoutRelations(id: number): Promise<HttpPush> {
        return await this.httpPushRepository.findOneOrFail(id);
    }

    async findOne(id: number): Promise<HttpPush> {
        return await this.httpPushRepository.findOneOrFail(id, {
        });
    }
    
    async create(
        createHttpPushDto: CreateHttpPushDto
    ): Promise<HttpPush> {
        const httpPush = new HttpPush();

        const mappedHttpPush = this.mapHttpPushDtoToHttpPush(
            createHttpPushDto,
            httpPush
        );

        return this.httpPushRepository.save(mappedHttpPush);
    }

    async update(
        id: string,
        updateHttpPushDto: UpdateHttpPushDto
    ): Promise<HttpPush> {
        const existingHttpPush = await this.httpPushRepository.findOneOrFail(
            id
        );

        const mappedHttpPush = this.mapHttpPushDtoToHttpPush(
            updateHttpPushDto,
            existingHttpPush
        );

        return this.httpPushRepository.save(mappedHttpPush);
    }

    async delete(id: string): Promise<DeleteResult> {
        return this.httpPushRepository.delete(id);
    }

    private mapHttpPushDtoToHttpPush


    (
        httpPushDto: CreateHttpPushDto | UpdateHttpPushDto,
        httpPush: HttpPush
    ): HttpPush {
        httpPush.targetUrl = httpPushDto.targetUrl;
        httpPush.timeout = httpPushDto.timeout;
        httpPush.authorizationHeader = httpPushDto.authorizationHeader;



        return httpPush;
    }
}
