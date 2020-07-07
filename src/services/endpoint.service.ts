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
        id: number,
        updateEndpointDto: UpdateEndpointDto
    ): Promise<Endpoint> {
        const existingEndpoint = await this.endpointRepository.findOneOrFail(
            id
        );

        const mappedEndpoint = this.mapEndpointDtoToEndpoint(
            updateEndpointDto,
            existingEndpoint
        );

        return this.endpointRepository.save(mappedEndpoint);
    }

    async delete(id: number): Promise<DeleteResult> {
        return this.endpointRepository.delete(id);
    }

    private mapEndpointDtoToEndpoint


    (
        endpointDto: CreateEndpointDto | UpdateEndpointDto,
        endpoint: Endpoint
    ): Endpoint {
        endpoint.endpointUrl = endpointDto.endpointUrl;
        endpoint.apiKey = endpointDto.apiKey;
        if (
            endpoint.apiKey === undefined ||
            endpoint.apiKey === null
        ) {
            endpoint.endpointUrl.push("asdsa");
        }

        return endpoint;
    }
}
