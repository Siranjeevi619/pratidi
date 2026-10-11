import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import nodemailer from 'nodemailer'
import 'dotenv/config'

const root = path.dirname(fileURLToPath(import.meta.url))
const port = Number(process.env.PORT || 8787)
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
  response.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' })
  response.end(JSON.stringify(body))
}

function clientKey(request) {
  return request.headers['x-forwarded-for']?.split(',')[0]?.trim() || request.socket.remoteAddress || 'unknown'
}

function isRateLimited(key) {
  const now = Date.now()
  const requests = (recentRequests.get(key) || []).filter((time) => now - time < 60_000)
  requests.push(now)
  recentRequests.set(key, requests)
  return requests.length > MAX_REQUESTS_PER_MINUTE
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = ''
    request.on('data', (chunk) => {
      body += chunk
      if (body.length > MAX_BODY) {
        reject(new Error('Request body is too large'))
        request.destroy()
      }
    })
    request.on('end', () => resolve(body))
    request.on('error', reject)
  })
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
      `Someone interacted with your love letter.`,
      '',
      `Event: ${label}`,
      `Time: ${timestamp}`,
      `User agent: ${request.headers['user-agent'] || 'unknown'}`,
      '',
      details || 'No additional details.',
    ].join('\n'),
  }
}

async function handleEvent(request, response) {
  if (missing.length > 0) {
    console.error(`SMTP is not configured. Missing: ${missing.join(', ')}`)
    return json(response, 503, { error: 'Email notifications are not configured on the server.' })
  }
  if (isRateLimited(clientKey(request))) return json(response, 429, { error: 'Too many interaction notifications.' })

  try {
    const payload = JSON.parse(await readBody(request))
    if (!payload || typeof payload.type !== 'string' || !/^[a-z0-9_]{2,40}$/.test(payload.type)) {
      return json(response, 400, { error: 'Invalid interaction event.' })
    }
    const mail = formatEvent(payload, request)
    await transporter.sendMail({ from: process.env.MAIL_FROM, to: process.env.MAIL_TO, subject: mail.subject, text: mail.text })
    return json(response, 202, { delivered: true })
  } catch (error) {
    console.error('Unable to send interaction email:', error)
    return json(response, 500, { error: 'Unable to send interaction notification.' })
  }
}

function serveFile(request, response) {
  const requested = request.url === '/' ? '/index.html' : request.url.split('?')[0]
  const filePath = path.resolve(root, `dist${requested}`)
  if (!filePath.startsWith(path.resolve(root, 'dist'))) return json(response, 403, { error: 'Forbidden' })
  fs.readFile(filePath, (error, data) => {
    if (error) return fs.readFile(path.resolve(root, 'dist/index.html'), (fallbackError, fallback) => {
      if (fallbackError) return json(response, 404, { error: 'Build not found. Run npm run build first.' })
      response.writeHead(200, { 'Content-Type': 'text/html' })
      response.end(fallback)
    })
    const extension = path.extname(filePath)
    const contentType = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.mp3': 'audio/mpeg' }[extension] || 'application/octet-stream'
    response.writeHead(200, { 'Content-Type': contentType })
    response.end(data)
  })
}

const server = http.createServer(async (request, response) => {
  if (request.method === 'POST' && request.url === '/api/events') return handleEvent(request, response)
  if (request.method === 'GET') return serveFile(request, response)
  return json(response, 405, { error: 'Method not allowed.' })
})

server.listen(port, () => console.log(`Love letter server listening on http://localhost:${port}`))
