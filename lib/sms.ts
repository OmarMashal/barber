/**
 * SMS service — Twilio integration.
 *
 * All functions are fire-and-forget safe: they never throw.
 * Failures are console.error'd so they appear in server logs
 * without affecting the booking response.
 *
 * Required env vars (server-side only, never exposed to browser):
 *   TWILIO_ACCOUNT_SID
 *   TWILIO_AUTH_TOKEN
 *   TWILIO_FROM_NUMBER   — your Twilio phone number, e.g. +12015551234
 *   BARBER_SMS_NUMBER    — where barber alerts are sent, e.g. +972501234567
 */

import twilio from 'twilio'
import { SHOP_NAME } from '@/lib/constants'

// ── Lazy client ───────────────────────────────────────────────
// Instantiated once and reused. Throws at call time (not module
// load time) if env vars are missing, so misconfiguration is
// visible in logs as a warning rather than a startup crash.
let _client: ReturnType<typeof twilio> | null = null

function getClient() {
  if (_client) return _client
  const sid   = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  if (!sid || !token) throw new Error('Twilio credentials are not configured')
  _client = twilio(sid, token)
  return _client
}

// ── Core sender ───────────────────────────────────────────────
/**
 * Send a single SMS. Returns true on success, false on failure.
 * Never throws — failure is logged and swallowed.
 */
async function sendSms(to: string, body: string): Promise<boolean> {
  const from = process.env.TWILIO_FROM_NUMBER
  if (!from) {
    console.error('[SMS] TWILIO_FROM_NUMBER is not set')
    return false
  }

  try {
    const client = getClient()
    const msg = await client.messages.create({ to, from, body })
    console.log(`[SMS] Sent to ${to} — SID ${msg.sid}`)
    return true
  } catch (err) {
    console.error(`[SMS] Failed to send to ${to}:`, err)
    return false
  }
}

// ── Message formatters ────────────────────────────────────────
function formatAppointmentDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('ar', {
    timeZone: 'Asia/Jerusalem',
    weekday:  'long',
    day:      'numeric',
    month:    'long',
  })
}

function formatAppointmentTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString('ar', {
    timeZone: 'Asia/Jerusalem',
    hour:     '2-digit',
    minute:   '2-digit',
    hour12:   false,
  })
}

// ── Public API ────────────────────────────────────────────────

export interface BookingSmsPayload {
  customerName:  string
  customerPhone: string
  serviceName:   string
  startsAt:      string   // ISO 8601
}

/**
 * Confirmation SMS → customer.
 * Arabic message with booking details.
 */
export async function sendBookingConfirmationToCustomer(
  payload: BookingSmsPayload
): Promise<void> {
  const { customerName, customerPhone, serviceName, startsAt } = payload

  const body =
    `مرحباً ${customerName}! ✂️\n` +
    `تم تأكيد حجزك في ${SHOP_NAME}.\n` +
    `الخدمة: ${serviceName}\n` +
    `الموعد: ${formatAppointmentDate(startsAt)} – ${formatAppointmentTime(startsAt)}\n` +
    `نتطلع لاستقبالك 🌟`

  await sendSms(customerPhone, body)
}

/**
 * New-booking alert SMS → barber.
 * Sent to BARBER_SMS_NUMBER env var.
 */
export async function sendNewBookingAlertToBarber(
  payload: BookingSmsPayload
): Promise<void> {
  const barberNumber = process.env.BARBER_SMS_NUMBER
  if (!barberNumber) {
    console.error('[SMS] BARBER_SMS_NUMBER is not set — barber alert skipped')
    return
  }

  const { customerName, customerPhone, serviceName, startsAt } = payload

  const body =
    `🔔 حجز جديد – ${SHOP_NAME}\n` +
    `العميل: ${customerName}\n` +
    `الهاتف: ${customerPhone}\n` +
    `الخدمة: ${serviceName}\n` +
    `الموعد: ${formatAppointmentDate(startsAt)} – ${formatAppointmentTime(startsAt)}`

  await sendSms(barberNumber, body)
}
