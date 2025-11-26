import { Router, Request, Response } from 'express';
import axios, { AxiosError } from 'axios';
import { config } from '../config/env';

const router = Router();

// Create axios instance for LoRaDB API
const loradbClient = axios.create({
  baseURL: config.loradbApiUrl,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Helper function to forward Authorization header
 */
const getAuthHeader = (req: Request): Record<string, string> => {
  const auth = req.headers.authorization;
  return auth ? { Authorization: auth } : {};
};

/**
 * Helper function to handle errors from LoRaDB API
 */
const handleLoraDbError = (error: unknown, res: Response): void => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;

    if (axiosError.response) {
      // Forward the error response from LoRaDB
      res.status(axiosError.response.status).json(axiosError.response.data);
      return;
    }

    if (axiosError.code === 'ECONNREFUSED') {
      res.status(503).json({
        error: 'ServiceUnavailable',
        message: 'LoRaDB API is not available',
      });
      return;
    }

    if (axiosError.code === 'ETIMEDOUT') {
      res.status(504).json({
        error: 'Timeout',
        message: 'Request to LoRaDB API timed out',
      });
      return;
    }
  }

  console.error('Unexpected error:', error);
  res.status(500).json({
    error: 'InternalError',
    message: 'An unexpected error occurred',
  });
};

/**
 * GET /api/health
 * Health check endpoint (no auth required)
 */
router.get('/health', async (_req: Request, res: Response) => {
  try {
    const response = await loradbClient.get('/health');
    res.json(response.data);
  } catch (error) {
    handleLoraDbError(error, res);
  }
});

/**
 * POST /api/query
 * Execute a query (auth required)
 */
router.post('/query', async (req: Request, res: Response) => {
  try {
    const response = await loradbClient.post('/query', req.body, {
      headers: getAuthHeader(req),
    });
    res.json(response.data);
  } catch (error) {
    handleLoraDbError(error, res);
  }
});

/**
 * GET /api/devices
 * List all devices (auth required)
 */
router.get('/devices', async (req: Request, res: Response) => {
  try {
    const response = await loradbClient.get('/devices', {
      headers: getAuthHeader(req),
    });
    res.json(response.data);
  } catch (error) {
    handleLoraDbError(error, res);
  }
});

/**
 * GET /api/devices/:dev_eui
 * Get device information (auth required)
 */
router.get('/devices/:dev_eui', async (req: Request, res: Response) => {
  try {
    const { dev_eui } = req.params;
    const response = await loradbClient.get(`/devices/${dev_eui}`, {
      headers: getAuthHeader(req),
    });
    res.json(response.data);
  } catch (error) {
    handleLoraDbError(error, res);
  }
});

export default router;
