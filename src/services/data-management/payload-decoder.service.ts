import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DeleteResult, In, Repository } from "typeorm";

import { CreatePayloadDecoderDto } from "@dto/create-payload-decoder.dto";
import { ListAllEntitiesDto } from "@dto/list-all-entities.dto";
import { ListAllPayloadDecoderResponseDto } from "@dto/list-all-payload-decoders-response.dto";
import { UpdatePayloadDecoderDto } from "@dto/update-payload-decoder.dto";
import { ErrorCodes } from "@entities/enum/error-codes.enum";
import { PayloadDecoder } from "@entities/payload-decoder.entity";
import { OrganizationService } from "@services/user-management/organization.service";

@Injectable()
export class PayloadDecoderService {
    constructor(
        @InjectRepository(PayloadDecoder)
        private payloadDecoderRepository: Repository<PayloadDecoder>,
        private organizationService: OrganizationService
    ) {}

    async findOne(id: number): Promise<PayloadDecoder> {
        return await this.payloadDecoderRepository.findOneOrFail(id, {
            relations: ["organization"],
            loadRelationIds: {
                relations: ["createdBy", "updatedBy"],
            },
        });
    }

    async findAndCountWithPagination(
        query: ListAllEntitiesDto,
        organizationId: number
    ): Promise<ListAllPayloadDecoderResponseDto> {
        const [result, total] = await this.payloadDecoderRepository.findAndCount({
            where: organizationId != null ? { organization: organizationId } : {},
            take: query.limit,
            skip: query.offset,
            order: { id: query.sort },
            relations: ["organization"],
        });

        return {
            data: result,
            count: total,
        };
    }

    async create(
        createDto: CreatePayloadDecoderDto,
        userId: number
    ): Promise<PayloadDecoder> {
        const newPayloadDecoder = new PayloadDecoder();
        const mappedPayloadDecoder = await this.mapDtoToPayloadDecoder(
            createDto,
            newPayloadDecoder
        );
        mappedPayloadDecoder.createdBy = userId;
        mappedPayloadDecoder.updatedBy = userId;

        return await this.payloadDecoderRepository.save(mappedPayloadDecoder);
    }

    async update(
        id: number,
        updateDto: UpdatePayloadDecoderDto,
        userId: number
    ): Promise<PayloadDecoder> {
        const payloadDecoder = await this.payloadDecoderRepository.findOneOrFail(id);

        const mappedPayloadDecoder = await this.mapDtoToPayloadDecoder(
            updateDto,
            payloadDecoder
        );
        mappedPayloadDecoder.updatedBy = userId;

        return await this.payloadDecoderRepository.save(mappedPayloadDecoder);
    }

    async delete(id: number): Promise<DeleteResult> {
        return await this.payloadDecoderRepository.delete(id);
    }

    private async mapDtoToPayloadDecoder(
        createDto: CreatePayloadDecoderDto,
        newPayloadDecoder: PayloadDecoder
    ) {
        newPayloadDecoder.name = createDto.name;
        try {
            newPayloadDecoder.decodingFunction = JSON.parse(createDto.decodingFunction);
        } catch (err) {
            Logger.error("Failed to parse decodingFunction", err);
            throw new BadRequestException(ErrorCodes.BadEncoding);
        }
        try {
            newPayloadDecoder.organization = await this.organizationService.findById(
                createDto.organizationId
            );
        } catch (err) {
            Logger.error(
                `Could not find Organization with id ${createDto.organizationId}`
            );
            throw new BadRequestException(ErrorCodes.OrganizationDoesNotExists);
        }

        return newPayloadDecoder;
    }
}
