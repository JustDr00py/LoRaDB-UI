import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { serverRepository } from '../db/repositories/serverRepository';

const router = Router();

/**
 * POST /api/auth/verify-token
 * Verify if a session token is valid
 */
router.post('/verify-token', (req: Request, res: Response): void => {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({
        error: 'ValidationError',
        message: 'Token is required',
      });
      return;
    }

    const decoded = jwt.verify(token, config.jwtSecret, {
      algorithms: ['HS256'],
    }) as jwt.JwtPayload;

    // Verify server still exists
    const serverId = decoded.server_id;
    if (!serverId || typeof serverId !== 'number') {
      res.status(401).json({
        error: 'InvalidToken',
        message: 'Token does not contain valid server context',
        valid: false,
      });
      return;
    }

    const server = serverRepository.findById(serverId);
    if (!server) {
      res.status(404).json({
        error: 'ServerNotFound',
        message: 'The server associated with this session no longer exists',
        valid: false,
      });
      return;
    }

    res.json({
      valid: true,
      sessionToken: decoded.sub,
      serverId: serverId,
      serverName: server.name,
      serverHost: server.host,
      expiresAt: new Date((decoded.exp || 0) * 1000).toISOString(),
      issuedAt: new Date((decoded.iat || 0) * 1000).toISOString(),
    });
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        error: 'TokenExpired',
        message: 'Session has expired',
        valid: false,
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        error: 'InvalidToken',
        message: 'Invalid token',
        valid: false,
      });
      return;
    }

    console.error('Error verifying token:', error);
    res.status(500).json({
      error: 'InternalError',
      message: 'Failed to verify token',
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout (client-side only - just clears session)
 */
router.post('/logout', (_req: Request, res: Response): void => {
  // Session management is client-side (localStorage)
  // This endpoint is mainly for consistency and future server-side session tracking
  res.json({
    message: 'Logged out successfully',
  });
});

export default router;
