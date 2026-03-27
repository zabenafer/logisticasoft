export interface LoginRequest {
  usernameOrEmail: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  transportistaId: number;
  username: string;
  roles: string[];
}

export interface RefreshResponse {
  accessToken: string;
}
