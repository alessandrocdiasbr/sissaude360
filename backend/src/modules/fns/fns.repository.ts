import { PrismaClient } from '@prisma/client';
import { DespesaFNS, TransferenciaFNS, ConvenioFNS } from './fns.types';

const prisma = new PrismaClient();

class FNSRepository {
  async saveDespesa(data: DespesaFNS): Promise<any> {
    return await prisma.fNSDespesa.upsert({
      where: {
        uniq_despesa_competencia: {
          codigoOrgao: data.codigoOrgao,
          competencia: data.competencia,
        },
      },
      update: {
        valor: data.valor,
        descricao: data.descricao,
        rawJson: data.rawJson as any,
        importadoEm: new Date(),
      },
      create: {
        codigoOrgao: data.codigoOrgao,
        descricao: data.descricao,
        valor: data.valor,
        competencia: data.competencia,
        rawJson: data.rawJson as any,
      },
    });
  }

  async saveTransferencia(data: TransferenciaFNS): Promise<any> {
    return await prisma.fNSTransferencia.upsert({
      where: {
        uniq_transferencia_ano_bloco: {
          codigoIbge: data.codigoIbge,
          ano: data.ano,
          bloco: data.bloco,
        },
      },
      update: {
        valor: data.valor,
        rawJson: data.rawJson as any,
        importadoEm: new Date(),
      },
      create: {
        codigoIbge: data.codigoIbge,
        municipio: data.municipio,
        valor: data.valor,
        bloco: data.bloco,
        ano: data.ano,
        rawJson: data.rawJson as any,
      },
    });
  }

  async saveConvenio(data: ConvenioFNS): Promise<any> {
    return await prisma.fNSConvenio.upsert({
      where: { numero: data.numero },
      update: {
        situacao: data.situacao,
        dataFim: data.dataFim ? new Date(data.dataFim) : null,
        rawJson: data.rawJson as any,
        importadoEm: new Date(),
      },
      create: {
        numero: data.numero,
        objeto: data.objeto,
        valorGlobal: data.valorGlobal,
        situacao: data.situacao,
        dataInicio: data.dataInicio ? new Date(data.dataInicio) : null,
        dataFim: data.dataFim ? new Date(data.dataFim) : null,
        rawJson: data.rawJson as any,
      },
    });
  }

  // --- QUERIES DE LISTAGEM ---

  async listarDespesas({ ano, mes, pagina = 1, limite = 20 }: { ano: number, mes: number, pagina?: number, limite?: number }): Promise<{ rows: any[], total: number }> {
    const skip = (pagina - 1) * limite;
    const competencia = `${String(mes).padStart(2, '0')}/${ano}`;

    const [total, rows] = await Promise.all([
      prisma.fNSDespesa.count({ where: { competencia } }),
      prisma.fNSDespesa.findMany({
        where: { competencia },
        orderBy: { valor: 'desc' },
        skip,
        take: limite,
      }),
    ]);

    return { rows, total };
  }

  async listarTransferencias({ codigoIBGE, ano, pagina = 1, limite = 20 }: { codigoIBGE: string, ano: number, pagina?: number, limite?: number }): Promise<{ rows: any[], total: number }> {
    const skip = (pagina - 1) * limite;

    const [total, rows] = await Promise.all([
      prisma.fNSTransferencia.count({ where: { codigoIbge: codigoIBGE, ano } }),
      prisma.fNSTransferencia.findMany({
        where: { codigoIbge: codigoIBGE, ano },
        orderBy: { valor: 'desc' },
        skip,
        take: limite,
      }),
    ]);

    return { rows, total };
  }

  async resumoMunicipio(codigoIBGE: string, ano: number): Promise<any[]> {
    const aggregations = await prisma.fNSTransferencia.groupBy({
      by: ['bloco'],
      where: { codigoIbge: codigoIBGE, ano },
      _sum: { valor: true },
      orderBy: { _sum: { valor: 'desc' } },
    });

    return aggregations.map(a => ({
      bloco: a.bloco,
      total: a._sum.valor || 0
    }));
  }

  async listarConvenios({ ano, situacao, pagina = 1, limite = 20 }: { ano: number, situacao?: string, pagina?: number, limite?: number }): Promise<{ rows: any[], total: number }> {
    const skip = (pagina - 1) * limite;
    
    const where: any = {
      dataInicio: {
        gte: new Date(`${ano}-01-01`),
        lte: new Date(`${ano}-12-31`),
      }
    };

    if (situacao) {
      where.situacao = { contains: situacao, mode: 'insensitive' };
    }

    const [total, rows] = await Promise.all([
      prisma.fNSConvenio.count({ where }),
      prisma.fNSConvenio.findMany({
        where,
        orderBy: { dataInicio: 'desc' },
        skip,
        take: limite,
      }),
    ]);

    return { rows, total };
  }
}

export default new FNSRepository();
