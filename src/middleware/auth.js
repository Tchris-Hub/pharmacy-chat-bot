const { verifyAccessToken } = require('../utils/jwt');
const supabase = require('../config/supabase');

/**
 * Authentication middleware
 * Verifies JWT access token and attaches admin user to request
 */
async function authenticate(req, res, next) {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'No token provided',
            });
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Verify token
        let decoded;
        try {
            decoded = verifyAccessToken(token);
        } catch (error) {
            return res.status(401).json({
                success: false,
                error: 'Invalid or expired token',
            });
        }

        // Get admin user from database
        const { data: admin, error } = await supabase
            .from('admin_users')
            .select('id, email, full_name')
            .eq('id', decoded.adminId)
            .single();

        if (error || !admin) {
            return res.status(401).json({
                success: false,
                error: 'Admin user not found',
            });
        }

        // Attach admin to request
        req.admin = admin;
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(500).json({
            success: false,
            error: 'Authentication failed',
        });
    }
}

module.exports = authenticate;
