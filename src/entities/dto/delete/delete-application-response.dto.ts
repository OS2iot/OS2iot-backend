export class DeleteResponseDto {
    constructor(affected: number) {
        this.affected = affected;
    }

    affected: number;
}
