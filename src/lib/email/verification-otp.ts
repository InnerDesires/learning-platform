export function buildOtpEmailHtml(otp: string): string {
  return `<!DOCTYPE html>
<html lang="uk">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px">
    <tr><td align="center">
      <table width="100%" style="max-width:420px;background:#ffffff;border-radius:12px;padding:40px 32px;text-align:center">
        <tr><td>
          <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#18181b">Залізна Зміна</h1>
          <p style="margin:0 0 24px;font-size:14px;color:#71717a">Код підтвердження реєстрації</p>
          <div style="margin:0 auto 24px;padding:16px 0;background:#f4f4f5;border-radius:8px;letter-spacing:8px;font-size:32px;font-weight:700;font-family:'Courier New',monospace;color:#18181b">${otp}</div>
          <p style="margin:0;font-size:13px;color:#a1a1aa">Код дійсний 5 хвилин. Якщо ви не реєструвалися — ігноруйте цей лист.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}
