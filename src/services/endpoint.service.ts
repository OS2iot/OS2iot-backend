import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Endpoint } from "@entities/endpoint.entity";
import { Repository, DeleteResult } from "typeorm";
import { CreateEndpointDto } from "@dto/create-endpoint.dto";
import { UpdateEndpointDto } from "@dto/update-endpoint.dto";

@Injectable()
export class EndpointService {
    constructor(
        @InjectRepository(Endpoint)
        private endpointRepository: Repository<Endpoint>
    ) {}

    async findOne(apiKey: string): Promise<Endpoint> {
        return await this.endpointRepository.findOneOrFail(apiKey, {
            relations: ["application"],
        });
    }
    
    async create(
        createEndpointDto: CreateEndpointDto
    ): Promise<Endpoint> {
        const endpoint = new Endpoint();

        const mappedEndpoint = this.mapEndpointDtoToEndpoint(
            createEndpointDto,
            endpoint
        );

        return this.endpointRepository.save(mappedEndpoint);
    }

    async update(
        apiKey: string,
        updateEndpointDto: UpdateEndpointDto
    ): Promise<Endpoint> {
        const existingEndpoint = await this.endpointRepository.findOneOrFail(
            apiKey
        );

        const mappedEndpoint = this.mapEndpointDtoToEndpoint(
            updateEndpointDto,
            existingEndpoint
        );

        return this.endpointRepository.save(mappedEndpoint);
    }

    async delete(apiKey: string): Promise<DeleteResult> {
        return this.endpointRepository.delete(apiKey);
    }

    private mapEndpointDtoToEndpoint


    (
        endpointDto: CreateEndpointDto | UpdateEndpointDto,
        endpoint: Endpoint
    ): Endpoint {
        endpoint.endpointUrl = endpointDto.endpointUrl;
        endpoint.apiKey = endpointDto.apiKey;
        endpoint.targetType = endpointDto.targetType;

        if (
            endpoint.apiKey !== undefined ||
            endpoint.apiKey !== null ||
            endpoint.targetType !== null 
        ) {
           
        }

        return endpoint;
    }
}
