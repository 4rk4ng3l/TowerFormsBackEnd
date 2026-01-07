export class Permission {
  constructor(
    public readonly id: string,
    public readonly resource: string,
    public readonly action: string,
    public readonly description: string | null,
    public readonly createdAt: Date
  ) {}

  static create(
    id: string,
    resource: string,
    action: string,
    description: string | null = null
  ): Permission {
    return new Permission(
      id,
      resource,
      action,
      description,
      new Date()
    );
  }

  matches(resource: string, action: string): boolean {
    return this.resource === resource && this.action === action;
  }

  isValid(): boolean {
    return (
      this.resource.trim().length > 0 &&
      this.action.trim().length > 0
    );
  }

  getFullName(): string {
    return `${this.resource}:${this.action}`;
  }

  isForResource(resource: string): boolean {
    return this.resource === resource;
  }

  isForAction(action: string): boolean {
    return this.action === action;
  }
}
