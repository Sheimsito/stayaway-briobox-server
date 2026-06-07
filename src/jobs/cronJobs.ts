/**
 * @file cronJobs.ts
 * @description Automathic email sends to clients (membership reminders and birthday greetings)
 *
 * Jobs registered:
 *  1. recordatorioProximoPago  – cron: "0 9 * * *" (09:00 daily)           →reminds user that membership is ending soon
 *  2. avisoDiaDePago          – cron: "0 9 * * *" (09:00 daily)            →reminds user that membership is due today
 *  3. avisoVencido            – cron: "0 10 * * *" (10:00 daily)         →reminds user that membership is overdue
 *  4. felicitacionCumpleaños  – cron: "0 8 * * *" (08:00 daily)           →sends a birthday greeting to the user
 *
 * Idempotency: before sending each email, the table `email_logs` is consulted.
 * If a record already exists for (client_id, email_type) with the same UTC date,
 * the sending is skipped.
 */

import cron from 'node-cron';
import { supabaseGeneric as supabase } from '../lib/supabaseClient.js';
import { sendMail } from '../service/resendService.js';
import {
  upcomingPaymentTemplate,
  paymentDueTodayTemplate,
  overduePaymentTemplate,
  birthdayTemplate,
} from '../service/emailTemplates.js';
import type { ClientRow, MembershipRow } from '../types/database.js';

// ── Configuration (optional override by environment variables) ──────────────
const DAYS_BEFORE_EXPIRY = parseInt(process.env.PAYMENT_REMINDER_DAYS_BEFORE ?? '3', 10);
const DAYS_AFTER_EXPIRY = parseInt(process.env.OVERDUE_REMINDER_DAYS_AFTER ?? '1', 10);

// ── Internal types ───────────────────────────────────────────────────────────
type EmailType = 'upcoming_payment' | 'payment_due_today' | 'overdue_payment' | 'birthday';

interface MemberWithClient {
  membership: MembershipRow;
  client: ClientRow;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Formats a `Date` as "DD/MM/YYYY" for display in the email. */
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
}

/** Returns the current date in America/Bogota timezone without hour component (UTC midnight). */
function today(): Date {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(new Date());
  const year = parts.find(p => p.type === 'year')!.value;
  const month = parts.find(p => p.type === 'month')!.value;
  const day = parts.find(p => p.type === 'day')!.value;
  return new Date(`${year}-${month}-${day}T00:00:00Z`);
}

/**
 * Checks if an email of the given type has already been sent to the client today.
 * Uses the `email_logs` table and the unique index (client_id, email_type, sent_at::date).
 */
async function alreadySent(clientId: string, emailType: EmailType): Promise<boolean> {
  const todayStr = today().toISOString().slice(0, 10); // "YYYY-MM-DD"
  const { data, error } = await supabase
    .from('email_logs')
    .select('id')
    .eq('client_id', clientId)
    .eq('email_type', emailType)
    .gte('sent_at', `${todayStr}T00:00:00Z`)
    .lte('sent_at', `${todayStr}T23:59:59Z`)
    .maybeSingle();

  if (error) {
    console.error(`[CronJobs] Error verificando email_logs para ${clientId}:`, error.message);
    return false; // si hay error en la consulta, intentamos enviar igual
  }
  return data !== null;
}

/**
 * Registra un envío exitoso en `email_logs`.
 */
async function registerSend(clientId: string, emailType: EmailType): Promise<void> {
  const { error } = await supabase
    .from('email_logs')
    .insert({ client_id: clientId, email_type: emailType });

  if (error) {
    console.error(`[CronJobs] Error registrando log de envío para ${clientId}:`, error.message);
  }
}

/**
 * Retrieves all active memberships along with the associated client.
 * Filters out deleted memberships and clients.
 */
async function getActiveMemberships(): Promise<MemberWithClient[]> {
  // Fetch memberships with active or pending status
  const { data: memberships, error: memError } = await supabase
    .from('membership')
    .select('*')
    .eq('status', 'activa');

  if (memError) {
    throw new Error(`[CronJobs] Error obteniendo membresías: ${memError.message}`);
  }
  if (!memberships || memberships.length === 0) return [];

  // Fetch all active clients associated
  const clientIds: string[] = [...new Set((memberships as MembershipRow[]).map((m) => m.customer_id))];

  const { data: clients, error: clientError } = await supabase
    .from('clients')
    .select('*')
    .in('id', clientIds)
    .eq('is_deleted', false);

  if (clientError) {
    throw new Error(`[CronJobs] Error obteniendo clientes: ${clientError.message}`);
  }

  const clientMap = new Map<string, ClientRow>();
  for (const c of (clients as ClientRow[])) {
    clientMap.set(c.id, c);
  }

  const result: MemberWithClient[] = [];
  for (const m of (memberships as MembershipRow[])) {
    const client = clientMap.get(m.customer_id);
    if (client && client.email) {
      result.push({ membership: m, client });
    }
  }
  return result;
}

