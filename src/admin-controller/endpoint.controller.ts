import {
    Controller,
    Get,
    Post,
    Header,
    Body,
    Query,
    Put,
    Param,
    NotFoundException,
    Delete,
    BadRequestException,
} from "@nestjs/common";
import {
    ApiProduces,
    ApiTags,
    ApiOperation,
    ApiBadRequestResponse,
    ApiNotFoundResponse,
} from "@nestjs/swagger";
import { EndpointService } from "@services/endpoint.service";
import { Endpoint } from "@entities/endpoint.entity";
import { CreateEndpointDto } from "@dto/create-endpoint.dto";
import { UpdateEndpointDto } from "@dto/update-endpoint.dto";
import { DeleteResponseDto } from "@dto/delete-application-response.dto";

@ApiTags("Endpoint")
@Controller("endpoint")
export class EndpointController {
    constructor(private endpointService: EndpointService) {}


    @Get(":apiKey")
    @ApiOperation({ summary: "Find endpoints by apiKey" })
    @ApiNotFoundResponse()
    async find(@Param("apiKey") apiKey: string): Promise<Endpoint> {
        try {
            return await this.endpointService.findOne(apiKey);
        } catch (err) {
            throw new NotFoundException(`No element found by id: ${apiKey}`);
        }
    }

    @Post()
    @Header("Cache-Control", "none")
    @ApiOperation({ summary: "Create a new Endpoint" })
    @ApiBadRequestResponse()
    async create(
        @Body() createEndpointDto: CreateEndpointDto
    ): Promise<Endpoint> {
        const endpoint = this.endpointService.create(
            (CreateEndpointDto) as any
        );
        return createEndpointDto;
    }

    
    @Put(":apiKey")
    @Header("Cache-Control", "none")
    @ApiOperation({ summary: "Update an existing Endpoint" })
    @ApiBadRequestResponse()
    async update(
        @Param("apiKey") apiKey: string,
        @Body() updateEndpointDto: UpdateEndpointDto
    ): Promise<Endpoint> {
        const endpoint = await this.endpointService.update(
            apiKey,
            updateEndpointDto
        );

        return endpoint;
    }
    
    @Delete(":apiKey")
    @ApiOperation({ summary: "Delete an existing Endpoint" })
    @ApiBadRequestResponse()
    async delete(@Param("apiKey") apiKey: string): Promise<DeleteResponseDto> {
        try {
            const result = await this.endpointService.delete(apiKey);
            return new DeleteResponseDto(result.affected);
        } catch (err) {
            throw new BadRequestException(err);
        }
    }
    
}
