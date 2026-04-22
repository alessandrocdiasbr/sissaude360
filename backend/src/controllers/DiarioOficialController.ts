import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { fetchDOU, fetchDOMG, fetchALMG, executarColeta } from '../services/DiarioOficialService';

const prisma = new PrismaClient();

class DiarioOficialController {
  /**
   * GET /api/diario/artigos
   * Query params: fonte, busca, salvo (true|false), data (YYYY-MM-DD), pagina, limite
   */
  async listarArtigos(req: Request, res: Response) {
    try {
      const {
        fonte,
        busca,
        salvo,
        data,
        pagina = 1,
        limite = 20,
      } = req.query;

      const p = Math.max(Number(pagina), 1);
      const l = Math.min(Math.max(Number(limite), 1), 100);
      const skip = (p - 1) * l;

      const where: any = {};

      if (fonte) where.fonte = String(fonte);

      if (salvo !== undefined) {
        where.salvo = salvo === 'true' || salvo === '1';
      }

      if (data) {
        const d = new Date(String(data));
        const nextDay = new Date(d);
        nextDay.setDate(nextDay.getDate() + 1);
        where.dataPublicacao = { gte: d, lt: nextDay };
      }

      if (busca) {
        where.OR = [
          { titulo: { contains: String(busca), mode: 'insensitive' } },
          { resumo: { contains: String(busca), mode: 'insensitive' } },
          { orgao: { contains: String(busca), mode: 'insensitive' } },
        ];
      }

      const [total, artigos] = await Promise.all([
        prisma.diarioOficialArtigo.count({ where }),
        prisma.diarioOficialArtigo.findMany({
          where,
          orderBy: [{ dataPublicacao: 'desc' }, { capturedoEm: 'desc' }],
          skip,
          take: l,
        }),
      ]);

      res.json({
        dados: artigos,
        paginacao: {
          total,
          pagina: p,
          limite: l,
          totalPaginas: Math.ceil(total / l),
        },
      });
    } catch (error) {
      console.error('DiarioOficialController.listarArtigos:', error);
      res.status(500).json({ erro: 'Erro ao listar artigos.' });
    }
  }