// ── Jobs ─────────────────────────────────────────────────────────────────────

/**
 * Job 1 – Upcoming payment reminder.
 *
 * Cron: "0 9 * * *" → runs at 09:00 every day.
 * Sends an email to members whose membership expires in exactly
 * PAYMENT_REMINDER_DAYS_BEFORE days.
 */
async function recordatorioProximoPago(): Promise<void> {
  console.log('[CronJobs] ▶ recordatorioProximoPago iniciado');
  try {
    const members = await getActiveMemberships();
    const targetDate = today();
    targetDate.setUTCDate(targetDate.getUTCDate() + DAYS_BEFORE_EXPIRY);
    console.log(`[CronJobs] recordatorioProximoPago: targetDate es ${targetDate.toISOString()}`);

    for (const { membership, client } of members) {
      try {
        const endDate = new Date(membership.end_date);
        endDate.setUTCHours(0, 0, 0, 0);

        console.log(`[CronJobs] Cliente ${client.email} - Membresía vence: ${endDate.toISOString()} | Objetivo es: ${targetDate.toISOString()}`);

        if (endDate.getTime() !== targetDate.getTime()) continue;

        if (await alreadySent(client.id, 'upcoming_payment')) {
          console.log(`[CronJobs] upcoming_payment ya enviado a ${client.email}, omitiendo.`);
          continue;
        }

        const nombre = `${client.first_name} ${client.paternal_last_name}`;
        const html = upcomingPaymentTemplate({
          nombre,
          fechaVencimiento: formatDate(endDate),
          diasRestantes: DAYS_BEFORE_EXPIRY,
        });

        await sendMail({
          to: client.email,
          subject: 'Tu membresía de BrioBox está por vencer',
          text: `Hola ${nombre}, tu membresía vence en ${DAYS_BEFORE_EXPIRY} días (${formatDate(endDate)}).`,
          html,
        });

        await registerSend(client.id, 'upcoming_payment');
        console.log(`[CronJobs] ✅ upcoming_payment enviado a ${client.email}`);
      } catch (err) {
        console.error(`[CronJobs] ❌ Error en upcoming_payment para ${client.email}:`, err);
      }
    }
  } catch (err) {
    console.error('[CronJobs] ❌ Error general en recordatorioProximoPago:', err);
  }
  console.log('[CronJobs] ■ recordatorioProximoPago finalizado');
}

/**
 * Job 2 – Upcoming Payment.
 *
 * Cron: "0 9 * * *" → This executes at 09:00 every day.
 * Sends an email to members whose membership expires in exactly
 * PAYMENT_REMINDER_DAYS_BEFORE days.
 */
async function avisoDiaDePago(): Promise<void> {
  console.log('[CronJobs] ▶ avisoDiaDePago iniciado');
  try {
    const miembros = await getActiveMemberships();
    const hoy = today();
    console.log(`[CronJobs] avisoDiaDePago: hoy (America/Mexico_City midnight UTC) es ${hoy.toISOString()}`);

    for (const { membership, client } of miembros) {
      try {
        const endDate = new Date(membership.end_date);
        endDate.setUTCHours(0, 0, 0, 0);

        console.log(`[CronJobs] Cliente ${client.email} - Membresía vence: ${endDate.toISOString()} | Hoy es: ${hoy.toISOString()}`);

        if (endDate.getTime() !== hoy.getTime()) continue;

        if (await alreadySent(client.id, 'payment_due_today')) {
          console.log(`[CronJobs] payment_due_today ya enviado a ${client.email}, omitiendo.`);
          continue;
        }

        const nombre = `${client.first_name} ${client.paternal_last_name}`;
        const html = paymentDueTodayTemplate({
          nombre,
          fechaVencimiento: formatDate(endDate),
        });

        await sendMail({
          to: client.email,
          subject: 'Hoy es el día de renovar tu membresía en BrioBox',
          text: `Hola ${nombre}, hoy (${formatDate(endDate)}) vence tu membresía en BrioBox.`,
          html,
        });

        await registerSend(client.id, 'payment_due_today');
        console.log(`[CronJobs] ✅ payment_due_today enviado a ${client.email}`);
      } catch (err) {
        console.error(`[CronJobs] ❌ Error en payment_due_today para ${client.email}:`, err);
      }
    }
  } catch (err) {
    console.error('[CronJobs] ❌ Error general en avisoDiaDePago:', err);
  }
  console.log('[CronJobs] ■ avisoDiaDePago finalizado');
}

