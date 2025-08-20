-- Update RLS policies to allow anon users full access to teams table
-- This is needed for the admin interface to work without authentication

-- Drop existing policies for teams table
DROP POLICY IF EXISTS "Allow public read access to teams" ON teams;
DROP POLICY IF EXISTS "Allow authenticated full access to teams" ON teams;

-- Create new policies that allow anon users full access to teams
CREATE POLICY "Allow anon full access to teams" ON teams FOR ALL USING (true);
CREATE POLICY "Allow authenticated full access to teams" ON teams FOR ALL USING (auth.role() = 'authenticated');

-- Grant full permissions to anon role for teams table
GRANT ALL PRIVILEGES ON teams TO anon;
GRANT USAGE, SELECT ON SEQUENCE teams_id_seq TO anon;

-- Also update groups table permissions since teams reference groups
DROP POLICY IF EXISTS "Allow public read access to groups" ON groups;
DROP POLICY IF EXISTS "Allow authenticated full access to groups" ON groups;

CREATE POLICY "Allow anon full access to groups" ON groups FOR ALL USING (true);
CREATE POLICY "Allow authenticated full access to groups" ON groups FOR ALL USING (auth.role() = 'authenticated');

GRANT ALL PRIVILEGES ON groups TO anon;
GRANT USAGE, SELECT ON SEQUENCE groups_id_seq TO anon;