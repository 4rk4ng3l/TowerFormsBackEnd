import { injectable, inject } from 'tsyringe';
import { IQueryHandler } from '@shared/interfaces/query-handler.interface';
import { GetPendingSyncDataQuery } from './get-pending-sync-data.query';
import { ISubmissionRepository } from '@domain/repositories/submission.repository.interface';
import { IFileRepository } from '@domain/repositories/file.repository.interface';
import { SiteRepository } from '@infrastructure/persistence/postgresql/repositories/site.repository';

interface PendingSyncData {
  submissions: any[];
  files: any[];
  sites: any[];
  inventoryEE: any[];
  inventoryEP: any[];
}

@injectable()
export class GetPendingSyncDataHandler implements IQueryHandler<GetPendingSyncDataQuery, PendingSyncData> {
  private readonly siteRepository: SiteRepository;

  constructor(
    @inject('ISubmissionRepository') private readonly submissionRepository: ISubmissionRepository,
    @inject('IFileRepository') private readonly fileRepository: IFileRepository
  ) {
    this.siteRepository = new SiteRepository();
  }

  async handle(query: GetPendingSyncDataQuery): Promise<PendingSyncData> {
    console.log('[GetPendingSyncDataHandler] Handler called');

    // Get unsynced submissions
    const unsyncedSubmissions = await this.submissionRepository.findUnsynced();

    // Filter by user if provided
    const filteredSubmissions = query.userId
      ? unsyncedSubmissions.filter(s => s.userId === query.userId)
      : unsyncedSubmissions;

    // Get unsynced files
    const unsyncedFiles = await this.fileRepository.findUnsynced();

    // Map to DTOs
    const submissions = filteredSubmissions.map(submission => ({
      id: submission.id,
      formId: submission.formId,
      userId: submission.userId,
      metadata: submission.metadata,
      startedAt: submission.startedAt,
      completedAt: submission.completedAt,
      answers: submission.answers.map(answer => ({
        id: answer.id,
        questionId: answer.questionId,
        value: answer.getValue()
      })),
      createdAt: submission.createdAt,
      updatedAt: submission.updatedAt
    }));

    const files = unsyncedFiles.map(file => ({
      id: file.id,
      submissionId: file.submissionId,
      stepId: file.stepId,
      questionId: file.questionId,
      fileName: file.fileName,
      fileSize: file.fileSize,
      mimeType: file.mimeType,
      remotePath: file.remotePath,
      createdAt: file.createdAt
    }));

    // Get all active sites with their inventory
    console.log('[GetPendingSyncDataHandler] Fetching all sites...');
    const allSites = await this.siteRepository.findAll();
    console.log('[GetPendingSyncDataHandler] Found sites:', allSites.length);

    const sites = allSites.map(site => ({
      id: site.id,
      codigoTowernex: site.codigoTowernex,
      codigoSitio: site.codigoSitio,
      name: site.name,
      siteType: site.siteType,
      latitud: site.latitud,
      longitud: site.longitud,
      direccion: site.direccion,
      regional: site.regional,
      contratistaOM: site.contratistaOM,
      empresaAuditora: site.empresaAuditora,
      tecnicoEA: site.tecnicoEA
    }));

    // Get inventory for all sites
    const inventoryEE: any[] = [];
    const inventoryEP: any[] = [];

    for (const site of allSites) {
      const siteEE = await this.siteRepository.findInventoryEEBySiteId(site.id);
      const siteEP = await this.siteRepository.findInventoryEPBySiteId(site.id);

      siteEE.forEach(ee => {
        inventoryEE.push({
          id: ee.id,
          siteId: ee.siteId,
          idEE: ee.idEE,
          tipoSoporte: ee.tipoSoporte,
          tipoEE: ee.tipoEE,
          situacion: ee.situacion,
          modelo: ee.modelo,
          fabricante: ee.fabricante,
          aristaCaraMastil: ee.aristaCaraMastil,
          operadorPropietario: ee.operadorPropietario,
          alturaAntena: ee.alturaAntena,
          azimut: ee.azimut,
          epaM2: ee.epaM2,
          usoCompartido: ee.usoCompartido,
          observaciones: ee.observaciones
        });
      });

      siteEP.forEach(ep => {
        inventoryEP.push({
          id: ep.id,
          siteId: ep.siteId,
          idEP: ep.idEP,
          tipoPiso: ep.tipoPiso,
          ubicacionEquipo: ep.ubicacionEquipo,
          situacion: ep.situacion,
          estadoPiso: ep.estadoPiso,
          modelo: ep.modelo,
          fabricante: ep.fabricante,
          usoEP: ep.usoEP,
          operadorPropietario: ep.operadorPropietario,
          ancho: ep.ancho,
          profundidad: ep.profundidad,
          altura: ep.altura,
          superficieOcupada: ep.superficieOcupada,
          observaciones: ep.observaciones
        });
      });
    }

    return {
      submissions,
      files,
      sites,
      inventoryEE,
      inventoryEP
    };
  }
}
