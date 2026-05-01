# CLAUDE.md — Módulo e-SUS PEC Analytics

## CONTEXTO DO PROJETO EXISTENTE

Este projeto já está em desenvolvimento com a seguinte stack:
- **Backend**: Node.js + TypeScript + Express + Prisma ORM
- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **Banco da aplicação**: PostgreSQL via Prisma
- **Infraestrutura**: Docker + docker-compose

### Convenções do projeto (SIGA RIGOROSAMENTE):
- Backend usa **TypeScript** em todos os arquivos (`.ts`)
- ORM é **Prisma** — nunca usar `pg` diretamente para o banco da aplicação
- Controllers ficam em `backend/src/controllers/`
- Routes ficam em `backend/src/routes/`
- Services ficam em `backend/src/services/`
- Módulos de domínio ficam em `backend/src/modules/`
- Jobs/cron ficam em `backend/src/jobs/`
- Middlewares ficam em `backend/src/middlewares/`

---

## TAREFA: Criar Módulo e-SUS PEC Analytics

### O que é:
Sistema que lê o banco de dados PostgreSQL do e-SUS PEC em modo **somente leitura**,
extrai dados clínicos e de produção, gerencia uma fila de procedimentos/encaminhamentos
e calcula os indicadores do programa **Saúde Brasil 360**.

### Regra crítica de segurança:
O banco do e-SUS NUNCA é escrito. Toda escrita vai para o banco da aplicação via Prisma.
A conexão com o e-SUS usa um pool `pg` separado configurado como read-only.

---

## PASSO 1 — Instalar dependência única para o e-SUS

```bash
cd backend
npm install pg
npm install --save-dev @types/pg
```

> Justificativa: Prisma não suporta múltiplos bancos de dados com schemas diferentes.
> Usamos `pg` APENAS para ler o e-SUS. O banco da aplicação continua via Prisma.

---

## PASSO 2 — Variáveis de Ambiente

Adicionar ao `backend/.env.example` e ao `backend/.env`:

```env
# ─── e-SUS PEC (somente leitura) ───────────────────────────────
ESUS_DB_HOST=192.168.1.100
ESUS_DB_PORT=5433
ESUS_DB_NAME=esus
ESUS_DB_USER=esus_readonly
ESUS_DB_PASSWORD=senha_readonly_aqui

# ─── Configuração Municipal ─────────────────────────────────────
MUNICIPIO_IBGE=000000
MUNICIPIO_NOME=Nome do Município
```

---

## PASSO 3 — Criar Conexão com o e-SUS

**Criar arquivo**: `backend/src/config/esusDb.ts`

```typescript
import { Pool, QueryResult } from 'pg';

const esusPool = new Pool({
  host: process.env.ESUS_DB_HOST,
  port: Number(process.env.ESUS_DB_PORT) || 5433,
  database: process.env.ESUS_DB_NAME,
  user: process.env.ESUS_DB_USER,
  password: process.env.ESUS_DB_PASSWORD,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Garantir read-only em toda conexão ao ser obtida do pool
esusPool.on('connect', async (client) => {
  await client.query('SET default_transaction_read_only = on');
});

esusPool.on('error', (err) => {
  console.error('[e-SUS DB] Erro no pool de conexão:', err.message);
});

export const esusQuery = async <T = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> => {
  const client = await esusPool.connect();
  try {
    return await client.query<T>(text, params);
  } finally {
    client.release();
  }
};

export const testEsusConnection = async (): Promise<boolean> => {
  try {
    await esusQuery('SELECT 1');
    console.log('[e-SUS DB] Conexão estabelecida com sucesso');
    return true;
  } catch (err: any) {
    console.error('[e-SUS DB] Falha na conexão:', err.message);
    return false;
  }
};

export default esusPool;
```

---

## PASSO 4 — Schema Prisma (banco da aplicação)

Adicionar ao final do arquivo `backend/prisma/schema.prisma` existente:

