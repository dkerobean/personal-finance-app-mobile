export interface ApiError {
  error: {
    code: string;
    message: string;
  };
}

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError['error'];
}

export interface SignUpRequest {
  email: string;
  password: string;
}

export interface VerifyOtpRequest {
  email: string;
  token: string;
}