export interface LuminixLoginRequest {
    userId: string;
    password: string;
}

export interface LuminixLoginResponse {
  message: string;
  token: string;
}