import { createClient } from 'npm:@supabase/supabase-js@2';
import {
  cleanText,
  corsHeaders,
  getClientIp,
  jsonResponse,
  sha256,
} from '../_shared/http.ts';

const MAX_NAME = 100;
const MAX_EMAIL = 200;
const MAX_SUBJECT = 200;
const MAX_MESSAGE = 5000;
const MAX_REQUESTS = 5;
const RATE_WINDOW_SECONDS = 3600;

interface ContactPayload {
  name?: unknown;
  email?: unknown;
  subject?: unknown;
  message?: unknown;
  website?: unknown;
}

interface ValidatedContact {
  name: string;
  email: string;
  subject: string;
  message: string;
}

function validateContact(payload: ContactPayload): ValidatedContact | null {
  const name = cleanText(payload.name, MAX_NAME);
  const email = cleanText(payload.email, MAX_EMAIL);
  const subject = cleanText(payload.subject, MAX_SUBJECT);
  const message = cleanText(payload.message, MAX_MESSAGE);

  if (!name || !email || !subject || !message) return null;
  if (name.length > MAX_NAME || email.length > MAX_EMAIL || subject.length > MAX_SUBJECT || message.length > MAX_MESSAGE) {
    return null;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;

  return { name, email, subject, message };
}

async function sendTelegramNotification(contact: ValidatedContact): Promise<boolean> {
  const token = Deno.env.get('TELEGRAM_BOT_TOKEN');
  const chatId = Deno.env.get('TELEGRAM_CHAT_ID');

  if (!token || !chatId) {
    console.warn('Telegram notification is not configured.');
    return false;
  }

  // Plain text is intentional: user input is never interpreted as Telegram markup.
  const text = [
    '📬 New contact message',
    '',
    `From: ${contact.name}`,
    `Email: ${contact.email}`,
    `Subject: ${contact.subject}`,
    '',
    contact.message,
  ].join('\n').slice(0, 4096);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
      signal: controller.signal,
    });

    if (!response.ok) {
      console.error('Telegram notification failed with status', response.status);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Telegram notification request failed', error instanceof Error ? error.name : 'unknown');
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(request) });
  }

  if (request.method !== 'POST') {
    return jsonResponse(request, { error: 'Method not allowed' }, 405);
  }

  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > 20_000) {
    return jsonResponse(request, { error: 'Request is too large' }, 413);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const ownerId = Deno.env.get('PORTFOLIO_OWNER_ID');

  if (!supabaseUrl || !serviceRoleKey || !ownerId) {
    console.error('Contact function is missing required server configuration.');
    return jsonResponse(request, { error: 'Contact service is not configured' }, 503);
  }

  let payload: ContactPayload;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse(request, { error: 'Invalid request body' }, 400);
  }

  // Honeypot field: bots commonly fill every input they find.
  if (cleanText(payload.website, 200)) {
    return jsonResponse(request, { success: true }, 200);
  }

  const contact = validateContact(payload);
  if (!contact) {
    return jsonResponse(request, { error: 'Please provide a valid name, email, subject, and message' }, 400);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const ipHash = await sha256(`${getClientIp(request)}:${ownerId}`);
  const { data: allowed, error: rateLimitError } = await admin.rpc(
    'consume_contact_rate_limit',
    { p_key: ipHash, p_max: MAX_REQUESTS, p_window_seconds: RATE_WINDOW_SECONDS },
  );

  if (rateLimitError) {
    console.error('Contact rate limit check failed', rateLimitError.code);
    return jsonResponse(request, { error: 'Unable to process contact request' }, 503);
  }
  if (!allowed) {
    return jsonResponse(request, { error: 'Too many messages. Please try again later.' }, 429);
  }

  const { error: insertError } = await admin.from('messages').insert({
    owner_id: ownerId,
    name: contact.name,
    email: contact.email,
    subject: contact.subject,
    message: contact.message,
  });

  if (insertError) {
    console.error('Contact message insert failed', insertError.code);
    return jsonResponse(request, { error: 'Unable to save your message' }, 500);
  }

  const notificationSent = await sendTelegramNotification(contact);

  return jsonResponse(request, {
    success: true,
    notificationSent,
  }, 201);
});
