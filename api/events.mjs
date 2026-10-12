import nodemailer from 'nodemailer'
import 'dotenv/config'

const required = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'MAIL_FROM', 'MAIL_TO']
const missing = required.filter((key) => !process.env[key])
const transporter = missing.length === 0
  ? nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  })
  : null

const recentRequests = new Map()
const MAX_BODY = 4000
const MAX_REQUESTS_PER_MINUTE = 20

function json(response, status, body) {
  response.status(status).setHeader('Cache-Control', 'no-store').json(body)
}

function clientKey(request) {
  return request.headers['x-forwarded-for']?.split(',')[0]?.trim() || request.socket?.remoteAddress || 'unknown'
}

function isRateLimited(key) {
  const now = Date.now()
  const requests = (recentRequests.get(key) || []).filter((time) => now - time < 60_000)
  requests.push(now)
  recentRequests.set(key, requests)
  return requests.length > MAX_REQUESTS_PER_MINUTE
}

function formatEvent(event, request) {
  const timestamp = new Date().toISOString()
  const label = event.type.replaceAll('_', ' ')
  const details = Object.entries(event.data || {})
    .map(([key, value]) => `${key}: ${String(value).slice(0, 160)}`)
    .join('\n')

  return {
    subject: `Love letter interaction: ${label}`,
    text: [
      'Someone interacted with your love letter.',
      '',
      `Event: ${label}`,
      `Time: ${timestamp}`,
      `User agent: ${request.headers['user-agent'] || 'unknown'}`,
      '',
      details || 'No additional details.',
    ].join('\n'),
  }
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    return json(response, 405, { error: 'Method not allowed.' })
  }

  if (missing.length > 0) {
    console.error(`SMTP is not configured. Missing: ${missing.join(', ')}`)
    return json(response, 503, { error: 'Email notifications are not configured on the server.' })
  }

  if (isRateLimited(clientKey(request))) {
    return json(response, 429, { error: 'Too many interaction notifications.' })
  }

  try {
    const rawBody = typeof request.body === 'string' ? request.body : JSON.stringify(request.body || {})
    if (rawBody.length > MAX_BODY) {
      return json(response, 413, { error: 'Request body is too large.' })
    }

    const payload = typeof request.body === 'object' && request.body !== null
      ? request.body
      : JSON.parse(rawBody)

    if (!payload || typeof payload.type !== 'string' || !/^[a-z0-9_]{2,40}$/.test(payload.type)) {
      return json(response, 400, { error: 'Invalid interaction event.' })
    }

    const mail = formatEvent(payload, request)
    await transporter.sendMail({
      from: process.env.MAIL_FROM,
      to: process.env.MAIL_TO,
      subject: mail.subject,
      text: mail.text,
    })
    return json(response, 202, { delivered: true })
  } catch (error) {
    console.error('Unable to send interaction email:', error)
    return json(response, 500, { error: 'Unable to send interaction notification.' })
  }
}
