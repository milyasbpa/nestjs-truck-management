import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { stringToBoolean } from './functions.service';
@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    // Konfigurasi SMTP
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'), // Ganti dengan SMTP provider Anda (misal: smtp.gmail.com)
      port: this.configService.get<string>('SMTP_PORT'), // Gunakan port 465 untuk SSL atau 587 untuk TLS
      secure: this.configService.get<boolean>('SMTP_SECURE'), // true jika menggunakan SSL
      auth: {
        user: this.configService.get<string>('SMTP_USER'), // Email Anda
        pass: this.configService.get<string>('SMTP_PASSWORD'), // Password Email Anda
      },
    });
  }

  async sendVerificationEmail(
    to: string,
    verificationLink: string,
  ): Promise<void> {
    const mailOptions = {
      from: this.configService.get<string>('SMTP_USER'), // Nama pengirim
      to, // Email penerima
      subject: 'Email Verification',
      html: `
        <p>Hi,</p>
        <p>Click the link below to verify your email:</p>
        <a href="${verificationLink}">${verificationLink}</a>
      `,
    };
    await this.transporter.sendMail(mailOptions);
  }
  private generateVerificationToken(): string {
    // Buat token (gunakan library seperti uuid atau crypto)
    return Math.random().toString(36).substring(2, 15);
  }

}