/**
 * Job 3 – Overdue Payment.
 *
 * Cron: "0 10 * * *" → This executes at 10:00 every day.
 * Sends an email to members whose membership expired exactly
 * DIAS_DESPUES_VENCIMIENTO days ago and who still have non-renewed status.
 */
async function avisoVencido(): Promise<void> {
  console.log('[CronJobs] ▶ avisoVencido iniciado');
  try {
    const hasta = today();
    hasta.setUTCDate(hasta.getUTCDate() - 1); // vencidas hace al menos 1 día

    const desde = today();
    desde.setUTCDate(desde.getUTCDate() - DAYS_AFTER_EXPIRY); // ventana máxima

    const { data: memberships, error: memError } = await supabase
      .from('membership')
      .select('*')
      .not('status', 'in', '("activa","pagada")')
      .gte('end_date', desde.toISOString().slice(0, 10))
      .lte('end_date', hasta.toISOString().slice(0, 10));

    if (memError) throw new Error(memError.message);
    if (!memberships || memberships.length === 0) {
      console.log('[CronJobs] avisoVencido: sin membresías vencidas.');
      return;
    }

    const clientIds: string[] = [...new Set((memberships as MembershipRow[]).map((m) => m.customer_id))];
    const { data: clients, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .in('id', clientIds)
      .eq('is_deleted', false);

    if (clientError) throw new Error(clientError.message);

    const clientMap = new Map<string, ClientRow>();
    for (const c of (clients as ClientRow[])) clientMap.set(c.id, c);

    for (const membership of (memberships as MembershipRow[])) {
      const client = clientMap.get(membership.customer_id);
      if (!client?.email) continue;

      try {
        if (await alreadySent(client.id, 'overdue_payment')) {
          console.log(`[CronJobs] overdue_payment ya enviado a ${client.email}, omitiendo.`);
          continue;
        }

        const endDate = new Date(membership.end_date);
        const nombre = `${client.first_name} ${client.paternal_last_name}`;
        const html = overduePaymentTemplate({
          nombre,
          fechaVencimiento: formatDate(endDate),
          diasAtrasados: DAYS_AFTER_EXPIRY,
        });

        await sendMail({
          to: client.email,
          subject: 'Tu membresía de BrioBox ha vencido',
          text: `Hola ${nombre}, tu membresía venció el ${formatDate(endDate)}. Por favor renuévala.`,
          html,
        });

        await registerSend(client.id, 'overdue_payment');
        console.log(`[CronJobs] overdue_payment enviado a ${client.email}`);
      } catch (err) {
        console.error(`[CronJobs] ERROR en overdue_payment para ${client.email}:`, err);
      }
    }
  } catch (err) {
    console.error('[CronJobs] ERROR general en avisoVencido:', err);
  }
  console.log('[CronJobs] ■ avisoVencido finalizado');
}

/**
 * Job 4 – Happy Birthday.
 *
 * Cron: "0 8 * * *" → This executes at 08:00 every day.
 * Sends a birthday email to clients whose month and day of
 * `birth_date` coincide with the current day.
 */
async function felicitacionCumpleanos(): Promise<void> {
  console.log('[CronJobs] ▶ felicitacionCumpleanos iniciado');
  try {
    // ── Fecha local en America/Bogota ──────────────────────────────────
    // Usamos Intl para extraer mes y día en la zona horaria del servidor,
    // evitando el bug de UTC: a las 19:00 CST ya son las 00:00 UTC del día siguiente.
    const ahoraLocal = new Intl.DateTimeFormat('es-MX', {
      timeZone: 'America/Bogota',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date());

    const mesActual = parseInt(ahoraLocal.find(p => p.type === 'month')!.value, 10);  // 1-12
    const diaActual = parseInt(ahoraLocal.find(p => p.type === 'day')!.value, 10);    // 1-31

    console.log(`[CronJobs] Buscando cumpleaños para: mes=${mesActual} día=${diaActual}`);

    const { data: clients, error } = await supabase
      .from('clients')
      .select('*')
      .eq('is_deleted', false)
      .not('birth_date', 'is', null);

    if (error) throw new Error(error.message);

    if (!clients || clients.length === 0) {
      console.log('[CronJobs] felicitacionCumpleanos: sin clientes con birth_date registrado.');
      console.log('[CronJobs] ⚠️  ¿Ejecutaste la migración add_email_logs.sql en Supabase?');
      return;
    }

    console.log(`[CronJobs] Clientes con birth_date encontrados: ${clients.length}`);

    for (const client of (clients as ClientRow[])) {
      try {
        if (!client.birth_date) continue;

        // ── Extraemos mes y día directo del string "YYYY-MM-DD" ──────────────
        // Esto evita que new Date() interprete la fecha como UTC midnight
        // y la desplace un día al convertir a local.
        const [, mmStr, ddStr] = (client.birth_date as string).split('-');
        const bdMes = parseInt(mmStr, 10);
        const bdDia = parseInt(ddStr, 10);

        console.log(`[CronJobs] Cliente ${client.email} → birth_date: ${client.birth_date} (mes=${bdMes}, día=${bdDia})`);

        if (bdMes !== mesActual || bdDia !== diaActual) continue;

        if (await alreadySent(client.id, 'birthday')) {
          console.log(`[CronJobs] birthday ya enviado a ${client.email}, omitiendo.`);
          continue;
        }

        const nombre = `${client.first_name} ${client.paternal_last_name}`;
        const html = birthdayTemplate({ nombre });

        await sendMail({
          to: client.email,
          subject: '¡Feliz cumpleaños de parte de BrioBox!',
          text: `¡Feliz cumpleaños, ${nombre}! Todo el equipo de BrioBox te desea un increíble día.`,
          html,
        });

        await registerSend(client.id, 'birthday');
        console.log(`[CronJobs] ✅ birthday enviado a ${client.email}`);
      } catch (err) {
        console.error(`[CronJobs] ❌ Error en birthday para ${client.email}:`, err);
      }
    }
  } catch (err) {
    console.error('[CronJobs] ❌ Error general en felicitacionCumpleanos:', err);
  }
  console.log('[CronJobs] ■ felicitacionCumpleanos finalizado');
}

// ── Main Exportation ────────────────────────────────────────────────────

/**
 * Register all the cron jobs for email.
 * Call this function once in the entry point of the server (server.ts).
 *
 * Cron expressions (America/Mexico_City):
 *  - 08:00 → birthday
 *  - 09:00 → upcoming payment + payment due day
 *  - 10:00 → expired membership
 */

// CHANGE HERE THE  HOURS  EXPRESSIONS FOR CRONJOBS (TIME_ZONE: AMERICA/MEXICO_CITY) 
// ┌───────────── minute (0 - 59)
// │ ┌───────────── hour (0 - 23)
// │ │ ┌───────────── day of month (1 - 31)
// │ │ │ ┌───────────── month (1 - 12)
// │ │ │ │ ┌───────────── day of week (0 - 6)
// │ │ │ │ │
// * * * * *
export function initCronJobs(): void {
  // Job 1: Upcoming Payment – 09:00 daily
  cron.schedule('0 9 * * *', recordatorioProximoPago, {
    timezone: 'America/Bogota',
    name: 'recordatorioProximoPago',
  });

  // Job 2: Payment due day – 09:00 daily (same time as job 1, runs sequentially)
  cron.schedule('0 9 * * *', avisoDiaDePago, {
    timezone: 'America/Bogota',
    name: 'avisoDiaDePago',
  });

  // Job 3: Overdue Payment – 10:00 daily
  cron.schedule('0 10 * * *', avisoVencido, {
    timezone: 'America/Bogota',
    name: 'avisoVencido',
  });

  // Job 4: felicitación de cumpleaños – 08:00 diario
  cron.schedule('0 8 * * *', felicitacionCumpleanos, {
    timezone: 'America/Bogota',
    name: 'felicitacionCumpleanos',
  });

  console.log('✅ [CronJobs] All email jobs registered.');
  console.log(`   • recordatorioProximoPago  → 09:00 daily (${DAYS_BEFORE_EXPIRY} days before)`);
  console.log('   • avisoDiaDePago           → 09:00 daily');
  console.log(`   • avisoVencido             → 10:00 daily (${DAYS_AFTER_EXPIRY} days after)`);
  console.log('   • felicitacionCumpleanos   → 08:00 daily');
}

// ── Test exports (development only) ─────────────────────────────────────────
// Allows testJobRoutes.ts to trigger each job directly via HTTP GET.
export const testRecordatorioProximoPago = recordatorioProximoPago;
export const testAvisoDiaDePago = avisoDiaDePago;
export const testAvisoVencido = avisoVencido;
export const testFelicitacionCumpleanos = felicitacionCumpleanos;
