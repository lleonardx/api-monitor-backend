import { ApiStatus } from '../schemas/monitored-api.schema';

type ApiAlertEmailData = {
  type: 'DOWN' | 'RECOVERED';
  apiName: string;
  apiUrl: string;
  status: ApiStatus;
  statusCode?: number;
  responseTimeMs?: number;
  error?: string;
  incidentId?: string;
  startedAt?: Date | string;
  endedAt?: Date | string;
  durationText?: string;
  dashboardUrl?: string;
};

const formatDate = (value?: Date | string) => {
  if (!value) return '-';

  return new Date(value).toLocaleString('pt-BR', {
    timeZone: 'America/Manaus'
  });
};

const safe = (value: any) => {
  if (value === null || value === undefined || value === '') return '-';
  return String(value);
};

export function buildApiAlertEmailTemplate(data: ApiAlertEmailData) {
  const isDown = data.type === 'DOWN';

  const title = isDown ? 'API fora do ar' : 'API recuperada';
  const emoji = isDown ? '🚨' : '✅';
  const color = isDown ? '#dc2626' : '#16a34a';
  const softColor = isDown ? '#fef2f2' : '#f0fdf4';
  const borderColor = isDown ? '#fecaca' : '#bbf7d0';

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
</head>

<body style="margin:0; padding:0; background:#f3f4f6; font-family:Arial, Helvetica, sans-serif; color:#111827;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6; padding:32px 12px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:720px; background:#ffffff; border-radius:18px; overflow:hidden; border:1px solid #e5e7eb; box-shadow:0 10px 30px rgba(15,23,42,0.08);">
          
          <tr>
            <td style="background:${color}; padding:26px 30px; color:#ffffff;">
              <div style="font-size:13px; letter-spacing:1px; text-transform:uppercase; opacity:.9;">
                API Monitor
              </div>
              <div style="font-size:28px; font-weight:700; margin-top:8px;">
                ${emoji} ${title}
              </div>
              <div style="font-size:14px; margin-top:8px; opacity:.95;">
                ${safe(data.apiName)}
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding:28px 30px;">
              
              <div style="background:${softColor}; border:1px solid ${borderColor}; border-radius:14px; padding:18px 20px; margin-bottom:22px;">
                <div style="font-size:14px; color:#374151; margin-bottom:6px;">
                  Status atual
                </div>
                <div style="font-size:24px; font-weight:700; color:${color};">
                  ${safe(data.status)}
                </div>
              </div>

              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                ${row('Nome da API', data.apiName)}
                ${row('URL', data.apiUrl)}
                ${row('Status HTTP', data.statusCode)}
                ${row('Tempo de resposta', data.responseTimeMs ? `${data.responseTimeMs} ms` : '-')}
                ${row('Erro', data.error)}
                ${row('Incidente', data.incidentId)}
                ${row('Início', formatDate(data.startedAt))}
                ${
                  !isDown
                    ? `
                      ${row('Fim', formatDate(data.endedAt))}
                      ${row('Duração', data.durationText)}
                    `
                    : ''
                }
              </table>

              ${
                data.dashboardUrl
                  ? `
                    <div style="margin-top:28px;">
                      <a href="${data.dashboardUrl}" style="display:inline-block; background:#111827; color:#ffffff; text-decoration:none; padding:12px 18px; border-radius:10px; font-weight:700; font-size:14px;">
                        Abrir Dashboard
                      </a>
                    </div>
                  `
                  : ''
              }

            </td>
          </tr>

          <tr>
            <td style="background:#f9fafb; padding:18px 30px; border-top:1px solid #e5e7eb; color:#6b7280; font-size:12px;">
              Este é um alerta automático do API Monitor. Verifique o incidente antes de realizar ações corretivas.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

function row(label: string, value: any) {
  return `
    <tr>
      <td style="padding:12px 0; border-bottom:1px solid #f3f4f6; width:190px; color:#6b7280; font-size:13px;">
        ${label}
      </td>
      <td style="padding:12px 0; border-bottom:1px solid #f3f4f6; color:#111827; font-size:14px; font-weight:600; word-break:break-word;">
        ${safe(value)}
      </td>
    </tr>
  `;
}