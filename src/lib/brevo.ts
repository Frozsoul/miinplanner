/**
 * Sends one transactional email through Brevo's API. Server only.
 * Needs the BREVO_API_KEY secret (see apphosting.yaml). The sender address must be on a
 * domain authenticated in Brevo (miindigital.com).
 */

export const DIGEST_SENDER = { name: 'MiinPlanner', email: 'planner@miindigital.com' };
export const DIGEST_REPLY_TO = { email: 'admin@miindigital.com', name: 'Minh at MiinDigital' };

export interface OutgoingEmail {
  to: { email: string; name?: string };
  subject: string;
  html: string;
  text: string;
  unsubscribeUrl: string;
}

export async function sendBrevoEmail(email: OutgoingEmail): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return { ok: false, status: 0, error: 'BREVO_API_KEY is not set' };
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': apiKey, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      sender: DIGEST_SENDER,
      replyTo: DIGEST_REPLY_TO,
      to: [email.to.name ? email.to : { email: email.to.email }],
      subject: email.subject,
      htmlContent: email.html,
      textContent: email.text,
      headers: {
        'List-Unsubscribe': `<${email.unsubscribeUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
      tags: ['daily-digest'],
    }),
  });
  if (res.ok) return { ok: true };
  const error = (await res.text().catch(() => '')).slice(0, 300);
  return { ok: false, status: res.status, error };
}
