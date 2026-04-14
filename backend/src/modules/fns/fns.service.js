const axios = require('axios');

const API_BASE_URL = 'https://api.portaldatransparencia.gov.br/api-de-dados';
const API_KEY = process.env.TRANSPARENCIA_API_KEY;
const MS_ORGAO_COD = '36000';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

class FNSService {
    constructor() {
        this.api = axios.create({
            baseURL: API_BASE_URL,
            headers: {
                'Accept': 'application/json',
                'chave-api-dados': API_KEY
            }
        });
    }

    async getDespesasSaude({ ano, mes, pagina = 1 }) {
        try {
            await sleep(700);
            const response = await this.api.get('/despesas/por-orgao', {
                params: { codigoOrgao: MS_ORGAO_COD, mes, ano, pagina }
            });
            return response.data || [];
        } catch (error) {
            console.error('FNS: Erro ao buscar despesas do MS:', error.message);
            return [];
        }
    }

    async getTransferenciasMunicipio({ codigoIBGE, ano, pagina = 1 }) {
        try {
            await sleep(700);
            const response = await this.api.get('/transferencias/natureza', {
                params: { codigoMunicipio: codigoIBGE, ano, pagina }
            });
            return response.data || [];
        } catch (error) {
            console.error('FNS: Erro ao buscar transferências do município:', error.message);
            return [];
        }
    }

    async getConveniosSaude({ ano, situacao, pagina = 1 }) {
        try {
            await sleep(700);
            const response = await this.api.get('/convenios', {
                params: { codigoOrgao: MS_ORGAO_COD, ano, situacao, pagina }
            });
            return response.data || [];
        } catch (error) {
            console.error('FNS: Erro ao buscar convênios de saúde:', error.message);
            return [];
        }
    }
}

module.exports = new FNSService();
