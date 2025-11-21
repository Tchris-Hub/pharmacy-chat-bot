const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { z } = require('zod');
const supabase = require('../config/supabase');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const validate = require('../middleware/validate');
const authenticate = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const loginSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
});

const refreshSchema = z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
});

/**
 * POST /api/auth/login
 * Admin login endpoint
 */
router.post('/login', validate(loginSchema), async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Get admin user
        const { data: admin, error } = await supabase
            .from('admin_users')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !admin) {
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password',
            });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, admin.password_hash);

        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password',
            });
        }

        // Generate tokens
        const tokenPayload = {
            adminId: admin.id,
            email: admin.email,
        };

        const accessToken = generateAccessToken(tokenPayload);
        const refreshToken = generateRefreshToken(tokenPayload);

        // Store refresh token hash in database
        const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        await supabase.from('refresh_tokens').insert({
            token_hash: tokenHash,
            admin_id: admin.id,
            expires_at: expiresAt.toISOString(),
        });

        res.json({
            success: true,
            data: {
                accessToken,
                refreshToken,
                admin: {
                    id: admin.id,
                    email: admin.email,
                    fullName: admin.full_name,
                },
            },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', validate(refreshSchema), async (req, res, next) => {
    try {
        const { refreshToken } = req.body;

        // Verify refresh token
        let decoded;
        try {
            decoded = verifyRefreshToken(refreshToken);
        } catch (error) {
            return res.status(401).json({
                success: false,
                error: 'Invalid or expired refresh token',
            });
        }

        // Check if token exists and is not revoked
        const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

        const { data: tokenRecord, error } = await supabase
            .from('refresh_tokens')
            .select('*')
            .eq('token_hash', tokenHash)
            .eq('revoked', false)
            .single();

        if (error || !tokenRecord) {
            return res.status(401).json({
                success: false,
                error: 'Invalid refresh token',
            });
        }

        // Check if token is expired
        if (new Date(tokenRecord.expires_at) < new Date()) {
            return res.status(401).json({
                success: false,
                error: 'Refresh token expired',
            });
        }

        // Generate new access token
        const tokenPayload = {
            adminId: decoded.adminId,
            email: decoded.email,
        };

        const accessToken = generateAccessToken(tokenPayload);

        res.json({
            success: true,
            data: {
                accessToken,
            },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/auth/logout
 * Logout and revoke refresh token
 */
router.post('/logout', authenticate, validate(refreshSchema), async (req, res, next) => {
    try {
        const { refreshToken } = req.body;

        // Hash the token
        const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

        // Revoke the token
        await supabase
            .from('refresh_tokens')
            .update({ revoked: true })
            .eq('token_hash', tokenHash)
            .eq('admin_id', req.admin.id);

        res.json({
            success: true,
            message: 'Logged out successfully',
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