  /**
   * PATCH /api/diario/artigos/:id/salvar
   * Toggle salvo field
   */
  async salvarArtigo(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const artigo = await prisma.diarioOficialArtigo.findUnique({ where: { id } });
      if (!artigo) {
        return res.status(404).json({ erro: 'Artigo não encontrado.' });
      }

      const novoEstado = !artigo.salvo;
      const atualizado = await prisma.diarioOficialArtigo.update({
        where: { id },
        data: {
          salvo: novoEstado,
          salvoEm: novoEstado ? new Date() : null,
        },
      });

      res.json(atualizado);
    } catch (error) {
      console.error('DiarioOficialController.salvarArtigo:', error);
      res.status(500).json({ erro: 'Erro ao atualizar artigo.' });
    }
  }

  /**
   * POST /api/diario/buscar
   * Body: { termos: string[], fontes: string[], dataInicio?: string, dataFim?: string }
   * Fetches from sources and returns results WITHOUT storing in DB
   */
  async buscarManual(req: Request, res: Response) {
    try {
      const { termos, fontes, dataInicio, dataFim } = req.body;

      if (!termos || !Array.isArray(termos) || termos.length === 0) {
        return res.status(400).json({ erro: 'Informe ao menos um termo de busca.' });
      }

      if (!fontes || !Array.isArray(fontes) || fontes.length === 0) {
        return res.status(400).json({ erro: 'Informe ao menos uma fonte.' });
      }

      const resultados: any[] = [];
      const fontesValidas = ['DOU', 'DOMG', 'ALMG'];

      for (const fonte of fontes) {
        if (!fontesValidas.includes(fonte)) continue;

        let artigos: any[] = [];
        try {
          if (fonte === 'DOU') artigos = await fetchDOU(termos);
          else if (fonte === 'DOMG') artigos = await fetchDOMG(termos);
          else if (fonte === 'ALMG') artigos = await fetchALMG(termos);
        } catch (fetchErr: any) {
          console.error(`DiarioOficialController.buscarManual [${fonte}]:`, fetchErr.message);
        }

        // Filter by date range if provided
        let filtrados = artigos;
        if (dataInicio) {
          const di = new Date(dataInicio);
          filtrados = filtrados.filter((a) => new Date(a.dataPublicacao) >= di);
        }
        if (dataFim) {
          const df = new Date(dataFim);
          filtrados = filtrados.filter((a) => new Date(a.dataPublicacao) <= df);
        }

        resultados.push(...filtrados);
      }

      res.json({ dados: resultados, total: resultados.length });
    } catch (error) {
      console.error('DiarioOficialController.buscarManual:', error);
      res.status(500).json({ erro: 'Erro ao realizar busca manual.' });
    }
  }

  /**
   * POST /api/diario/coletar
   * Triggers manual collection job
   */
  async coletar(req: Request, res: Response) {
    try {
      // Fire and forget — respond immediately then run in background
      res.json({ mensagem: 'Coleta iniciada em segundo plano.' });

      executarColeta()
        .then(() => {
          console.log('[DiarioOficialController] Coleta manual concluída.');
        })
        .catch((err) => {
          console.error('[DiarioOficialController] Erro na coleta manual:', err);
        });
    } catch (error) {
      console.error('DiarioOficialController.coletar:', error);
      res.status(500).json({ erro: 'Erro ao iniciar coleta.' });
    }
  }

  /**
   * GET /api/diario/preferencias
   */
  async listarPreferencias(req: Request, res: Response) {
    try {
      const preferencias = await prisma.diarioOficialPreferencia.findMany({
        orderBy: { criadoEm: 'desc' },
      });

      // Parse termos JSON and fontes string for each preference
      const resultado = preferencias.map((p) => ({
        ...p,
        termos: (() => {
          try {
            return JSON.parse(p.termos);
          } catch {
            return p.termos.split(',').map((t) => t.trim()).filter(Boolean);
          }
        })(),
        fontes: p.fontes.split(',').map((f) => f.trim()).filter(Boolean),
      }));

      res.json(resultado);
    } catch (error) {
      console.error('DiarioOficialController.listarPreferencias:', error);
      res.status(500).json({ erro: 'Erro ao listar preferências.' });
    }
  }

  /**
   * POST /api/diario/preferencias
   * Body: { titulo: string, termos: string[], fontes: string[], ativo?: boolean }
   */
  async criarPreferencia(req: Request, res: Response) {
    try {
      const { titulo, termos, fontes, ativo } = req.body;

      if (!titulo) return res.status(400).json({ erro: 'Título é obrigatório.' });
      if (!termos || !Array.isArray(termos) || termos.length === 0) {
        return res.status(400).json({ erro: 'Informe ao menos um termo.' });
      }
      if (!fontes || !Array.isArray(fontes) || fontes.length === 0) {
        return res.status(400).json({ erro: 'Informe ao menos uma fonte.' });
      }

      const preferencia = await prisma.diarioOficialPreferencia.create({
        data: {
          titulo,
          termos: JSON.stringify(termos),
          fontes: fontes.join(','),
          ativo: ativo !== undefined ? Boolean(ativo) : true,
        },
      });

      res.status(201).json({
        ...preferencia,
        termos,
        fontes,
      });
    } catch (error) {
      console.error('DiarioOficialController.criarPreferencia:', error);
      res.status(500).json({ erro: 'Erro ao criar preferência.' });
    }
  }

  /**
   * PUT /api/diario/preferencias/:id
   * Body: { titulo?, termos?, fontes?, ativo? }
   */
  async atualizarPreferencia(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { titulo, termos, fontes, ativo } = req.body;

      const exists = await prisma.diarioOficialPreferencia.findUnique({ where: { id } });
      if (!exists) return res.status(404).json({ erro: 'Preferência não encontrada.' });

      const updateData: any = {};
      if (titulo !== undefined) updateData.titulo = titulo;
      if (termos !== undefined) updateData.termos = JSON.stringify(Array.isArray(termos) ? termos : [termos]);
      if (fontes !== undefined) updateData.fontes = Array.isArray(fontes) ? fontes.join(',') : String(fontes);
      if (ativo !== undefined) updateData.ativo = Boolean(ativo);

      const atualizada = await prisma.diarioOficialPreferencia.update({
        where: { id },
        data: updateData,
      });

      res.json({
        ...atualizada,
        termos: (() => {
          try { return JSON.parse(atualizada.termos); }
          catch { return atualizada.termos.split(',').map((t) => t.trim()); }
        })(),
        fontes: atualizada.fontes.split(',').map((f) => f.trim()),
      });
    } catch (error) {
      console.error('DiarioOficialController.atualizarPreferencia:', error);
      res.status(500).json({ erro: 'Erro ao atualizar preferência.' });
    }
  }

  /**
   * DELETE /api/diario/preferencias/:id
   */
  async deletarPreferencia(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const exists = await prisma.diarioOficialPreferencia.findUnique({ where: { id } });
      if (!exists) return res.status(404).json({ erro: 'Preferência não encontrada.' });

      await prisma.diarioOficialPreferencia.delete({ where: { id } });

      res.json({ mensagem: 'Preferência removida com sucesso.' });
    } catch (error) {
      console.error('DiarioOficialController.deletarPreferencia:', error);
      res.status(500).json({ erro: 'Erro ao deletar preferência.' });
    }
  }
}

export default new DiarioOficialController();
