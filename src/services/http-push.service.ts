import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { HttpPush } from "@entities/http-push.entity";
import { Repository, DeleteResult } from "typeorm";
import { CreateHttpPushDto } from "@dto/create-http-push.dto";
import { UpdateHttpPushDto } from "@dto/update-http-push.dto";

@Injectable()
export class HttpPushService {
    constructor(
        @InjectRepository(HttpPush)
        private httpPushRepository: Repository<HttpPush>
    ) {}

    async findOne(id: string): Promise<HttpPush> {
        return await this.httpPushRepository.findOneOrFail(id, {
            relations: ["application"],
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
