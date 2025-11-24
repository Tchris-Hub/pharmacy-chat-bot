-- Create First Admin User
-- 
-- IMPORTANT: Replace 'BCRYPT_HASH_HERE' with an actual bcrypt hash of your password
-- 
-- To gecomnerate a bcrypt hash, run this in Node.js:
-- node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('your-password-here', 10).then(hash => console.log(hash));"
--
-- Example with password 'admin123':
-- node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('admin123', 10).then(hash => console.log(hash));"

INSERT INTO admin_users (email, password_hash, full_name)
VALUES (
    'admin@pharmacy.com',
    '$2b$10$XCsoGN5PkbyRId6f2Cs6m.O211CVaqSHowxJ13dD/VtBZnF/HBYGS',
    'Admin User'
)
ON CONFLICT (email) DO NOTHING;

-- After running this, you can lo.gin with:
-- Email: admin@pharmacy.com
-- Password: (whatever password you used to generate the hash)
