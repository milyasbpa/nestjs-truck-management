import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { DatabaseService } from './database.service';
import { ErrorHandlerService } from './error-handler.service';

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-cbc';
  private readonly secretKey =
    process.env.ENCRYPTION_KEY || 'FZY6dwHkArwz5tpEzGZMyo6qSAe5vPGo';
  private readonly ivLength = 16; // Panjang IV untuk aes-256-cbc

  constructor(
    private readonly conn: DatabaseService,
    private readonly errHandler: ErrorHandlerService,
  ) {}
  // Enkripsi ID
  encrypt(text: string): string {
    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipheriv(
      this.algorithm,
      Buffer.from(this.secretKey),
      iv,
    );
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + 'ifOue' + encrypted;
  }

  // Dekripsi ID
  decrypt(encryptedText: string): string {
    const [ivText, encrypted] = encryptedText.split('ifOue');
    const iv = Buffer.from(ivText, 'hex');
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      Buffer.from(this.secretKey),
      iv,
    );
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
  // Decrypt data
  async decryptFromDB(id: string): Promise<any> {
    this.errHandler.logDebug(id);
    return await this.conn.queryOne(
      ` select pgp_sym_decrypt(decode('${id}','base64'),'${this.secretKey}') id`,
    );
  }
}
