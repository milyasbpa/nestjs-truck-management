import { BadRequestException, Logger } from '@nestjs/common';
import { TypeOfTruckEnum } from './enums';
import * as CryptoJS from 'crypto-js';
import { randomBytes } from 'crypto';
import { parse, isValid, format } from 'date-fns';

export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));
export function getRandomElement<T>(array: T[]): T {
  const randomIndex = Math.floor(Math.random() * array.length);
  return array[randomIndex];
}

export function mapTruckType(input: string): string | undefined {
  return TypeOfTruckEnum[input as keyof TypeOfTruckEnum];
}
export function numberToBoolean(input: number) {
  return input === 1 ? true : false;
}

export function generateRandomString(length) {
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

export function throwBadRequestError(error, msg): void {
  const err = generateErrorCode();
  Logger.error(`msg:${error.message}. Error Code:${err}`, error.stack);
  throw new BadRequestException({
    code: err,
    message: msg,
  });
}
export function base64Encode(text: string): string {
  return Buffer.from(text, 'utf-8').toString('base64');
}
export function base64Decode(base64: string): string {
  return Buffer.from(base64, 'base64').toString('utf-8');
}

export function encryptJSAES(text: string): string {
  if (text === null) {
    return null;
  }
  return base64Encode(
    CryptoJS.AES.encrypt(text, process.env.ENCRYPTION_KEY).toString(),
  );
}

export function decryptJSAES(ciphertext: string): string {
  const bytes = CryptoJS.AES.decrypt(
    base64Decode(ciphertext),
    process.env.ENCRYPTION_KEY,
  );
  return bytes.toString(CryptoJS.enc.Utf8);
}
export function generateErrorCode(): string {
  return `${randomBytes(4).toString('hex').toUpperCase()}`;
}
export function compressJSON(json: any) {
  const jsonString = JSON.stringify(json);
  const jsoByte = Buffer.from(jsonString);
  return jsoByte.toString('base64');
}
export function stringToBoolean(status: string): any {
  let bstatus = false;
  if (status === '1' || status === 'true') {
    bstatus = true;
  } else if (status === '0' || status === 'false') {
    bstatus = false;
  } else {
    bstatus = null;
  }
  return bstatus;
}
export function getMetaData(req: any): Record<string, any> {
  const metadata = {
    userAgent: req.headers['x-forwarded-for'],
    ip: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
  };
  return metadata;
}
export function isStringNonNumeric(input: string): boolean {
  return isNaN(Number(input));
}
export function isSHA512Hash(password: string): boolean {
  const hexRegex = /^[a-fA-F0-9]{128}$/; // SHA-512 in hexadecimal
  const base64Regex = /^[a-zA-Z0-9+/]{86}==$/; // SHA-512 in Base64
  return hexRegex.test(password) || base64Regex.test(password);
}
export function isEmpty(value: any): boolean {
  return (
    value === null ||
    value === undefined ||
    (typeof value === 'string' && value.trim() === '') ||
    (Array.isArray(value) && value.length === 0) ||
    (typeof value === 'object' &&
      value !== null &&
      Object.keys(value).length === 0)
  );
}
export function getCurrentDate(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are zero-based, so we add 1
  const day = String(today.getDate()).padStart(2, '0'); // Ensure 2 digits for day
  return year + '-' + month + '-' + day;
}
export function formatDateToISO(dateInput: string | Date | number): string {
  let date: Date;

  // Jika input adalah string
  if (typeof dateInput === 'string') {
    // Coba parsing dengan format 'dd/MM/yyyy'
    date = parse(dateInput, 'dd/MM/yyyy', new Date());
    if (!isValid(date)) {
      // Jika gagal, coba parsing dengan format 'yyyy-MM-dd'
      date = parse(dateInput, 'yyyy-MM-dd', new Date());
    }
    if (!isValid(date)) {
      // Jika gagal, coba parsing dengan format 'dd/mmm/yyyy'
      date = parse(dateInput, 'dd/MMM/yyyy', new Date());
    }
  } else if (typeof dateInput === 'number') {
    // Jika input adalah timestamp
    date = new Date(dateInput);
  } else {
    // Jika input adalah objek Date
    date = dateInput;
  }

  // Periksa apakah tanggal valid
  if (!isValid(date)) {
    throw new Error('Format tanggal tidak valid');
  }

  // Format tanggal menjadi 'yyyy-MM-dd'
  return format(date, 'yyyy-MM-dd');
}
export function parseCP(data: string) {
  // Pola untuk mencari "CP" dan angka/huruf setelahnya, dan menghindari bagian lain setelahnya
  const pattern = /CP\s*(\d+[A-Za-z]*)\b/;
  const match = data.match(pattern); //ambil data setelah CP sesuai pattern
  if (match) {
    const cpNumber = match[1] || '';
    return `CP ${cpNumber}`;
  }
  return '';
}
export function removeAllSpaces(data:string){
  return data.replace(/\s+/g, '');
}
