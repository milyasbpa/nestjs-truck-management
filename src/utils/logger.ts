import * as winston from 'winston';
import 'winston-daily-rotate-file';

export const logger = winston.createLogger({
  level: 'error', // Level log (info, error, warn, debug, dll.)
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ level, message, timestamp }) => {
      return `${timestamp} [${level}]: ${message}`;
    })
  ),
  transports: [
    new winston.transports.DailyRotateFile({
      dirname: 'logs', // Folder untuk menyimpan log
      filename: 'rppj-%DATE%.log', // Nama file dengan format tanggal
      datePattern: 'YYYY-MM-DD', // Pola tanggal untuk log harian
      zippedArchive: true, // Arsipkan log lama dalam format .gz
      maxSize: '2m', // Ukuran maksimal file (2 MB)
      maxFiles: '60d', // Simpan log selama 60 hari
    }),
    new winston.transports.Console({
      level: 'error', // Menentukan level minimum
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({level, message, timestamp }) => {
          return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
        }),
      ),
    }), // Output ke console (opsional)
  ],
});
