// Health Check
export interface HealthResponse {
  status: string;
  version: string;
}

// Device Management
export interface DeviceInfo {
  dev_eui: string;
  device_name: string | null;
  application_id: string;
  last_seen: string | null;
}

export interface DeviceListResponse {
  total_devices: number;
  devices: DeviceInfo[];
}

// Query
export interface QueryRequest {
  query: string;
}

export interface QueryResult {
  dev_eui: string;
  total_frames: number;
  frames: Frame[];
}

export interface FrameData {
  dev_eui: string;
  received_at: string;
  f_port?: number;
  f_cnt?: number;
  confirmed?: boolean;
  adr?: boolean;
  dr?: DataRate;
  frequency?: number;
  rx_info?: RxInfo[];
  decoded_payload?: any;
  raw_payload?: string;
  device_name?: string;
  application_id?: string;
  [key: string]: any; // Allow additional fields
}

export interface Frame {
  Uplink?: FrameData;
  Downlink?: FrameData;
  Join?: FrameData;
  [key: string]: any; // Allow additional fields for backward compatibility
}

export interface DataRate {
  lora?: {
    bandwidth: number;
    spreading_factor: number;
  };
}

export interface RxInfo {
  gateway_id?: string;
  rssi?: number;
  snr?: number;
  [key: string]: any;
}

// Authentication
export interface GenerateTokenRequest {
  username: string;
  expirationHours?: number;
}

export interface TokenResponse {
  token: string;
  expiresIn: number;
  expiresAt: string;
  username: string;
}

export interface VerifyTokenRequest {
  token: string;
}

export interface VerifyTokenResponse {
  valid: boolean;
  username?: string;
  expiresAt?: string;
  issuedAt?: string;
}

// Error Response
export interface ErrorResponse {
  error: string;
  message: string;
  stack?: string;
}

// Query DSL Types
export type FrameType = 'all' | 'uplink' | 'downlink' | 'join' | 'decoded_payload' | 'custom';
export type TimeRangeType = 'last' | 'since' | 'between' | 'none';

export interface QueryConfig {
  devEui: string;
  frameType: FrameType;
  timeRangeType: TimeRangeType;
  // For 'last' type
  lastDuration?: string;
  lastUnit?: 'ms' | 's' | 'm' | 'h' | 'd' | 'w';
  // For 'since' type
  sinceDate?: string;
  // For 'between' type
  startDate?: string;
  endDate?: string;
  // Custom fields
  customFields?: string[];
}
