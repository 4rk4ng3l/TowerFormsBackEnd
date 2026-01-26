export class InventoryEP {
  constructor(
    public readonly id: string,
    public readonly siteId: string,
    public readonly idEP: number,
    public readonly tipoPiso: string | null,
    public readonly ubicacionEquipo: string | null,
    public readonly situacion: string,
    public readonly estadoPiso: string | null,
    public readonly modelo: string | null,
    public readonly fabricante: string | null,
    public readonly usoEP: string | null,
    public readonly operadorPropietario: string | null,
    public readonly ancho: number | null,
    public readonly profundidad: number | null,
    public readonly altura: number | null,
    public readonly superficieOcupada: number | null,
    public readonly observaciones: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static create(
    id: string,
    siteId: string,
    idEP: number
  ): InventoryEP {
    return new InventoryEP(
      id,
      siteId,
      idEP,
      null,
      null,
      'En servicio',
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      new Date(),
      new Date()
    );
  }
}
