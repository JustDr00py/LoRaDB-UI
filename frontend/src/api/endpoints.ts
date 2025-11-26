import apiClient from './client';
import type {
  HealthResponse,
  DeviceListResponse,
  DeviceInfo,
  QueryRequest,
  QueryResult,
  GenerateTokenRequest,
  TokenResponse,
  VerifyTokenRequest,
  VerifyTokenResponse,
} from '../types/api';

// Authentication
export const generateToken = async (
  data: GenerateTokenRequest
): Promise<TokenResponse> => {
  const response = await apiClient.post<TokenResponse>('/api/auth/generate-token', data);
  return response.data;
};

export const verifyToken = async (
  data: VerifyTokenRequest
): Promise<VerifyTokenResponse> => {
  const response = await apiClient.post<VerifyTokenResponse>('/api/auth/verify-token', data);
  return response.data;
};

// Health Check
export const getHealth = async (): Promise<HealthResponse> => {
  const response = await apiClient.get<HealthResponse>('/api/health');
  return response.data;
};

// Devices
export const getDevices = async (): Promise<DeviceListResponse> => {
  const response = await apiClient.get<DeviceListResponse>('/api/devices');
  return response.data;
};

export const getDevice = async (devEui: string): Promise<DeviceInfo> => {
  const response = await apiClient.get<DeviceInfo>(`/api/devices/${devEui}`);
  return response.data;
};

// Query
export const executeQuery = async (data: QueryRequest): Promise<QueryResult> => {
  const response = await apiClient.post<QueryResult>('/api/query', data);
  return response.data;
};