```prisma
// ─── Módulo e-SUS PEC Analytics ────────────────────────────────

model EsusQueueItem {
  id              String   @id @default(uuid())
  patientCns      String   @db.VarChar(15)
  patientName     String   @db.VarChar(255)
  type            EsusQueueType
  description     String
  specialty       String?  @db.VarChar(100)
  cid10           String?  @db.VarChar(10)
  ciap2           String?  @db.VarChar(10)
  priority        EsusPriority @default(MEDIA)
  status          EsusQueueStatus @default(AGUARDANDO)
  sourceEsusId    String?  @db.VarChar(100)
  requestedByCns  String?  @db.VarChar(15)
  requestedAt     DateTime
  scheduledAt     DateTime?
  notes           String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  auditLogs       EsusQueueAuditLog[]

  @@index([patientCns])
  @@index([status])
  @@index([type])
  @@index([priority])
  @@index([sourceEsusId])
  @@map("esus_queue_items")
}

model EsusQueueAuditLog {
  id          String   @id @default(uuid())
  queueItemId String
  action      String   @db.VarChar(50)
  oldStatus   String?  @db.VarChar(50)
  newStatus   String?  @db.VarChar(50)
  performedBy String   @db.VarChar(100)
  notes       String?
  createdAt   DateTime @default(now())

  queueItem   EsusQueueItem @relation(fields: [queueItemId], references: [id])

  @@map("esus_queue_audit_logs")
}

model EsusSyncLog {
  id            String   @id @default(uuid())
  syncType      String   @db.VarChar(100)
  startedAt     DateTime @default(now())
  finishedAt    DateTime?
  recordsFound  Int      @default(0)
  status        String   @db.VarChar(20)
  errorMessage  String?

  @@map("esus_sync_logs")
}

enum EsusQueueType {
  PROCEDURE
  REFERRAL
  EXAM
}

enum EsusPriority {
  URGENTE
  ALTA
  MEDIA
  BAIXA
}

enum EsusQueueStatus {
  AGUARDANDO
  AGENDADO
  REALIZADO
  CANCELADO
}
```

Após editar o schema, rodar:
```bash
cd backend
npx prisma migrate dev --name add_esus_module
npx prisma generate
```

---

## PASSO 5 — Types TypeScript do Módulo

**Criar arquivo**: `backend/src/modules/esus/esus.types.ts`

```typescript
// Filtros comuns
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface DateRangeParams {
  dateFrom?: string;
  dateTo?: string;
}

// Pacientes
export interface PatientFilters extends PaginationParams {
  search?: string;  // busca por nome ou CNS
  ine?: string;     // código da equipe
}

export interface EsusPatient {
  id: string;
  nome: string;
  cns: string;
  cpf?: string;
  dataNascimento: string;
  sexo: string;
  telefone?: string;
  bairro?: string;
  logradouro?: string;
  ativo: boolean;
}

// Encaminhamentos
export interface ReferralFilters extends PaginationParams, DateRangeParams {
  specialty?: string;
  ine?: string;
}

export interface EsusReferral {
  id: string;
  pacienteNome: string;
  pacienteCns: string;
  especialidadeDestino: string;
  cid10?: string;
  ciap2?: string;
  hipoteseDiagnostica?: string;
  profissionalSolicitante: string;
  cbo?: string;
  dtSolicitacao: string;
  classificacaoRisco?: string;
  unidadeSaude?: string;
  observacao?: string;
}

// Produção
export interface ProductionFilters extends DateRangeParams {
  ine?: string;
  cbo?: string;
}

export interface ProfessionalProduction {
  cnsProfissional: string;
  nomeProfissional: string;
  cbo: string;
  equipe: string;
  ine: string;
  totalAtendimentosIndividuais: number;
  totalAtendimentosOdonto: number;
  totalVisitasDomiciliares: number;
  totalAtividadesColetivas: number;
  totalProcedimentos: number;
  mediaAtendimentosDia: number;
}

// Indicadores SB360
export type IndicatorCode =
  | 'IND_01' | 'IND_02' | 'IND_03' | 'IND_04'
  | 'IND_05' | 'IND_06' | 'IND_07' | 'IND_08';

export interface IndicatorResult {
  code: IndicatorCode;
  name: string;
  description: string;
  numerador: number;
  denominador: number;
  resultado: number;      // percentual 0-100
  meta: number;           // percentual 0-100
  status: 'atingido' | 'em_andamento' | 'critico';
  trend?: number;         // diferença vs mês anterior
}

export interface IndicatorFilters {
  competencia: string;   // formato 'AAAAMM', ex: '202501'
  ine?: string;
}

// Fila
export interface QueueFilters extends PaginationParams {
  status?: string;
  type?: string;
  priority?: string;
  specialty?: string;
  search?: string;
}

export interface CreateQueueItemDto {
  patientCns: string;
  patientName: string;
  type: 'PROCEDURE' | 'REFERRAL' | 'EXAM';
  description: string;
  specialty?: string;
  cid10?: string;
  ciap2?: string;
  priority?: 'URGENTE' | 'ALTA' | 'MEDIA' | 'BAIXA';
  sourceEsusId?: string;
  requestedByCns?: string;
  requestedAt: string;
  notes?: string;
}

export interface UpdateQueueStatusDto {
  status: 'AGUARDANDO' | 'AGENDADO' | 'REALIZADO' | 'CANCELADO';
  scheduledAt?: string;
  notes?: string;
  performedBy: string;
}
```

