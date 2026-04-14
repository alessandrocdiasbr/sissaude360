const repository = require('./fns.repository');

class FNSController {
    async listarDespesas(req, res) {
        try {
            const { ano, mes, pagina, limite } = req.query;
            if (!ano || !mes) {
                return res.status(400).json({ erro: 'Parâmetros ano e mes são obrigatórios.' });
            }

            const { rows, total } = await repository.listarDespesas({
                ano: parseInt(ano),
                mes: parseInt(mes),
                pagina: parseInt(pagina) || 1,
                limite: parseInt(limite) || 20
            });

            res.json({
                dados: rows,
                paginacao: {
                    total,
                    pagina: parseInt(pagina) || 1,
                    limite: parseInt(limite) || 20,
                    totalPaginas: Math.ceil(total / (parseInt(limite) || 20))
                }
            });
        } catch (error) {
            res.status(500).json({ erro: 'Erro ao buscar despesas.' });
        }
    }

    async listarTransferencias(req, res) {
        try {
            const { codigoIBGE, ano, pagina, limite } = req.query;
            if (!codigoIBGE || !ano) {
                return res.status(400).json({ erro: 'Código IBGE e Ano são obrigatórios.' });
            }

            const { rows, total } = await repository.listarTransferencias({
                codigoIBGE,
                ano: parseInt(ano),
                pagina: parseInt(pagina) || 1,
                limite: parseInt(limite) || 20
            });

            res.json({
                dados: rows,
                paginacao: {
                    total,
                    pagina: parseInt(pagina) || 1,
                    limite: parseInt(limite) || 20,
                    totalPaginas: Math.ceil(total / (parseInt(limite) || 20))
                }
            });
        } catch (error) {
            res.status(500).json({ erro: 'Erro ao buscar transferências.' });
        }
    }

    async getResumoMunicipio(req, res) {
        try {
            const { ibge } = req.params;
            const { ano } = req.query;
            if (!ibge || !ano) {
                return res.status(400).json({ erro: 'Código IBGE e Ano são obrigatórios.' });
            }

            const resumo = await repository.resumoMunicipio(ibge, parseInt(ano));
            res.json({ dados: resumo });
        } catch (error) {
            res.status(500).json({ erro: 'Erro ao gerar resumo do município.' });
        }
    }

    async listarConvenios(req, res) {
        try {
            const { ano, situacao, pagina, limite } = req.query;
            if (!ano) {
                return res.status(400).json({ erro: 'O parâmetro ano é obrigatório.' });
            }

            const { rows, total } = await repository.listarConvenios({
                ano: parseInt(ano),
                situacao,
                pagina: parseInt(pagina) || 1,
                limite: parseInt(limite) || 20
            });

            res.json({
                dados: rows,
                paginacao: {
                    total,
                    pagina: parseInt(pagina) || 1,
                    limite: parseInt(limite) || 20,
                    totalPaginas: Math.ceil(total / (parseInt(limite) || 20))
                }
            });
        } catch (error) {
            res.status(500).json({ erro: 'Erro ao buscar convênios.' });
        }
    }
}

module.exports = new FNSController();
