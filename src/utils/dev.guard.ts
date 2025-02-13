import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";

@Injectable()
export class DevGuard implements CanActivate {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  canActivate(context: ExecutionContext): boolean {
    // Periksa apakah NODE_ENV adalah 'development'
    return process.env.NODE_ENV === 'development';
  }
}
