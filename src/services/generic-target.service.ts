import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { GenericTarget } from "@entities/generic-target.entity";
import { Repository, DeleteResult } from "typeorm";
import { CreateGenericTargetDto } from "@dto/create-generic-target.dto";
import { UpdateGenericTargetDto } from "@dto/update-generic-target.dto";

@Injectable()
export class GenericTargetService {
    constructor(
        @InjectRepository(GenericTarget)
        private genericTargetRepository: Repository<GenericTarget>
    ) {}

    async findOne(id: string): Promise<GenericTarget> {
        return await this.genericTargetRepository.findOneOrFail(id, {
            relations: ["application"],
        });
    }
    
    async create(
        createGenericTargetDto: CreateGenericTargetDto
    ): Promise<GenericTarget> {
        const genericTarget = new GenericTarget();

        const mappedGenericTarget = this.mapGenericTargetDtoToGenericTarget(
            createGenericTargetDto,
            genericTarget
        );

        return this.genericTargetRepository.save(mappedGenericTarget);
    }

    async update(
        id: string,
        updateGenericTargetDto: UpdateGenericTargetDto
    ): Promise<GenericTarget> {
        const existingGenericTarget = await this.genericTargetRepository.findOneOrFail(
            id
        );

        const mappedGenericTarget = this.mapGenericTargetDtoToGenericTarget(
            updateGenericTargetDto,
            existingGenericTarget
        );

        return this.genericTargetRepository.save(mappedGenericTarget);
    }

    async delete(id: string): Promise<DeleteResult> {
        return this.genericTargetRepository.delete(id);
    }

    private mapGenericTargetDtoToGenericTarget


    (
        genericTargetDto: CreateGenericTargetDto | UpdateGenericTargetDto,
        genericTarget: GenericTarget
    ): GenericTarget {
        genericTarget.targetName = genericTargetDto.targetName;
        genericTarget.applicationId = genericTargetDto.applicationId;
        genericTarget.devices = genericTargetDto.devices;



        return genericTarget;
    }
}
