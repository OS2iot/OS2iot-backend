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
import { GenericTargetService } from "@services/generic-target.service";
import { GenericTarget } from "@entities/generic-target.entity";
import { CreateGenericTargetDto } from "@dto/create-generic-target.dto";
import { UpdateGenericTargetDto } from "@dto/update-generic-target.dto";
import { DeleteResponseDto } from "@dto/delete-application-response.dto";

@ApiTags("GenericTarget")
@Controller("genericTarget")
export class GenericTargetController {
    constructor(private genericTargetService: GenericTargetService) {}


    @Get(":id")
    @ApiOperation({ summary: "Find genericTargets by id" })
    @ApiNotFoundResponse()
    async find(@Param("id") id: string): Promise<GenericTarget> {
        try {
            return await this.genericTargetService.findOne(id);
        } catch (err) {
            throw new NotFoundException(`No element found by id: ${id}`);
        }
    }

    @Post()
    @Header("Cache-Control", "none")
    @ApiOperation({ summary: "Create a new GenericTarget" })
    @ApiBadRequestResponse()
    async create(@Body() createGenericTargetDto: CreateGenericTargetDto): Promise<GenericTarget> {
        const genericTarget = this.genericTargetService.create( createGenericTargetDto );
        return createGenericTargetDto;
    }

    
    @Put(":id")
    @Header("Cache-Control", "none")
    @ApiOperation({ summary: "Update an existing GenericTarget" })
    @ApiBadRequestResponse()
    async update(
        @Param("id") id: string,
        @Body() updateGenericTargetDto: UpdateGenericTargetDto
    ): Promise<GenericTarget> {
        const genericTarget = await this.genericTargetService.update(
            id,
            updateGenericTargetDto
        );

        return genericTarget;
    }
    
    @Delete(":id")
    @ApiOperation({ summary: "Delete an existing GenericTarget" })
    @ApiBadRequestResponse()
    async delete(@Param("id") id: string): Promise<DeleteResponseDto> {
        try {
            const result = await this.genericTargetService.delete(id);
            return new DeleteResponseDto(result.affected);
        } catch (err) {
            throw new BadRequestException(err);
        }
    }
    
}