---

## PASSO 6 — Services

### 6.1 — `backend/src/services/esusPatients.service.ts`

Criar service que usa `esusQuery` de `config/esusDb.ts`.
Implementar as funções:

```typescript
// getAllPatients(filters: PatientFilters): Promise<{ data: EsusPatient[], total: number }>
// - SELECT em tb_cidadao
// - Campos: co_seq_cidadao as id, no_cidadao as nome, nu_cns as cns,
//           nu_cpf as cpf, dt_nascimento, co_sexo, nu_telefone_celular,
//           no_bairro, ds_logradouro, st_ativo
// - WHERE st_ativo = true
// - Se search: AND (no_cidadao ILIKE $1 OR nu_cns = $2)
// - LIMIT e OFFSET para paginação
// - Segundo query com COUNT(*) para total

// getPatientByCns(cns: string): Promise<EsusPatient | null>
// - Mesmo SELECT + WHERE nu_cns = $1

// getPatientTimeline(cns: string): Promise<any[]>
// - SELECT em tb_fat_atendimento_individual WHERE nu_cns_cidadao = $1
// - Campos: co_seq_fat_atend_indiv, dt_atendimento, no_prof, ds_cbo,
//           ds_cid10, ds_ciap2, ds_tipo_atendimento
// - ORDER BY dt_atendimento DESC LIMIT 50
```

### 6.2 — `backend/src/services/esusReferrals.service.ts`

```typescript
// getAllReferrals(filters: ReferralFilters): Promise<{ data: EsusReferral[], total: number }>
// - JOIN: tb_fat_encaminhamento + tb_cidadao + tb_prof
// - Filtros opcionais: especialidade, período (dt_solicitacao BETWEEN), ine
// - ORDER BY dt_solicitacao DESC

// getReferralsBySpecialty(): Promise<Array<{ especialidade: string, total: number }>>
// - GROUP BY especialidade_destino ORDER BY total DESC

// getReferralStats(filters: DateRangeParams): Promise<object>
// - total, por_especialidade[], por_equipe[], media_dias_aguardando
```

### 6.3 — `backend/src/services/esusProduction.service.ts`

