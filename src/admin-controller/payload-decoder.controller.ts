import {
    Controller,
    Post,
    Header,
    Body,
    Get,
    Param,
    NotFoundException,
    Put,
    Delete,
    BadRequestException,
    Logger,
} from "@nestjs/common";
import {
    ApiTags,
    ApiOperation,
    ApiBadRequestResponse,
    ApiNotFoundResponse,
} from "@nestjs/swagger";
import { DeleteResponseDto } from "@dto/delete-application-response.dto";
import { ErrorCodes } from "@enum/error-codes.enum";
import { PayloadDecoderService } from "@services/payload-decoder.service";
import { PayloadDecoder } from "@entities/payload-decoder.entity";
import { CreatePayloadDecoderDto } from "@dto/create-payload-decoder.dto";
import { UpdatePayloadDecoderDto } from "@dto/update-payload-decoder.dto";

@ApiTags("Payload Decoder")
@Controller("payload-decoder")
export class PayloadDecoderController {
    constructor(private payloadDecoderService: PayloadDecoderService) {}

    @Get(":id")
    @ApiOperation({ summary: "Find one Payload Decoder by id" })
    @ApiNotFoundResponse()
    async findOne(@Param("id") id: number): Promise<PayloadDecoder> {
        let result = undefined;
        try {
            result = await this.payloadDecoderService.findOne(id);
        } catch (err) {
            Logger.error(
                `Error occured during findOne: '${JSON.stringify(err)}'`
            );
        }

        if (!result) {
            throw new NotFoundException(ErrorCodes.IdDoesNotExists);
        }
        return result;
    }

    @Post()
    @Header("Cache-Control", "none")
    @ApiOperation({ summary: "Create a new Payload Decoder" })
    @ApiBadRequestResponse()
    async create(
        @Body() createDto: CreatePayloadDecoderDto
    ): Promise<PayloadDecoder> {
        // TODO: Valider at funktionen er gyldig
        const payloadDecoder = await this.payloadDecoderService.create(
            createDto
        );
        return payloadDecoder;
    }

    @Put(":id")
    @Header("Cache-Control", "none")
    @ApiOperation({ summary: "Update an existing Payload Decoder" })
    @ApiBadRequestResponse()
    async update(
        @Param("id") id: number,
        @Body() updateDto: UpdatePayloadDecoderDto
    ): Promise<PayloadDecoder> {
        // TODO: Valider at funktionen er gyldig
        const payloadDecoder = await this.payloadDecoderService.update(
            id,
            updateDto
        );

        return payloadDecoder;
    }

    @Delete(":id")
    @ApiOperation({ summary: "Delete an existing Payload Decoder" })
    @ApiBadRequestResponse()
    async delete(@Param("id") id: number): Promise<DeleteResponseDto> {
        try {
            const result = await this.payloadDecoderService.delete(id);
            return new DeleteResponseDto(result.affected);
        } catch (err) {
            throw new BadRequestException(err);
        }
    }
}
