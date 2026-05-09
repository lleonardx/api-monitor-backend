import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { ApiStatus, MonitoredApiDocument } from '../../schemas/monitored-api.schema';


@Injectable()
export class ApiAlertMailService {
  private readonly logger = new Logger(ApiAlertMailService.name);

  constructor(private readonly configService: ConfigService) {}

  private createTransporter() {
    return nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: Number(this.configService.get<string>('SMTP_PORT') || 587),
      secure: this.configService.get<string>('SMTP_SECURE') === 'true',
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS')
      }
    });
  }

  async sendApiDownAlert(
    api: MonitoredApiDocument,
    result: {
      status: ApiStatus;
      statusCode?: number;
      responseTimeMs?: number;
      error?: string;
    }
  ) {
    if (!api.alertEmails?.length) return;

    const transporter = this.createTransporter();

    await transporter.sendMail({
      from: this.configService.get<string>('SMTP_FROM'),
      to: api.alertEmails.join(','),
      subject: `🚨 API fora do ar: ${api.name}`,
      html: `
        <h2>🚨 API fora do ar</h2>
        <p><b>Nome:</b> ${api.name}</p>
        <p><b>URL:</b> ${api.url}</p>
        <p><b>Status:</b> ${result.status}</p>
        <p><b>Status HTTP:</b> ${result.statusCode || '-'}</p>
        <p><b>Tempo de resposta:</b> ${result.responseTimeMs || '-'} ms</p>
        <p><b>Erro:</b> ${result.error || '-'}</p>
        <p><b>Data:</b> ${new Date().toLocaleString('pt-BR')}</p>
      `
    });

    this.logger.warn(`E-mail de queda enviado para ${api.alertEmails.join(', ')}`);
  }

  async sendApiRecoveredAlert(
    api: MonitoredApiDocument,
    result: {
      status: ApiStatus;
      statusCode?: number;
      responseTimeMs?: number;
      error?: string;
    }
  ) {
    if (!api.alertEmails?.length) return;

    const transporter = this.createTransporter();

    await transporter.sendMail({
      from: this.configService.get<string>('SMTP_FROM'),
      to: api.alertEmails.join(','),
      subject: `✅ API recuperada: ${api.name}`,
      html: `
        <h2>✅ API recuperada</h2>
        <p><b>Nome:</b> ${api.name}</p>
        <p><b>URL:</b> ${api.url}</p>
        <p><b>Status:</b> ${result.status}</p>
        <p><b>Status HTTP:</b> ${result.statusCode || '-'}</p>
        <p><b>Tempo de resposta:</b> ${result.responseTimeMs || '-'} ms</p>
        <p><b>Data:</b> ${new Date().toLocaleString('pt-BR')}</p>
      `
    });

    this.logger.log(`E-mail de recuperação enviado para ${api.alertEmails.join(', ')}`);
  }
}