```typescript
// getProductionByProfessional(filters: ProductionFilters): Promise<ProfessionalProduction[]>
// Executar 4 queries em paralelo (Promise.all) e fazer merge por CNS profissional:
//
// Query 1 — atendimentos individuais:
//   SELECT nu_cns_prof, no_prof, ds_cbo, no_equipe, nu_ine,
//          COUNT(*) as total_individuais
//   FROM tb_fat_atendimento_individual
//   WHERE dt_atendimento BETWEEN $1 AND $2
//   GROUP BY nu_cns_prof, no_prof, ds_cbo, no_equipe, nu_ine
//
// Query 2 — atendimentos odontológicos:
//   SELECT nu_cns_prof, COUNT(*) as total_odonto
//   FROM tb_fat_atendimento_odontologico
//   WHERE dt_atendimento BETWEEN $1 AND $2
//   GROUP BY nu_cns_prof
//
// Query 3 — visitas domiciliares:
//   SELECT nu_cns_prof, COUNT(*) as total_visitas
//   FROM tb_fat_visita_domiciliar
//   WHERE dt_visita BETWEEN $1 AND $2
//   GROUP BY nu_cns_prof
//
// Query 4 — atividades coletivas:
//   SELECT nu_cns_prof_responsavel, COUNT(*) as total_atividades
//   FROM tb_fat_atividade_coletiva
//   WHERE dt_atividade BETWEEN $1 AND $2
//   GROUP BY nu_cns_prof_responsavel
//
// Fazer merge dos 4 resultados por CNS do profissional.
// Calcular mediaAtendimentosDia = total / dias úteis no período.

// getProductionByPeriod(filters: { ine?: string, granularity: 'daily'|'weekly'|'monthly' })
// - Série temporal para gráfico
// - Usar DATE_TRUNC('month'|'week'|'day', dt_atendimento)
```

### 6.4 — `backend/src/services/esusIndicators.service.ts`

Implementar uma função para cada indicador. Cada função recebe `(competencia: string, ine?: string)`.

```typescript
// Helpers:
// - parsePeriod(competencia: string): { startDate: Date, endDate: Date }
//   competencia '202501' → startDate: 2025-01-01, endDate: 2025-01-31
//
// - calcStatus(resultado: number, meta: number): 'atingido'|'em_andamento'|'critico'
//   atingido: resultado >= meta
//   em_andamento: resultado >= meta * 0.7
//   critico: resultado < meta * 0.7

// IND_01 — Gestantes com 6+ consultas pré-natal (meta: 60%)
// Denominador: SELECT COUNT(DISTINCT nu_cns_cidadao) FROM tb_fat_atendimento_individual
//   WHERE co_tipo_atendimento = 'PRENATAL' AND dt_atendimento BETWEEN $1 AND $2
// Numerador: mesma tabela HAVING COUNT(*) >= 6

// IND_02 — Gestantes testadas sífilis + HIV (meta: 60%)
// Numerador: gestantes com exame de sífilis AND exame de HIV registrados

// IND_03 — Crianças 0-2 anos com puericultura (meta: 60%)
// Calcular 0-2 anos usando: dt_nascimento > NOW() - INTERVAL '2 years'
// Numerador: crianças com 2+ consultas de puericultura

// IND_04 — Hipertensos com PA registrada (meta: 60%)
// Denominador: tb_fat_problema_condicao_ativa WHERE ds_cid10 LIKE 'I1%'
// Numerador: hipertensos com atendimento E campos de PA não nulos

// IND_05 — Diabéticos com glicemia registrada (meta: 60%)
// Denominador: tb_fat_problema_condicao_ativa WHERE ds_cid10 LIKE 'E1%'
// Numerador: diabéticos com atendimento E registro de glicemia

// IND_06 — Mulheres 25-64 com citopatológico (meta: 30%)
// Denominador: mulheres 25-64 anos cadastradas
// Numerador: tb_fat_procedimento_realizado WHERE co_procedimento = '0203010043'

// IND_07 — Usuários com atendimento odontológico (meta: definida por porte)
// Denominador: população total cadastrada
// Numerador: DISTINCT nu_cns_cidadao em tb_fat_atendimento_odontologico

// IND_08 — Saúde mental: usuários CID F com 2+ consultas (meta: 30%)
// Denominador: tb_fat_problema_condicao_ativa WHERE ds_cid10 LIKE 'F%'
// Numerador: usuários com 2+ atendimentos no período

// getAllIndicators(filters: IndicatorFilters): Promise<IndicatorResult[]>
// Executar todos os 8 indicadores em Promise.all e retornar array
```

