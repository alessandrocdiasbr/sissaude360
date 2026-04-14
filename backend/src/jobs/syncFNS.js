const cron = require('node-cron');
const fnsService = require('../modules/fns/fns.service');
const repository = require('../modules/fns/fns.repository');

const MUNICIPIO_PADRAO_IBGE = '310620'; // Exemplo para o município

const startFNSJob = () => {
    // Rodar todo dia às 02:00 da manhã
    cron.schedule('0 2 * * *', async () => {
        const startTime = Date.now();
        console.log(`[${new Date().toISOString()}] Iniciando Sincronização FNS...`);

        try {
            const agora = new Date();
            const anoAtual = agora.getFullYear();
            const mesAtual = String(agora.getMonth() + 1).padStart(2, '0');

            let totais = { despesas: 0, transferencias: 0, convenios: 0 };

            // 1. Sincronizar Despesas (Paginado)
            let pagina = 1;
            let temMais = true;
            while (temMais) {
                const lote = await fnsService.getDespesasSaude({ ano: anoAtual, mes: mesAtual, pagina });
                if (lote && lote.length > 0) {
                    for (const item of lote) {
                        await repository.saveDespesa({
                            codigoOrgao: '36000', // Código fixo do MS conforme requisito
                            descricao: item.elementoDespesa?.nome || 'Não especificada',
                            valor: item.valorLiquidado || 0,
                            competencia: `${mesAtual}/${anoAtual}`,
                            raw_json: item
                        });
                        totais.despesas++;
                    }
                    pagina++;
                } else {
                    temMais = false;
                }
            }

            // 2. Sincronizar Transferências do Ano Atual
            const transferencias = await fnsService.getTransferenciasMunicipio({
                codigoIBGE: MUNICIPIO_PADRAO_IBGE,
                ano: anoAtual
            });
            for (const trans of transferencias) {
                await repository.saveTransferencia({
                    codigoIbge: MUNICIPIO_PADRAO_IBGE,
                    municipio: trans.municipio?.nome || 'Belo Horizonte',
                    valor: trans.valor || 0,
                    bloco: trans.subfuncao?.nome || 'Saúde',
                    ano: anoAtual,
                    raw_json: trans
                });
                totais.transferencias++;
            }

            // 3. Sincronizar Convênios do Ano Atual
            const convenios = await fnsService.getConveniosSaude({ ano: anoAtual });
            for (const conv of convenios) {
                await repository.saveConvenio({
                    numero: conv.numero,
                    objeto: conv.objeto,
                    valorGlobal: conv.valorGlobal,
                    situacao: conv.situacao,
                    dataInicio: conv.dataInicio,
                    dataFim: conv.dataFim,
                    raw_json: conv
                });
                totais.convenios++;
            }

            const duration = ((Date.now() - startTime) / 1000).toFixed(2);
            console.log(`[${new Date().toISOString()}] Job FNS concluído com sucesso!`);
            console.log(`- Duração: ${duration}s`);
            console.log(`- Despesas: ${totais.despesas} | Transferências: ${totais.transferencias} | Convênios: ${totais.convenios}`);

        } catch (error) {
            console.error(`[${new Date().toISOString()}] Erro no Job FNS:`, error.message);
        }
    });

    console.log('🚀 Job FNS Agendado: Todo dia às 02:00h');
};

module.exports = { startFNSJob };
