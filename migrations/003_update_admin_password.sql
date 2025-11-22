-- Update Admin User Password
-- This will update the existing admin user with a known password
-- 
-- Login credentials after running this:
-- Email: admin@pharmacy.com
-- Password: admin123

UPDATE admin_users 
SET password_hash = '$2b$10$65QyWPE9Jt/LjnOGQpFOruLe.ypJgFg8OVYbE16bElJTeo0U7/hha'
WHERE email = 'admin@pharmacy.com';

-- Verify the update
SELECT email, full_name, created_at FROM admin_users WHERE email = 'admin@pharmacy.com';
