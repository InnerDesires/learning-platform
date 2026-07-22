/** Ukrainian admin-invite email, matching the OTP email's house style. */
export function buildInviteEmailHtml(url: string): string {
  return `<!DOCTYPE html>
<html lang="uk">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px">
    <tr><td align="center">
      <table width="100%" style="max-width:420px;background:#ffffff;border-radius:12px;padding:40px 32px;text-align:center">
        <tr><td>
          <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#18181b">Залізна Зміна</h1>
          <p style="margin:0 0 24px;font-size:14px;color:#71717a">Запрошення до панелі адміністратора</p>
          <p style="margin:0 0 24px;font-size:14px;color:#3f3f46">Вам надано доступ до керування платформою. Натисніть кнопку, щоб створити обліковий запис:</p>
          <a href="${url}" style="display:inline-block;margin:0 0 24px;padding:14px 28px;background:#f98c1f;border-radius:8px;font-size:15px;font-weight:700;color:#04122e;text-decoration:none">Прийняти запрошення</a>
          <p style="margin:0 0 24px;font-size:12px;color:#a1a1aa;word-break:break-all">Або відкрийте посилання вручну:<br><a href="${url}" style="color:#71717a">${url}</a></p>
          <p style="margin:0;font-size:13px;color:#a1a1aa">Якщо ви не очікували цього запрошення — просто ігноруйте цей лист.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}
