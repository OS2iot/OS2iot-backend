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
import { HttpPushService } from "@services/http-push.service";
import { HttpPush } from "@entities/http-push.entity";
import { CreateHttpPushDto } from "@dto/create-http-push.dto";
import { UpdateHttpPushDto } from "@dto/update-http-push.dto";
import { DeleteResponseDto } from "@dto/delete-application-response.dto";

@ApiTags("HttpPush")
@Controller("httpPush")
export class HttpPushController {
    constructor(private httpPushService: HttpPushService) {}


    @Get(":id")
    @ApiOperation({ summary: "Find httpPushs by id" })
    @ApiNotFoundResponse()
    async find(@Param("id") id: string): Promise<HttpPush> {
        try {
            return await this.httpPushService.findOne(id);
        } catch (err) {
            throw new NotFoundException(`No element found by id: ${id}`);
        }
    }

    @Post()
    @Header("Cache-Control", "none")
    @ApiOperation({ summary: "Create a new HttpPush" })
    @ApiBadRequestResponse()
    async create(@Body() createHttpPushDto: CreateHttpPushDto): Promise<HttpPush> {
        const httpPush = this.httpPushService.create( createHttpPushDto );
        return httpPush;
    }

    
    @Put(":id")
    @Header("Cache-Control", "none")
    @ApiOperation({ summary: "Update an existing HttpPush" })
    @ApiBadRequestResponse()
    async update(
        @Param("id") id: string,
        @Body() updateHttpPushDto: UpdateHttpPushDto
    ): Promise<HttpPush> {
        const httpPush = await this.httpPushService.update(
            id,
            updateHttpPushDto
        );

        return httpPush;
    }
    
    @Delete(":id")
    @ApiOperation({ summary: "Delete an existing HttpPush" })
    @ApiBadRequestResponse()
    async delete(@Param("id") id: string): Promise<DeleteResponseDto> {
        try {
            const result = await this.httpPushService.delete(id);
            return new DeleteResponseDto(result.affected);
        } catch (err) {
            throw new BadRequestException(err);
        }
    }
    
}
