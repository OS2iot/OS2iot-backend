import {
    Controller,
    Get,
    Post,
    Body,
    Query,
    Param,
    Put,
    BadRequestException,
} from "@nestjs/common";
import {
    ApiProduces,
    ApiTags,
    ApiOperation,
    ApiBadRequestResponse,
} from "@nestjs/swagger";
import { ChirpstackGatewayService } from "@services/chirpstack/chirpstack-gateway.service";
import { ChirpstackReponseStatus } from "@dto/chirpstack/chirpstack-response.dto";
import { CreateGatewayDto } from "@dto/chirpstack/create-gateway.dto";
import { ListAllGatewaysReponseDto } from "@dto/chirpstack/list-all-gateways.dto";
import { ChirpstackPaginatedListDto } from "@dto/chirpstack/chirpstack-paginated-list.dto";
import { SingleGatewayResponseDto } from "../../entities/dto/chirpstack/single-gateway-response.dto";
import { UpdateGatewayDto } from "../../entities/dto/chirpstack/update-gateway.dto";
import { ErrorCodes } from "../../entities/enum/error-codes.enum";

@ApiTags("Chirpstack")
@Controller("chirpstack/gateway")
export class ChirpstackGatewayController {
    constructor(private chirpstackGatewayService: ChirpstackGatewayService) {}

    @Post()
    @ApiProduces("application/json")
    @ApiOperation({ summary: "Create a new Chirpstack Gateway" })
    @ApiBadRequestResponse()
    async create(
        @Body() dto: CreateGatewayDto
    ): Promise<ChirpstackReponseStatus> {
        return await this.chirpstackGatewayService.createNewGateway(dto);
    }

    @Get()
    @ApiProduces("application/json")
    @ApiOperation({ summary: "List all Chirpstack gateways" })
    async getAll(
        @Query() query?: ChirpstackPaginatedListDto
    ): Promise<ListAllGatewaysReponseDto> {
        return await this.chirpstackGatewayService.listAllPaginated(
            query.limit,
            query.offset
        );
    }

    @Get(":gatewayId")
    @ApiProduces("application/json")
    @ApiOperation({ summary: "List all Chirpstack gateways" })
    async getOne(
        @Param("gatewayId") gatewayId: string
    ): Promise<SingleGatewayResponseDto> {
        if (gatewayId?.length != 16) {
            throw new BadRequestException(ErrorCodes.WrongLength);
        }

        if (!/[0-9A-Fa-f]{16}/.test(gatewayId)) {
            throw new BadRequestException(ErrorCodes.NotValidFormat);
        }

        return await this.chirpstackGatewayService.getOne(gatewayId);
    }

    @Put(":gatewayId")
    @ApiProduces("application/json")
    @ApiOperation({ summary: "Create a new Chirpstack Gateway" })
    @ApiBadRequestResponse()
    async update(
        @Param("gatewayId") gatewayId: string,
        @Body() dto: UpdateGatewayDto
    ): Promise<ChirpstackReponseStatus> {
        return await this.chirpstackGatewayService.modifyGateway(
            gatewayId,
            dto
        );
    }
}