### 6.5 — `backend/src/services/esusQueue.service.ts`

```typescript
// Usa Prisma (banco da aplicação) — importar { prisma } do config existente

// getQueue(filters: QueueFilters): Promise<{ data, total }>
// prisma.esusQueueItem.findMany() com where dinâmico, orderBy priority/requestedAt

// addToQueue(data: CreateQueueItemDto): Promise<EsusQueueItem>
// prisma.esusQueueItem.create() + prisma.esusQueueAuditLog.create(action:'created')

// updateStatus(id: string, dto: UpdateQueueStatusDto): Promise<EsusQueueItem>
// Validar transição de status (não permitir voltar de REALIZADO/CANCELADO)
// prisma.esusQueueItem.update() + prisma.esusQueueAuditLog.create()
// Usar prisma.$transaction([]) para garantir atomicidade

// importFromEsus(type: string, dateFrom: string, dateTo: string): Promise<{ imported: number, skipped: number }>
// 1. Buscar encaminhamentos/procedimentos no e-SUS via esusQuery
// 2. Para cada registro, checar se sourceEsusId já existe em esus_queue_items
// 3. Inserir apenas os novos
// 4. Registrar em esus_sync_logs

// getQueueStats(): Promise<object>
// prisma.esusQueueItem.groupBy() por status, type, priority
```

---

## PASSO 7 — Controllers

### `backend/src/controllers/esus.controller.ts`

Criar um único controller com métodos para todos os recursos:

```typescript
import { Request, Response } from 'express';
import * as patientsService from '../services/esusPatients.service';
import * as referralsService from '../services/esusReferrals.service';
import * as productionService from '../services/esusProduction.service';
import * as indicatorsService from '../services/esusIndicators.service';
import * as queueService from '../services/esusQueue.service';

// Cada método deve:
// 1. Extrair params de req.query ou req.params com tipos corretos
// 2. Chamar o service correspondente
// 3. Retornar res.json({ success: true, data: result }) em caso de sucesso
// 4. Retornar res.status(500).json({ success: false, error: err.message }) em caso de erro
// 5. Logar o erro com console.error('[ESUS Controller]', err)

// Métodos a implementar:
// getPatients, getPatientById, getPatientTimeline
// getReferrals, getReferralStats, getReferralsBySpecialty
// getProduction, getProductionByPeriod
// getIndicators, getIndicatorHistory
// getQueue, addToQueue, updateQueueStatus, importFromEsus, getQueueStats
// testConnection — chamar testEsusConnection() e retornar status
```

---

## PASSO 8 — Routes

### `backend/src/routes/esus.routes.ts`

```typescript
import { Router } from 'express';
import * as esusController from '../controllers/esus.controller';
// Importar o middleware de autenticação existente do projeto
// Verificar o nome correto em backend/src/middlewares/

const router = Router();

// Todas as rotas protegidas pelo middleware de auth existente
// router.use(authMiddleware);  ← usar o middleware já existente no projeto

// Diagnóstico
router.get('/test-connection', esusController.testConnection);

// Pacientes
router.get('/patients', esusController.getPatients);
router.get('/patients/:cns', esusController.getPatientById);
router.get('/patients/:cns/timeline', esusController.getPatientTimeline);

// Encaminhamentos
router.get('/referrals', esusController.getReferrals);
router.get('/referrals/stats', esusController.getReferralStats);
router.get('/referrals/by-specialty', esusController.getReferralsBySpecialty);

// Produção
router.get('/production', esusController.getProduction);
router.get('/production/by-period', esusController.getProductionByPeriod);

// Indicadores Saúde Brasil 360
router.get('/indicators', esusController.getIndicators);
router.get('/indicators/:code/history', esusController.getIndicatorHistory);

// Fila de gestão
router.get('/queue', esusController.getQueue);
router.get('/queue/stats', esusController.getQueueStats);
router.post('/queue', esusController.addToQueue);
router.post('/queue/import', esusController.importFromEsus);
router.patch('/queue/:id/status', esusController.updateQueueStatus);

export default router;
```

