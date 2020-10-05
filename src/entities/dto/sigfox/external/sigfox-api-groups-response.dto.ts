export interface Path {
    id: string;
    name: string;
}

export interface SigFoxApiGroupsContent {
    id: string;
    name: string;
    description: string;
    type: number;
    timezone: string;
    nameCI: string;
    path: Path[];
    currentPrototypeCount: number;
    createdBy: string;
    creationTime: number;
    leaf: boolean;
    actions: string[];
}

export interface Paging {
    next: string;
}

export interface SigFoxApiGroupsResponse {
    data: SigFoxApiGroupsContent[];
    paging: Paging;
}
