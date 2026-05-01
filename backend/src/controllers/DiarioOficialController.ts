import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { executarColeta } from '../services/DiarioOficialService';
import {
  airflowDisponivel,
  acionarTodasDags,
  parseWebhookHtml,
  salvarArtigosWebhook,
  sincronizarYamls,
} from '../services/RoDOUService';

const prisma = new PrismaClient();

class DiarioOficialController {
  /**
   * GET /api/diario/artigos
   * Query params: fonte, busca, salvo (true|false), data (YYYY-MM-DD), pagina, limite
   */
  async listarArtigos(req: Request, res: Response) {
    try {
      const { fonte, busca, salvo, data, pagina = 1, limite = 20 } = req.query;

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
        const qRaw = Array.isArray(busca) ? busca[0] : busca;
        const q = typeof qRaw === 'string' ? qRaw : '';
        where.OR = [
          { titulo: { contains: q, mode: 'insensitive' } },
          { resumo: { contains: q, mode: 'insensitive' } },
          { orgao: { contains: q, mode: 'insensitive' } },
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
        paginacao: { total, pagina: p, limite: l, totalPaginas: Math.ceil(total / l) },
      });
    } catch (error) {
      console.error('DiarioOficialController.listarArtigos:', error);
      res.status(500).json({ erro: 'Erro ao listar artigos.' });
    }
  }

  /**
   * PATCH /api/diario/artigos/:id/salvar
   */
  async salvarArtigo(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const artigo = await prisma.diarioOficialArtigo.findUnique({ where: { id } });
      if (!artigo) return res.status(404).json({ erro: 'Artigo não encontrado.' });

      const novoEstado = !artigo.salvo;
      const atualizado = await prisma.diarioOficialArtigo.update({
        where: { id },
        data: { salvo: novoEstado, salvoEm: novoEstado ? new Date() : null },
      });

      res.json(atualizado);
    } catch (error) {
      console.error('DiarioOficialController.salvarArtigo:', error);
      res.status(500).json({ erro: 'Erro ao atualizar artigo.' });
    }
  }

  /**
   * POST /api/diario/coletar
   * Aciona o Ro-DOU via API do Airflow; fallback para coleta legada se Airflow indisponível.
   */
  async coletar(_req: Request, res: Response) {
    try {
      const rodouAtivo = await airflowDisponivel();

      if (rodouAtivo) {
        // Sincroniza YAMLs das preferências e dispara todos os DAGs
        sincronizarYamls().catch((e) =>
          console.error('[DiarioOficialController] Erro ao sincronizar YAMLs:', e),
        );
        const runs = await acionarTodasDags();
        return res.json({
          mensagem: `Coleta iniciada via Ro-DOU: ${runs.length} DAG(s) acionado(s).`,
          dags: runs,
        });
      }

      // Fallback: coleta legada
      res.json({ mensagem: 'Ro-DOU indisponível — coleta legada iniciada em segundo plano.' });
      executarColeta()
        .then(() => console.log('[DiarioOficialController] Coleta legada concluída.'))
        .catch((err) => console.error('[DiarioOficialController] Erro na coleta legada:', err));
    } catch (error) {
      console.error('DiarioOficialController.coletar:', error);
      res.status(500).json({ erro: 'Erro ao iniciar coleta.' });
    }
  }

  /**
   * POST /api/diario/webhook-rodou
   * Recebe resultados do Ro-DOU via Apprise (json://) e persiste no banco.
   */
  async webhookRoDOU(req: Request, res: Response) {
    try {
      const { title, message, type } = req.body as {
        title?: string;
        message?: string;
        type?: string;
      };

      if (!message) {
        return res.status(400).json({ erro: 'Payload inválido: campo message ausente.' });
      }

      // Ro-DOU envia type="info" apenas quando há resultados; ignorar outros
      if (type && type !== 'info' && type !== 'success') {
        return res.json({ ignorado: true, type });
      }

      const artigos = parseWebhookHtml(message);
      console.log(`[DiarioOficialController] Webhook Ro-DOU "${title}": ${artigos.length} artigos extraídos.`);

      const salvos = await salvarArtigosWebhook(artigos);
      res.json({ recebidos: artigos.length, salvos });
    } catch (error) {
      console.error('DiarioOficialController.webhookRoDOU:', error);
      res.status(500).json({ erro: 'Erro ao processar webhook.' });
    }
  }

  /**
   * GET /api/diario/preferencias
   */
  async listarPreferencias(_req: Request, res: Response) {
    try {
      const preferencias = await prisma.diarioOficialPreferencia.findMany({
        orderBy: { criadoEm: 'desc' },
      });

      const resultado = preferencias.map((p) => ({
        ...p,
        termos: (() => {
          try { return JSON.parse(p.termos); }
          catch { return p.termos.split(',').map((t) => t.trim()).filter(Boolean); }
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
   */
  async criarPreferencia(req: Request, res: Response) {
    try {
      const { titulo, termos, fontes, ativo } = req.body;

      if (!titulo) return res.status(400).json({ erro: 'Título é obrigatório.' });
      if (!Array.isArray(termos) || termos.length === 0)
        return res.status(400).json({ erro: 'Informe ao menos um termo.' });
      if (!Array.isArray(fontes) || fontes.length === 0)
        return res.status(400).json({ erro: 'Informe ao menos uma fonte.' });

      const preferencia = await prisma.diarioOficialPreferencia.create({
        data: {
          titulo,
          termos: JSON.stringify(termos),
          fontes: fontes.join(','),
          ativo: ativo !== undefined ? Boolean(ativo) : true,
        },
      });

      // Gera YAML para o Ro-DOU em background
      sincronizarYamls().catch(() => {});

      res.status(201).json({ ...preferencia, termos, fontes });
    } catch (error) {
      console.error('DiarioOficialController.criarPreferencia:', error);
      res.status(500).json({ erro: 'Erro ao criar preferência.' });
    }
  }

  /**
   * PUT /api/diario/preferencias/:id
   */
  async atualizarPreferencia(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { titulo, termos, fontes, ativo } = req.body;

      const exists = await prisma.diarioOficialPreferencia.findUnique({ where: { id } });
      if (!exists) return res.status(404).json({ erro: 'Preferência não encontrada.' });

      const updateData: any = {};
      if (titulo !== undefined) updateData.titulo = titulo;
      if (termos !== undefined)
        updateData.termos = JSON.stringify(Array.isArray(termos) ? termos : [termos]);
      if (fontes !== undefined)
        updateData.fontes = Array.isArray(fontes) ? fontes.join(',') : String(fontes);
      if (ativo !== undefined) updateData.ativo = Boolean(ativo);

      const atualizada = await prisma.diarioOficialPreferencia.update({
        where: { id },
        data: updateData,
      });

      sincronizarYamls().catch(() => {});

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
      sincronizarYamls().catch(() => {});

      res.json({ mensagem: 'Preferência removida com sucesso.' });
    } catch (error) {
      console.error('DiarioOficialController.deletarPreferencia:', error);
      res.status(500).json({ erro: 'Erro ao deletar preferência.' });
    }
  }

  /**
   * GET /api/diario/diagnostico
   */
  async diagnostico(_req: Request, res: Response) {
    try {
      const [totalBanco, ultimaPublicacao, rodouAtivo] = await Promise.all([
        prisma.diarioOficialArtigo.count(),
        prisma.diarioOficialArtigo.findFirst({
          orderBy: { dataPublicacao: 'desc' },
          select: { dataPublicacao: true, fonte: true },
        }),
        airflowDisponivel(),
      ]);

      res.json({ rodouAtivo, totalBanco, ultimaPublicacao });
    } catch (error) {
      console.error('DiarioOficialController.diagnostico:', error);
      res.status(500).json({ erro: 'Erro ao obter diagnóstico.' });
    }
  }
}

export default new DiarioOficialController();
