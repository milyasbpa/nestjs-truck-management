export class AuthPayloadDto {
  username: string;
  password: string;
}

export class BaseResponseDto {
  status: number;
  message: string;
  data?: any;
}

export class AuthResponseDto extends BaseResponseDto {
  data: {
    email?: string;
    name?: string;
    token?: string;
    avatar?: string;
    user_id?: string;
    role?: string;
  };
}

export class JwtAuthResponse {
  id?: number;
  name?: string;
  email?: string;
}
