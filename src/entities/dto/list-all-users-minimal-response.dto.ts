export class ListAllUsersMinimalResponseDto {
    users: UsersMinimal[];
}

export class UsersMinimal {
    id: number;
    name: string;
}