### Registrar no servidor principal

**Editar** `backend/src/server.ts` — adicionar após as rotas existentes:

```typescript
import esusRoutes from './routes/esus.routes';

// Adicionar junto com as outras rotas:
app.use('/api/esus', esusRoutes);
```

---

## PASSO 9 — Job de Sincronização Automática

### `backend/src/jobs/esusSync.job.ts`

```typescript
// Criar job que roda automaticamente para sincronizar dados do e-SUS.
// Usar 'node-cron' (provavelmente já instalado — verificar package.json).
// Se não estiver, instalar: npm install node-cron @types/node-cron

// Agendar:
//   - A cada 6 horas: importar encaminhamentos dos últimos 7 dias
//   - Diariamente às 00:30: importar procedimentos do mês corrente

// Usar importFromEsus() do esusQueue.service.ts
// Registrar início e fim em esus_sync_logs via Prisma
// Em caso de falha, atualizar sync_log com status 'error' e errorMessage
// NUNCA deixar o job derrubar o servidor — usar try/catch global

// Exportar função startEsusSyncJobs() para ser chamada no server.ts
```

Adicionar em `server.ts`:
```typescript
import { startEsusSyncJobs } from './jobs/esusSync.job';
// Chamar após o app.listen():
startEsusSyncJobs();
```

---

## PASSO 10 — Frontend

### Estrutura de pastas a criar em `frontend/src/`:

```
frontend/src/
├── pages/esus/
│   ├── EsusDashboard.tsx
│   ├── EsusPatients.tsx
│   ├── EsusReferrals.tsx
│   ├── EsusQueue.tsx
│   ├── EsusProduction.tsx
│   └── EsusIndicators.tsx
├── components/esus/
│   ├── QueueTable.tsx
│   ├── IndicatorCard.tsx
│   ├── ProductionTable.tsx
│   └── PatientTimeline.tsx
└── services/esusApi.ts
```

### `frontend/src/services/esusApi.ts`

```typescript
// Criar usando o cliente axios já existente no projeto (verificar services/ existentes)
// baseURL: todas as calls prefixadas com /api/esus
// Exportar objeto esusApi com métodos:

// patients: { getAll(params), getById(cns), getTimeline(cns) }
// referrals: { getAll(params), getStats(params), getBySpecialty() }
// production: { getByProfessional(params), getByPeriod(params) }
// indicators: { getAll(params), getHistory(code, params) }
// queue: {
//   getAll(params),
//   getStats(),
//   add(data),
//   importFromEsus(params),
//   updateStatus(id, data)
// }
```

### `frontend/src/pages/esus/EsusQueue.tsx`

Página mais complexa — criar com:
- Tabela com colunas: Paciente, Tipo (badge), Descrição, Especialidade, Prioridade (badge colorido), Dias Aguardando, Status, Ações
- Filtros: status, tipo, prioridade, especialidade, busca por nome/CNS
- Botão "Importar do e-SUS" → chama /api/esus/queue/import → toast com resultado
- Por linha: dropdown com "Agendar", "Cancelar", "Alterar Prioridade"
- Modal de Agendamento: campo de data e observações
- Usar react-query (TanStack Query) se já estiver no projeto — verificar package.json
- Paginação server-side

### `frontend/src/pages/esus/EsusIndicators.tsx`

- Filtros: competência (mês/ano) e INE
- Grid 2×4 de cards — um por indicador IND_01 a IND_08
- Cada card: nome, numerador/denominador, percentual grande, barra de progresso, status colorido (verde/amarelo/vermelho)
- Gráfico de radar comparando todos os indicadores vs meta (usar recharts se disponível)
- Botão exportar CSV

