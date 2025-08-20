-- Add username field to admin_users table and update existing admin user

-- Add username column to admin_users table
ALTER TABLE admin_users ADD COLUMN username VARCHAR(50) UNIQUE;

-- Update the existing admin user with username 'admin' and correct password hash for 'admin123'
-- Using bcrypt hash for 'admin123' with salt rounds 10
UPDATE admin_users 
SET username = 'admin', 
    password_hash = '$2b$10$K7L/8Y1t85rZExrOflhkI.9p.H2JQZpvdHjHDX6jtMIeOqbqAcukG'
WHERE email = 'admin@pickleball.com';

-- Make username NOT NULL after updating existing records
ALTER TABLE admin_users ALTER COLUMN username SET NOT NULL;