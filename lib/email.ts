import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT ?? "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM = process.env.SMTP_FROM ?? "ASD Partner Portal <portal@asdsystems.eu>";

function base(content: string) {
  return `<!DOCTYPE html>
<html lang="pl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body { font-family: 'IBM Plex Sans', Arial, sans-serif; background: #F4F2EC; margin: 0; padding: 0; }
  .wrap { max-width: 560px; margin: 32px auto; background: #fff; border-radius: 12px; border: 1px solid #E3E0D7; overflow: hidden; }
  .header { background: #121E40; padding: 24px 32px; }
  .header img { height: 32px; }
  .header-text { color: #fff; font-size: 13px; opacity: .7; margin-top: 4px; }
  .body { padding: 32px; }
  h1 { font-size: 22px; color: #1A1D24; margin: 0 0 12px; font-weight: 600; }
  p { color: #474C58; font-size: 15px; line-height: 1.6; margin: 0 0 16px; }
  .btn { display: inline-block; background: #22356B; color: #fff !important; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin: 8px 0 16px; }
  .meta { background: #F4F2EC; border-radius: 8px; padding: 14px 18px; margin: 16px 0; font-size: 13.5px; color: #474C58; }
  .meta b { color: #1A1D24; }
  .footer { padding: 20px 32px; border-top: 1px solid #E3E0D7; font-size: 12px; color: #9AA0AB; }
  .badge { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; }
  .badge-ok { background: #E2F0E9; color: #14633f; }
  .badge-warn { background: #F7ECD5; color: #845509; }
  .badge-danger { background: #F7E1DD; color: #97271b; }
</style></head>
<body><div class="wrap">
  <div class="header">
    <div style="color:#fff;font-size:18px;font-weight:700;letter-spacing:-.01em">ASD <span style="font-weight:400;opacity:.8">Systems</span></div>
    <div class="header-text">Partner Portal · Rejestr Projektów Partnerskich</div>
  </div>
  <div class="body">${content}</div>
  <div class="footer">ASD Systems Sp. z o.o. · asdsystems.eu · Partner Portal<br>Ta wiadomość została wygenerowana automatycznie.</div>
</div></body></html>`;
}

// ─── Email templates ──────────────────────────────────────────────────────────

export async function sendOrderCreated(opts: {
  to: string; repName: string; partnerName: string;
  orderId: string; orderCode: string; projectId: string;
  customerName: string; portalUrl: string;
}) {
  await transporter.sendMail({
    from: FROM, to: opts.to,
    subject: `📦 Nowe zamówienie — ${opts.orderCode}`,
    html: base(`
      <h1>Nowe zamówienie złożone</h1>
      <p>Partner <b>${opts.partnerName}</b> złożył nowe zamówienie.</p>
      <div class="meta">
        <div><b>Kod zamówienia:</b> <span style="font-family:monospace;font-weight:700">${opts.orderCode}</span></div>
        <div><b>Projekt:</b> ${opts.customerName}</div>
        <div><b>Nr projektu:</b> ${opts.projectId}</div>
      </div>
      <a href="${opts.portalUrl}/partner/orders/${opts.orderId}" class="btn">Zobacz szczegóły zamówienia →</a>
      <p style="font-size:13px;color:#767B86">Zamówienie czeka na uzupełnienie szczegółów i realizację.</p>
    `),
  });
}

export async function sendProjectSubmitted(opts: {
  to: string; repName: string; partnerName: string;
  projectId: string; customerName: string; customerTaxId: string; portalUrl: string;
}) {
  await transporter.sendMail({
    from: FROM, to: opts.to,
    subject: `Nowe zgłoszenie projektu — ${opts.customerName}`,
    html: base(`
      <h1>Nowe zgłoszenie projektu</h1>
      <p>Partner <b>${opts.partnerName}</b> przesłał nowe zgłoszenie do weryfikacji.</p>
      <div class="meta">
        <div><b>Klient końcowy:</b> ${opts.customerName}</div>
        <div><b>NIP / Tax ID:</b> ${opts.customerTaxId}</div>
        <div><b>Nr projektu:</b> ${opts.projectId}</div>
      </div>
      <a href="${opts.portalUrl}/staff/projects/${opts.projectId}" class="btn">Otwórz zgłoszenie →</a>
      <p style="font-size:13px;color:#767B86">Zaloguj się do portalu, aby zaakceptować lub odrzucić zgłoszenie.</p>
    `),
  });
}

export async function sendProjectAccepted(opts: {
  to: string; partnerContact: string; projectId: string;
  customerName: string; expiresAt: string; portalUrl: string;
}) {
  await transporter.sendMail({
    from: FROM, to: opts.to,
    subject: `✅ Projekt zaakceptowany — ${opts.customerName}`,
    html: base(`
      <h1>Projekt zaakceptowany</h1>
      <p>Cześć, <b>${opts.partnerContact}</b>!</p>
      <p>Twój projekt dla klienta <b>${opts.customerName}</b> został zaakceptowany przez Handlowca ASD Systems.</p>
      <div class="meta">
        <div><b>Nr projektu:</b> ${opts.projectId}</div>
        <div><b>Ochrona do:</b> <b style="color:#1E8A5A">${opts.expiresAt}</b></div>
      </div>
      <span class="badge badge-ok">Aktywny – chroniony</span>
      <br><br>
      <a href="${opts.portalUrl}/partner/projects/${opts.projectId}" class="btn">Zobacz projekt →</a>
    `),
  });
}

export async function sendProjectRejected(opts: {
  to: string; partnerContact: string; projectId: string;
  customerName: string; reason: string; portalUrl: string;
}) {
  await transporter.sendMail({
    from: FROM, to: opts.to,
    subject: `Projekt odrzucony — ${opts.customerName}`,
    html: base(`
      <h1>Projekt odrzucony</h1>
      <p>Cześć, <b>${opts.partnerContact}</b>!</p>
      <p>Zgłoszenie projektu dla klienta <b>${opts.customerName}</b> zostało odrzucone.</p>
      <div class="meta">
        <div><b>Nr projektu:</b> ${opts.projectId}</div>
        <div><b>Powód:</b> ${opts.reason}</div>
      </div>
      <a href="${opts.portalUrl}/partner/projects/${opts.projectId}" class="btn">Zobacz projekt →</a>
      <p style="font-size:13px;color:#767B86">Masz pytania? Skontaktuj się ze swoim Handlowcem ASD.</p>
    `),
  });
}

export async function sendNeedInfo(opts: {
  to: string; partnerContact: string; projectId: string;
  customerName: string; message: string; portalUrl: string;
}) {
  await transporter.sendMail({
    from: FROM, to: opts.to,
    subject: `Uzupełnij dane projektu — ${opts.customerName}`,
    html: base(`
      <h1>Prośba o uzupełnienie danych</h1>
      <p>Cześć, <b>${opts.partnerContact}</b>!</p>
      <p>Handlowiec ASD Systems prosi o uzupełnienie danych projektu dla klienta <b>${opts.customerName}</b>.</p>
      <div class="meta"><b>Wiadomość od Handlowca:</b><br><br>${opts.message}</div>
      <a href="${opts.portalUrl}/partner/projects/${opts.projectId}/edit" class="btn">Uzupełnij dane →</a>
    `),
  });
}
