export class OrderLine {
  constructor(
    public readonly medicationId: string,
    public readonly quantity: number,
  ) {}
}
