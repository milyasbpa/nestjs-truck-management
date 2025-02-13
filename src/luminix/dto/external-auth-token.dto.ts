export interface ExternalAuthTokenDto {
  code: string;
  auth_token: string;
  expired_at: Date;
}