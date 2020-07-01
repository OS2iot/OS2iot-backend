export class DeleteApplicationResponseDto {
    constructor(affected: number) {
        this.affected = affected;
    }

    affected: number;
}