### Registrar rotas no Router existente

```typescript
// Verificar o arquivo de rotas do frontend (provavelmente App.tsx ou router.tsx)
// Adicionar as rotas do módulo e-SUS:

import EsusDashboard from './pages/esus/EsusDashboard';
import EsusPatients from './pages/esus/EsusPatients';
import EsusReferrals from './pages/esus/EsusReferrals';
import EsusQueue from './pages/esus/EsusQueue';
import EsusProduction from './pages/esus/EsusProduction';
import EsusIndicators from './pages/esus/EsusIndicators';

// <Route path="/esus" element={<EsusDashboard />} />
// <Route path="/esus/patients" element={<EsusPatients />} />
// <Route path="/esus/referrals" element={<EsusReferrals />} />
// <Route path="/esus/queue" element={<EsusQueue />} />
// <Route path="/esus/production" element={<EsusProduction />} />
// <Route path="/esus/indicators" element={<EsusIndicators />} />
```

Adicionar os itens no menu de navegação lateral existente com ícone e label "e-SUS PEC".

---

## PASSO 11 — Docker

Adicionar ao `docker-compose.yml` existente na seção `environment` do serviço backend:

```yaml
- ESUS_DB_HOST=${ESUS_DB_HOST}
- ESUS_DB_PORT=${ESUS_DB_PORT:-5433}
- ESUS_DB_NAME=${ESUS_DB_NAME}
- ESUS_DB_USER=${ESUS_DB_USER}
- ESUS_DB_PASSWORD=${ESUS_DB_PASSWORD}
- MUNICIPIO_IBGE=${MUNICIPIO_IBGE}
- MUNICIPIO_NOME=${MUNICIPIO_NOME}
```

> Nota: O banco do e-SUS NÃO é containerizado aqui — ele é um servidor externo.

---

## ORDEM DE EXECUÇÃO PARA O CLAUDE CODE

Execute os passos na seguinte ordem para evitar erros de dependência:

```
1.  npm install pg @types/pg (no diretório backend/)
2.  Criar backend/src/config/esusDb.ts
3.  Atualizar backend/.env.example com variáveis e-SUS
4.  Adicionar models ao backend/prisma/schema.prisma
5.  Rodar: npx prisma migrate dev --name add_esus_module
6.  Rodar: npx prisma generate
7.  Criar backend/src/modules/esus/esus.types.ts
8.  Criar backend/src/services/esusPatients.service.ts
9.  Criar backend/src/services/esusReferrals.service.ts
10. Criar backend/src/services/esusProduction.service.ts
11. Criar backend/src/services/esusIndicators.service.ts
12. Criar backend/src/services/esusQueue.service.ts
13. Criar backend/src/controllers/esus.controller.ts
14. Criar backend/src/routes/esus.routes.ts
15. Editar backend/src/server.ts para registrar as rotas
16. Criar backend/src/jobs/esusSync.job.ts
17. Criar frontend/src/services/esusApi.ts
18. Criar frontend/src/pages/esus/ (todas as páginas)
19. Criar frontend/src/components/esus/ (componentes)
20. Editar router e menu de navegação do frontend
21. Atualizar docker-compose.yml
```

---

## ATENÇÃO — ANTES DE CRIAR QUALQUER ARQUIVO

O Claude Code deve primeiro:

1. **Ler** `backend/src/server.ts` para entender como rotas são registradas
2. **Ler** `backend/prisma/schema.prisma` para ver a estrutura atual antes de adicionar
3. **Ler** `backend/src/middlewares/` para identificar o nome e assinatura do middleware de auth existente
4. **Ler** `backend/package.json` para verificar quais libs já estão instaladas (node-cron, axios, etc.)
5. **Ler** `frontend/src/` para identificar o arquivo de rotas e o cliente HTTP existente

Nunca sobrescrever arquivos existentes sem antes ler seu conteúdo.