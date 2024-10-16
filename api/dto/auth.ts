export interface AuthDTO {
  valid: boolean;
  message: string;
}

export interface TokenDTO {
  token: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginDTO {
  emai: string
  password: string
}
