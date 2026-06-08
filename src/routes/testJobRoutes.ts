/**
 * @file testJobRoutes.ts
 * @description Rutas de prueba para disparar los cron jobs manualmente.
 *
 * ⚠️  SOLO disponibles cuando NODE_ENV === "development".
 *     El archivo index.ts solo las monta en ese caso.
 *
 * Endpoints:
 *  GET /api/dev/jobs/upcoming-payment  → dispara recordatorioProximoPago()
 *  GET /api/dev/jobs/payment-due-today → dispara avisoDiaDePago()
 *  GET /api/dev/jobs/overdue-payment   → dispara avisoVencido()
 *  GET /api/dev/jobs/birthday          → dispara felicitacionCumpleanos()
 *  GET /api/dev/jobs/all               → dispara todos los jobs en secuencia
 */

import { Router, Request, Response } from 'express';
import {
  testRecordatorioProximoPago,
  testAvisoDiaDePago,
  testAvisoVencido,
  testFelicitacionCumpleanos,
} from '../jobs/cronJobs.js';

const router = Router();

// ── 1. Recordatorio pago próximo ─────────────────────────────
router.get('/upcoming-payment', async (_req: Request, res: Response) => {
  try {
    console.log('[TestRoute] Disparando recordatorioProximoPago...');
    await testRecordatorioProximoPago();
    res.status(200).json({ success: true, job: 'recordatorioProximoPago', message: 'Job ejecutado — revisa la consola y tu bandeja.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Error desconocido' });
  }
});

// ── 2. Aviso día de pago ─────────────────────────────────────
router.get('/payment-due-today', async (_req: Request, res: Response) => {
  try {
    console.log('[TestRoute] Disparando avisoDiaDePago...');
    await testAvisoDiaDePago();
    res.status(200).json({ success: true, job: 'avisoDiaDePago', message: 'Job ejecutado — revisa la consola y tu bandeja.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Error desconocido' });
  }
});

// ── 3. Membresía vencida ─────────────────────────────────────
router.get('/overdue-payment', async (_req: Request, res: Response) => {
  try {
    console.log('[TestRoute] Disparando avisoVencido...');
    await testAvisoVencido();
    res.status(200).json({ success: true, job: 'avisoVencido', message: 'Job ejecutado — revisa la consola y tu bandeja.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Error desconocido' });
  }
});

// ── 4. Cumpleaños ─────────────────────────────────────────────
router.get('/birthday', async (_req: Request, res: Response) => {
  try {
    console.log('[TestRoute] Disparando felicitacionCumpleanos...');
    await testFelicitacionCumpleanos();
    res.status(200).json({ success: true, job: 'felicitacionCumpleanos', message: 'Job ejecutado — revisa la consola y tu bandeja.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Error desconocido' });
  }
});

// ── ALL: todos los jobs en secuencia ─────────────────────────
router.get('/all', async (_req: Request, res: Response) => {
  const results: Record<string, string> = {};
  const run = async (name: string, fn: () => Promise<void>) => {
    try {
      await fn();
      results[name] = 'ok';
    } catch (err) {
      results[name] = err instanceof Error ? err.message : 'error';
    }
  };

  await run('recordatorioProximoPago', testRecordatorioProximoPago);
  await run('avisoDiaDePago', testAvisoDiaDePago);
  await run('avisoVencido', testAvisoVencido);
  await run('felicitacionCumpleanos', testFelicitacionCumpleanos);

  res.status(200).json({ success: true, results });
});

export default router;
