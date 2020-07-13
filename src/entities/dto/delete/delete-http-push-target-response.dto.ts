export class DeleteHttpPushTargetResponseDto {
    constructor(affected: number) {
        this.affected = affected;
    }

    affected: number;
}
