import { Request, Response } from 'express';
import repository from './fns.repository';
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

            const resumo = await repository.resumoMunicipio(ibge, parseInt(ano as string));
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
}

export default new FNSController();
