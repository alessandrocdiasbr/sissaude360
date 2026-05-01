import { Request, Response } from 'express';
import { testEsusConnection } from '../config/esusDb';
import * as patientsService from '../services/esusPatients.service';
import * as referralsService from '../services/esusReferrals.service';
import * as productionService from '../services/esusProduction.service';
import * as indicatorsService from '../services/esusIndicators.service';
import * as queueService from '../services/esusQueue.service';

const ok = (res: Response, data: any) => res.json({ success: true, data });
const fail = (res: Response, err: any, status = 500) => {
  console.error('[ESUS Controller]', err);
  res.status(status).json({ success: false, error: err?.message || String(err) });
};

// ─── Diagnóstico ────────────────────────────────────────────────

export async function testConnection(_req: Request, res: Response) {
  try {
    const connected = await testEsusConnection();
    ok(res, { connected });
  } catch (err) { fail(res, err); }
}

// ─── Pacientes ──────────────────────────────────────────────────

export async function getPatients(req: Request, res: Response) {
  try {
    const result = await patientsService.getAllPatients({
      search: req.query.search as string,
      ine: req.query.ine as string,
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
    });
    ok(res, result);
  } catch (err) { fail(res, err); }
}

export async function getPatientById(req: Request, res: Response) {
  try {
    const patient = await patientsService.getPatientByCns(req.params.cns);
    if (!patient) return res.status(404).json({ success: false, error: 'Paciente não encontrado.' });
    ok(res, patient);
  } catch (err) { fail(res, err); }
}

export async function getPatientTimeline(req: Request, res: Response) {
  try {
    const data = await patientsService.getPatientTimeline(req.params.cns);
    ok(res, data);
  } catch (err) { fail(res, err); }
}

// ─── Encaminhamentos ─────────────────────────────────────────────

export async function getReferrals(req: Request, res: Response) {
  try {
    const result = await referralsService.getAllReferrals({
      specialty: req.query.specialty as string,
      ine: req.query.ine as string,
      dateFrom: req.query.dateFrom as string,
      dateTo: req.query.dateTo as string,
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
    });
    ok(res, result);
  } catch (err) { fail(res, err); }
}

export async function getReferralStats(req: Request, res: Response) {
  try {
    const data = await referralsService.getReferralStats({
      dateFrom: req.query.dateFrom as string,
      dateTo: req.query.dateTo as string,
    });
    ok(res, data);
  } catch (err) { fail(res, err); }
}

export async function getReferralsBySpecialty(_req: Request, res: Response) {
  try {
    const data = await referralsService.getReferralsBySpecialty();
    ok(res, data);
  } catch (err) { fail(res, err); }
}

// ─── Produção ────────────────────────────────────────────────────

export async function getProduction(req: Request, res: Response) {
  try {
    const data = await productionService.getProductionByProfessional({
      ine: req.query.ine as string,
      cbo: req.query.cbo as string,
      dateFrom: req.query.dateFrom as string,
      dateTo: req.query.dateTo as string,
    });
    ok(res, data);
  } catch (err) { fail(res, err); }
}

export async function getProductionByPeriod(req: Request, res: Response) {
  try {
    const data = await productionService.getProductionByPeriod({
      ine: req.query.ine as string,
      granularity: req.query.granularity as any,
      dateFrom: req.query.dateFrom as string,
      dateTo: req.query.dateTo as string,
    });
    ok(res, data);
  } catch (err) { fail(res, err); }
}

// ─── Indicadores ─────────────────────────────────────────────────

export async function getIndicators(req: Request, res: Response) {
  try {
    const competencia = (req.query.competencia as string) || new Date().toISOString().substring(0, 7).replace('-', '');
    const data = await indicatorsService.getAllIndicators({
      competencia,
      ine: req.query.ine as string,
    });
    ok(res, data);
  } catch (err) { fail(res, err); }
}

export async function getIndicatorHistory(_req: Request, res: Response) {
  res.json({ success: true, data: [] });
}

// ─── Fila ────────────────────────────────────────────────────────

export async function getQueue(req: Request, res: Response) {
  try {
    const data = await queueService.getQueue({
      status: req.query.status as string,
      type: req.query.type as string,
      priority: req.query.priority as string,
      specialty: req.query.specialty as string,
      search: req.query.search as string,
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
    });
    ok(res, data);
  } catch (err) { fail(res, err); }
}

export async function getQueueStats(_req: Request, res: Response) {
  try {
    const data = await queueService.getQueueStats();
    ok(res, data);
  } catch (err) { fail(res, err); }
}

export async function addToQueue(req: Request, res: Response) {
  try {
    const item = await queueService.addToQueue(req.body);
    res.status(201).json({ success: true, data: item });
  } catch (err) { fail(res, err); }
}

export async function updateQueueStatus(req: Request, res: Response) {
  try {
    const item = await queueService.updateStatus(req.params.id, req.body);
    ok(res, item);
  } catch (err) { fail(res, err); }
}

export async function importFromEsus(req: Request, res: Response) {
  try {
    const { type = 'REFERRAL', dateFrom, dateTo } = req.body;
    const now = new Date();
    const from = dateFrom || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const to = dateTo || now.toISOString().split('T')[0];
    const result = await queueService.importFromEsus(type, from, to);
    ok(res, result);
  } catch (err) { fail(res, err); }
}
