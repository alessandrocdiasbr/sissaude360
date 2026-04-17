import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class FilaController {
  // GET /api/ila
  async listarSolicitacoes(req: Request, res: Response) {
    try {
      const {
        status, categoriaId, subCategoriaId,
        unidadeOrigemId, prioridade, dataInicio, dataFim,
        busca, pagina = 1, limite = 20
      } = req.query;

      const p = Math.max(Number(pagina), 1);
      const l = Math.max(Number(limite), 1);
      const skip = (p - 1) * l;

      const where: any = {};

      if (status) where.status = String(status);
      if (categoriaId) where.procedimento = { subCategoria: { categoriaId: String(categoriaId) } };
      if (subCategoriaId) where.procedimento = { subCategoriaId: String(subCategoriaId) };
      if (unidadeOrigemId) where.unidadeOrigemId = String(unidadeOrigemId);
      if (prioridade) where.prioridade = String(prioridade);
      
      if (dataInicio || dataFim) {
        where.dataSolicitacao = {};
        if (dataInicio) where.dataSolicitacao.gte = new Date(String(dataInicio));
        if (dataFim) where.dataSolicitacao.lte = new Date(String(dataFim));
      }

      if (busca) {
        where.OR = [
          { pacienteNome: { contains: String(busca), mode: 'insensitive' } },
          { pacienteCns: { contains: String(busca) } },
          { pacienteCpf: { contains: String(busca) } }
        ];
      }

      const [total, solicitacoes] = await Promise.all([
        prisma.solicitacaoFila.count({ where }),
        prisma.solicitacaoFila.findMany({
          where,
          include: {
            procedimento: {
              include: {
                subCategoria: {
                  include: { categoria: true }
                }
              }
            },
            unidadeOrigem: true
          },
          orderBy: [
            { prioridade: 'asc' }, // URGENCIA < PRIORITARIO < ELETIVA se usarmos ordem alfabética inversa ou mapeamento.
            // Para garantir URGENCIA primeiro: URGENCIA, PRIORITARIO, ELETIVA.
            { dataSolicitacao: 'asc' }
          ],
          skip,
          take: l
        })
      ]);

      // Re-ordenar manualmente para garantir URGENCIA primeiro se o orderBy do banco não for suficiente
      const prioridadeOrdem: Record<string, number> = { 'URGENCIA': 1, 'PRIORITARIO': 2, 'ELETIVA': 3 };
      solicitacoes.sort((a, b) => {
        const ordemA = prioridadeOrdem[a.prioridade] || 99;
        const ordemB = prioridadeOrdem[b.prioridade] || 99;
        if (ordemA !== ordemB) return ordemA - ordemB;
        return a.dataSolicitacao.getTime() - b.dataSolicitacao.getTime();
      });

      res.json({
        dados: solicitacoes,
        paginacao: {
          total,
          pagina: p,
          limite: l,
          totalPaginas: Math.ceil(total / l)
        }
      });
    } catch (error) {
      console.error('FilaController.listarSolicitacoes:', error);
      res.status(500).json({ erro: 'Erro ao listar solicitações.' });
    }
  }

  // GET /api/fila/:id
  async buscarSolicitacao(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const solicitacao = await prisma.solicitacaoFila.findUnique({
        where: { id },
        include: {
          procedimento: {
            include: {
              subCategoria: {
                include: { categoria: true }
              }
            }
          },
          unidadeOrigem: true,
          historico: {
            orderBy: { registradoEm: 'desc' }
          }
        }
      });

      if (!solicitacao) {
        return res.status(404).json({ erro: 'Solicitação não encontrada.' });
      }

      res.json(solicitacao);
    } catch (error) {
      res.status(500).json({ erro: 'Erro ao buscar solicitação.' });
    }
  }

  // POST /api/fila
  async criarSolicitacao(req: Request, res: Response) {
    try {
      const {
        pacienteNome, pacienteCns, pacienteCpf, pacienteNascimento,
        pacienteTelefone, procedimentoId, prioridade, status,
        unidadeOrigemId, unidadeDestinoNome, medicoSolicitante,
        crmSolicitante, observacoes
      } = req.body;
      
      const usuario = (req as any).usuario; 

      const solicitacao = await prisma.$transaction(async (tx) => {
        const nova = await tx.solicitacaoFila.create({
          data: {
            pacienteNome,
            pacienteCns,
            pacienteCpf,
            pacienteNascimento: pacienteNascimento ? new Date(pacienteNascimento) : null,
            pacienteTelefone,
            procedimentoId,
            prioridade: prioridade || 'ELETIVA',
            unidadeOrigemId,
            unidadeDestinoNome,
            medicoSolicitante,
            crmSolicitante,
            observacoes,
            status: status || 'AGUARDANDO'
          }
        });

        await tx.historicoFila.create({
          data: {
            solicitacaoId: nova.id,
            statusNovo: status || 'AGUARDANDO',
            observacao: 'Solicitação registrada no sistema.',
            registradoPor: usuario?.nome || 'Sistema'
          }
        });

        return nova;
      });

      res.status(201).json(solicitacao);
    } catch (error) {
      console.error('FilaController.criarSolicitacao:', error);
      res.status(500).json({ erro: 'Erro ao criar solicitação.' });
    }
  }

  // PATCH /api/fila/:id/status
  async atualizarStatus(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const { novoStatus, observacao, motivoCancelamento, dataAgendamento } = req.body;
      const usuario = (req as any).usuario;

      const atual = await prisma.solicitacaoFila.findUnique({ where: { id } });
      if (!atual) return res.status(404).json({ erro: 'Solicitação não encontrada.' });

      if (novoStatus === 'AGENDADO' && !dataAgendamento) {
        return res.status(400).json({ erro: 'Data de agendamento é obrigatória para o status AGENDADO.' });
      }

      const updateData: any = { status: novoStatus };
      if (novoStatus === 'AGENDADO') updateData.dataAgendamento = new Date(dataAgendamento);
      if (novoStatus === 'ATENDIDO') updateData.dataAtendimento = new Date();
      if (motivoCancelamento) updateData.motivoCancelamento = motivoCancelamento;
      if (observacao) updateData.observacoes = observacao;

      const solicitacao = await prisma.$transaction(async (tx) => {
        const atualizada = await tx.solicitacaoFila.update({
          where: { id },
          data: updateData
        });

        await tx.historicoFila.create({
          data: {
            solicitacaoId: id,
            statusAnterior: atual.status,
            statusNovo: novoStatus,
            observacao: observacao || `Status alterado de ${atual.status} para ${novoStatus}.`,
            registradoPor: usuario?.nome || 'Sistema'
          }
        });

        return atualizada;
      });

      res.json(solicitacao);
    } catch (error) {
      res.status(500).json({ erro: 'Erro ao atualizar status.' });
    }
  }

  // PUT /api/fila/:id
  async atualizarSolicitacao(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const dados = req.body;

      // Impede atualização de status por esta rota (usar /status)
      delete dados.status;

      const solicitacao = await prisma.solicitacaoFila.update({
        where: { id },
        data: dados
      });

      res.json(solicitacao);
    } catch (error) {
      res.status(500).json({ erro: 'Erro ao atualizar solicitação.' });
    }
  }

  // GET /api/fila/estatisticas
  async estatisticas(req: Request, res: Response) {
    try {
      const [porStatus, porPrioridade, porCategoriaRaw] = await Promise.all([
        prisma.solicitacaoFila.groupBy({ by: ['status'], _count: { id: true } }),
        prisma.solicitacaoFila.groupBy({ by: ['prioridade'], _count: { id: true } }),
        prisma.solicitacaoFila.findMany({
          include: {
            procedimento: {
              include: {
                subCategoria: {
                  include: { categoria: true }
                }
              }
            }
          }
        })
      ]);

      // Processar tempo médio de espera (últimos 30 dias)
      const trintaDiasAtras = new Date();
      trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);

      const atendidosRecentes = await prisma.solicitacaoFila.findMany({
        where: {
          status: 'ATENDIDO',
          dataAtendimento: { gte: trintaDiasAtras }
        },
        select: { dataSolicitacao: true, dataAtendimento: true }
      });

      let tempoMedioEsperaDias = 0;
      if (atendidosRecentes.length > 0) {
        const somaDias = atendidosRecentes.reduce((acc, s) => {
          if (!s.dataAtendimento) return acc;
          const diff = s.dataAtendimento.getTime() - s.dataSolicitacao.getTime();
          return acc + (diff / (1000 * 60 * 60 * 24));
        }, 0);
        tempoMedioEsperaDias = Number((somaDias / atendidosRecentes.length).toFixed(1));
      }

      // Processar por categoria (manual já que o groupBy do Prisma é limitado para relações aninhadas)
      const porCategoria: Record<string, number> = {};
      porCategoriaRaw.forEach(s => {
        const catNome = s.procedimento.subCategoria.categoria.nome;
        porCategoria[catNome] = (porCategoria[catNome] || 0) + 1;
      });

      res.json({
        porStatus: Object.fromEntries(porStatus.map(s => [s.status, s._count.id])),
        porCategoria,
        porPrioridade: Object.fromEntries(porPrioridade.map(p => [p.prioridade, p._count.id])),
        tempoMedioEsperaDias
      });
    } catch (error) {
      console.error('FilaController.estatisticas:', error);
      res.status(500).json({ erro: 'Erro ao buscar estatísticas.' });
    }
  }

  // GET /api/fila/categorias
  async listarCategorias(req: Request, res: Response) {
    try {
      const categorias = await prisma.categoriaProcedimento.findMany({
        include: {
          subCategorias: {
            include: {
              procedimentos: {
                where: { ativo: true },
                orderBy: { nome: 'asc' }
              }
            }
          }
        },
        orderBy: { nome: 'asc' }
      });
      res.json(categorias);
    } catch (error) {
      res.status(500).json({ erro: 'Erro ao listar categorias.' });
    }
  }

  // GET /api/fila/procedimentos
  async listarProcedimentos(req: Request, res: Response) {
    try {
      const { subCategoriaId } = req.query;
      const where = subCategoriaId ? { subCategoriaId: String(subCategoriaId), ativo: true } : { ativo: true };
      
      const procedimentos = await prisma.procedimento.findMany({
        where,
        orderBy: { nome: 'asc' },
        include: { subCategoria: { include: { categoria: true } } }
      });
      res.json(procedimentos);
    } catch (error) {
      res.status(500).json({ erro: 'Erro ao listar procedimentos.' });
    }
  }
}

export default new FilaController();
