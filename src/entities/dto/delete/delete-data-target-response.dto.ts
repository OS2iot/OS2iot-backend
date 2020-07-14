export class DeleteDataTargetResponseDto {
    constructor(affected: number) {
        this.affected = affected;
    }

    affected: number;
}
