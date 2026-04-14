import db from '../../config/database';
import { DespesaFNS, TransferenciaFNS, ConvenioFNS } from './fns.types';

class FNSRepository {
  async saveDespesa(data: DespesaFNS): Promise<DespesaFNS> {
    const query = `
      INSERT INTO fns_despesas (codigo_orgao, descricao, valor, competencia, raw_json)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (codigo_orgao, competencia) DO UPDATE SET
        valor = EXCLUDED.valor,
        descricao = EXCLUDED.descricao,
        raw_json = EXCLUDED.raw_json,
        importado_em = CURRENT_TIMESTAMP
      RETURNING *;
    `;
    const values = [data.codigoOrgao, data.descricao, data.valor, data.competencia, data.rawJson];
    const { rows } = await db.query(query, values);
    return rows[0];
  }

  async saveTransferencia(data: TransferenciaFNS): Promise<TransferenciaFNS> {
    const query = `
      INSERT INTO fns_transferencias (codigo_ibge, municipio, valor, bloco, ano, raw_json)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (codigo_ibge, ano, bloco) DO UPDATE SET
        valor = EXCLUDED.valor,
        raw_json = EXCLUDED.raw_json,
        importado_em = CURRENT_TIMESTAMP
      RETURNING *;
    `;
    const values = [data.codigoIbge, data.municipio, data.valor, data.bloco, data.ano, data.rawJson];
    const { rows } = await db.query(query, values);
    return rows[0];
  }

  async saveConvenio(data: ConvenioFNS): Promise<ConvenioFNS> {
    const query = `
      INSERT INTO fns_convenios (numero, objeto, valor_global, situacao, data_inicio, data_fim, raw_json)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (numero) DO UPDATE SET
        situacao = EXCLUDED.situacao,
        data_fim = EXCLUDED.data_fim,
        raw_json = EXCLUDED.raw_json,
        importado_em = CURRENT_TIMESTAMP
      RETURNING *;
    `;
    const values = [
      data.numero,
      data.objeto,
      data.valorGlobal,
      data.situacao,
      data.dataInicio,
      data.dataFim,
      data.rawJson
    ];
    const { rows } = await db.query(query, values);
    return rows[0];
  }

  // --- QUERIES DE LISTAGEM ---

  async listarDespesas({ ano, mes, pagina = 1, limite = 20 }: { ano: number, mes: number, pagina?: number, limite?: number }): Promise<{ rows: DespesaFNS[], total: number }> {
    const offset = (pagina - 1) * limite;
    const competencia = `${String(mes).padStart(2, '0')}/${ano}`;

    const countQuery = 'SELECT COUNT(*) FROM fns_despesas WHERE competencia = $1';
    const dataQuery = `
      SELECT * FROM fns_despesas 
      WHERE competencia = $1 
      ORDER BY valor DESC 
      LIMIT $2 OFFSET $3
    `;

    const total = await db.query(countQuery, [competencia]);
    const { rows } = await db.query(dataQuery, [competencia, limite, offset]);

    return { rows, total: parseInt(total.rows[0].count) };
  }

  async listarTransferencias({ codigoIBGE, ano, pagina = 1, limite = 20 }: { codigoIBGE: string, ano: number, pagina?: number, limite?: number }): Promise<{ rows: TransferenciaFNS[], total: number }> {
    const offset = (pagina - 1) * limite;

    const countQuery = 'SELECT COUNT(*) FROM fns_transferencias WHERE codigo_ibge = $1 AND ano = $2';
    const dataQuery = `
      SELECT * FROM fns_transferencias 
      WHERE codigo_ibge = $1 AND ano = $2 
      ORDER BY valor DESC 
      LIMIT $3 OFFSET $4
    `;

    const total = await db.query(countQuery, [codigoIBGE, ano]);
    const { rows } = await db.query(dataQuery, [codigoIBGE, ano, limite, offset]);

    return { rows, total: parseInt(total.rows[0].count) };
  }

  async resumoMunicipio(codigoIBGE: string, ano: number): Promise<any[]> {
    const query = `
      SELECT bloco, SUM(valor) as total 
      FROM fns_transferencias 
      WHERE codigo_ibge = $1 AND ano = $2 
      GROUP BY bloco
      ORDER BY total DESC
    `;
    const { rows } = await db.query(query, [codigoIBGE, ano]);
    return rows;
  }

  async listarConvenios({ ano, situacao, pagina = 1, limite = 20 }: { ano: number, situacao?: string, pagina?: number, limite?: number }): Promise<{ rows: ConvenioFNS[], total: number }> {
    const offset = (pagina - 1) * limite;
    let where = 'WHERE EXTRACT(YEAR FROM data_inicio) = $1';
    let params: (string | number)[] = [ano];

    if (situacao) {
      where += ' AND situacao ILIKE $2';
      params.push(`%${situacao}%`);
    }

    const countQuery = `SELECT COUNT(*) FROM fns_convenios ${where}`;
    const dataQuery = `
      SELECT * FROM fns_convenios 
      ${where} 
      ORDER BY data_inicio DESC 
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    const total = await db.query(countQuery, params);
    const { rows } = await db.query(dataQuery, [...params, limite, offset]);

    return { rows, total: parseInt(total.rows[0].count) };
  }
}

export default new FNSRepository();
