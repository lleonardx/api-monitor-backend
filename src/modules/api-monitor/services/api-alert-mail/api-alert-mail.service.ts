import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

import {
  ApiStatus,
  MonitoredApiDocument
} from '../../schemas/monitored-api.schema';

import { buildApiAlertEmailTemplate } from '../../templates/api-alert-email.template';

type ApiAlertResult = {
  status: ApiStatus;
  statusCode?: number;
  responseTimeMs?: number;
  error?: string;
  incident?: any;
};

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

  async sendApiDownAlert(api: MonitoredApiDocument, result: ApiAlertResult) {
    if (!api.alertEmails?.length) return;

    const transporter = this.createTransporter();
    const incident = result.incident;

    const html = buildApiAlertEmailTemplate({
      type: 'DOWN',
      apiName: api.name,
      apiUrl: api.url,
      status: result.status,
      statusCode: result.statusCode,
      responseTimeMs: result.responseTimeMs,
      error: result.error,
      incidentId: incident?._id?.toString(),
      startedAt: incident?.startedAt || new Date(),
      dashboardUrl: this.configService.get<string>('DASHBOARD_URL')
    });

    await transporter.sendMail({
      from: this.configService.get<string>('SMTP_FROM'),
      to: api.alertEmails.join(','),
      subject: `🚨 API fora do ar: ${api.name}`,
      html
    });

    this.logger.warn(
      `E-mail de queda enviado para ${api.alertEmails.join(', ')}`
    );
  }

  async sendApiRecoveredAlert(
    api: MonitoredApiDocument,
    result: ApiAlertResult
  ) {
    if (!api.alertEmails?.length) return;

    const transporter = this.createTransporter();
    const incident = result.incident;

    const durationSeconds = incident?.durationSeconds;
    const durationText =
      typeof durationSeconds === 'number'
        ? this.formatDuration(durationSeconds)
        : '-';

    const html = buildApiAlertEmailTemplate({
      type: 'RECOVERED',
      apiName: api.name,
      apiUrl: api.url,
      status: result.status,
      statusCode: result.statusCode,
      responseTimeMs: result.responseTimeMs,
      error: result.error,
      incidentId: incident?._id?.toString(),
      startedAt: incident?.startedAt,
      endedAt: incident?.endedAt || new Date(),
      durationText,
      dashboardUrl: this.configService.get<string>('DASHBOARD_URL')
    });

    await transporter.sendMail({
      from: this.configService.get<string>('SMTP_FROM'),
      to: api.alertEmails.join(','),
      subject: `✅ API recuperada: ${api.name}`,
      html
    });

    this.logger.log(
      `E-mail de recuperação enviado para ${api.alertEmails.join(', ')}`
    );
  }

  private formatDuration(totalSeconds: number) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}min ${seconds}s`;
    }

    if (minutes > 0) {
      return `${minutes}min ${seconds}s`;
    }

    return `${seconds}s`;
  }
}