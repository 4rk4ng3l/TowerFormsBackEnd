export class InventoryEE {
  constructor(
    public readonly id: string,
    public readonly siteId: string,
    public readonly idEE: number,
    public readonly tipoSoporte: string | null,
    public readonly tipoEE: string,
    public readonly situacion: string,
    public readonly situacionRRU: string | null,
    public readonly modelo: string | null,
    public readonly fabricante: string | null,
    public readonly tipoExposicionViento: string | null,
    public readonly aristaCaraMastil: string | null,
    public readonly operadorPropietario: string | null,
    public readonly alturaAntena: number | null,
    public readonly diametro: number | null,
    public readonly largo: number | null,
    public readonly ancho: number | null,
    public readonly fondo: number | null,
    public readonly azimut: number | null,
    public readonly epaM2: number | null,
    public readonly usoCompartido: boolean,
    public readonly sistemaMovil: string | null,
    public readonly observaciones: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static create(
    id: string,
    siteId: string,
    idEE: number,
    tipoEE: string
  ): InventoryEE {
    return new InventoryEE(
      id,
      siteId,
      idEE,
      null,
      tipoEE,
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
      null,
      null,
      null,
      false,
      null, // sistemaMovil
      null,
      new Date(),
      new Date()
    );
  }
}
