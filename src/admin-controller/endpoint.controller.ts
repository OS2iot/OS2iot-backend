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

    /*
    @Put(":id")
    @Header("Cache-Control", "none")
    @ApiOperation({ summary: "Update an existing Endpoint" })
    @ApiBadRequestResponse()
    async update(
        @Param("id") id: number,
        @Body() updateEndpointDto: UpdateEndpointDto
    ): Promise<Endpoint> {
        const endpoint = await this.endpointService.update(
            id,
            updateEndpointDto
        );

        return endpoint;
    }
    
    @Delete(":id")
    @ApiOperation({ summary: "Delete an existing Endpoint" })
    @ApiBadRequestResponse()
    async delete(@Param("id") id: number): Promise<DeleteResponseDto> {
        try {
            const result = await this.endpointService.delete(id);
            return new DeleteResponseDto(result.affected);
        } catch (err) {
            throw new BadRequestException(err);
        }
    }
    */
}
