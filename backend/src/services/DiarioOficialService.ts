/**
 * Fallback de coleta legada: chamado somente quando o Ro-DOU (Airflow) está indisponível.
 * Sem scrapers ativos, apenas emite aviso; o Ro-DOU é a fonte primária.
 */
export async function executarColeta(): Promise<void> {
  console.warn('[DiarioOficialService] Ro-DOU indisponível. Coleta legada não possui scrapers ativos.');
  console.warn('[DiarioOficialService] Inicie o perfil "rodou" para coletar publicações do DOU.');
}

export default { executarColeta };
