export class AuditLogEntry {
  timestamp: Date;
  actionType: ActionType;
  type: string;
  completed?: boolean;
  id?: number | string;
  name?: string;
  userId: number;
}

export enum ActionType {
  DELETE = "DELETE",
  CREATE = "CREATE",
  UPDATE = "UPDATE",
}
