import { Request, Response } from 'express';
import repository from './fns.repository';
import service from './fns.service';
import { RespostaPaginada, DespesaFNS, TransferenciaFNS, ConvenioFNS } from './fns.types';

class FNSController {
    async listarDespesas(req: Request, res: Response) {
        try {
            const { ano, mes, pagina, limite } = req.query;
            if (!ano || !mes) {
                return res.status(400).json({ erro: 'Parâmetros ano e mes são obrigatórios.' });
            }

            const p = Math.max(parseInt(pagina as string) || 1, 1);
            const l = Math.min(parseInt(limite as string) || 20, 100);

            const { rows, total } = await repository.listarDespesas({
                ano: parseInt(ano as string),
                mes: parseInt(mes as string),
                pagina: p,
                limite: l
            });

            const resposta: RespostaPaginada<DespesaFNS> = {
                dados: rows,
                paginacao: {
                    total,
                    pagina: p,
                    limite: l,
                    totalPaginas: Math.ceil(total / l)
                }
            };

            res.json(resposta);
        } catch (error) {
            res.status(500).json({ erro: 'Erro ao buscar despesas.' });
        }
    }

    async listarTransferencias(req: Request, res: Response) {
        try {
            const { codigoIBGE, ano, pagina, limite } = req.query;
            if (!codigoIBGE || !ano) {
                return res.status(400).json({ erro: 'Código IBGE e Ano são obrigatórios.' });
            }

            const p = Math.max(parseInt(pagina as string) || 1, 1);
            const l = Math.min(parseInt(limite as string) || 20, 100);

            const { rows, total } = await repository.listarTransferencias({
                codigoIBGE: codigoIBGE as string,
                ano: parseInt(ano as string),
                pagina: p,
                limite: l
            });

            const resposta: RespostaPaginada<TransferenciaFNS> = {
                dados: rows,
                paginacao: {
                    total,
                    pagina: p,
                    limite: l,
                    totalPaginas: Math.ceil(total / l)
                }
            };

            res.json(resposta);
        } catch (error) {
            res.status(500).json({ erro: 'Erro ao buscar transferências.' });
        }
    }

    async getResumoMunicipio(req: Request, res: Response) {
        try {
            const { ibge } = req.params;
            const { ano } = req.query;
            if (!ibge || !ano) {
                return res.status(400).json({ erro: 'Código IBGE e Ano são obrigatórios.' });
            }

            const resumo = await repository.resumoMunicipio(ibge as string, parseInt(ano as string));
            res.json({ dados: resumo });
        } catch (error) {
            res.status(500).json({ erro: 'Erro ao gerar resumo do município.' });
        }
    }

    async listarConvenios(req: Request, res: Response) {
        try {
            const { ano, situacao, pagina, limite } = req.query;
            if (!ano) {
                return res.status(400).json({ erro: 'O parâmetro ano é obrigatório.' });
            }

            const p = Math.max(parseInt(pagina as string) || 1, 1);
            const l = Math.min(parseInt(limite as string) || 20, 100);

            const { rows, total } = await repository.listarConvenios({
                ano: parseInt(ano as string),
                situacao: situacao as string,
                pagina: p,
                limite: l
            });

            const resposta: RespostaPaginada<ConvenioFNS> = {
                dados: rows,
                paginacao: {
                    total,
                    pagina: p,
                    limite: l,
                    totalPaginas: Math.ceil(total / l)
                }
            };

            res.json(resposta);
        } catch (error) {
            res.status(500).json({ erro: 'Erro ao buscar convênios.' });
        }
    }

    async sincronizar(req: Request, res: Response) {
        try {
            const { ano, ibge } = req.body;
            if (!ano || !ibge) {
                return res.status(400).json({ erro: 'Parâmetros ano e ibge são obrigatórios para sincronismo.' });
            }

            // 1. Sincronizar Transferências (Resumo do Município)
            const transferencias = await service.getTransferenciasMunicipio({ codigoIBGE: ibge, ano: parseInt(ano) });
            for (const t of transferencias) {
                await repository.saveTransferencia({
                    codigoIbge: ibge,
                    municipio: t.municipio?.nome || '—',
                    valor: t.valor,
                    bloco: t.naturezaDespesa?.descricao || 'Outros',
                    ano: parseInt(ano),
                    rawJson: t
                });
            }

            // 2. Sincronizar Convênios
            const convenios = await service.getConveniosSaude({ ano: parseInt(ano) });
            for (const c of convenios) {
                await repository.saveConvenio({
                    numero: c.numeroConvenio,
                    objeto: c.objetoConvenio,
                    valorGlobal: c.valorGlobal,
                    situacao: c.situacaoConvenio,
                    dataInicio: c.dataInicioVigencia,
                    dataFim: c.dataFimVigencia,
                    rawJson: c
                });
            }

            res.json({ mensagem: 'Sincronização concluída com sucesso.', totalTransferencias: transferencias.length, totalConvenios: convenios.length });
        } catch (error: any) {
            console.error('FNS Sync Error:', error.message);
            res.status(500).json({ erro: 'Erro durante a sincronização dos dados FNS.' });
        }
    }
}

export default new FNSController();
