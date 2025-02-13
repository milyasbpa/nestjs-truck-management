import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
@Injectable()
export class PasswordService {
  // Fungsi untuk mengecek kekuatan password
  checkStrongPassword(password: string): boolean {
    // Minimal 12 karakter
    const minLength = 12;

    // Regular expression untuk memeriksa kekuatan password
    const strongPasswordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{12,}$/;

    // Memeriksa apakah password memenuhi kriteria
    if (password.length < minLength) {
      return false; // Password terlalu pendek
    }

    // Memeriksa apakah password sesuai dengan pola regex
    return strongPasswordRegex.test(password);
  }

  // Fungsi untuk mengenkripsi password menggunakan SHA-512
  encryptPassword(password: string): string {
    const hash = crypto.createHash('sha512');
    hash.update(password);
    return hash.digest('hex');
  }

  // Fungsi untuk memverifikasi password
  verifyPassword(storedHash: string, password: string): boolean {
    const hash = this.encryptPassword(password);
    return hash === storedHash; // Memeriksa apakah hash password yang diberikan cocok
  }
  generateRandomPassword(length: number = 12): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+{}:"<>?';
    let password = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      password += characters[randomIndex];
    }
    return password;
  }

}
