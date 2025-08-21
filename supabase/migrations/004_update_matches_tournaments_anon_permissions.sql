-- Update RLS policies to allow anon users full access to matches and tournaments tables
-- This is needed for the admin interface to work without authentication

-- Drop existing policies for matches table
DROP POLICY IF EXISTS "Allow public read access to matches" ON matches;
DROP POLICY IF EXISTS "Allow authenticated full access to matches" ON matches;

-- Create new policies that allow anon users full access to matches
CREATE POLICY "Allow anon full access to matches" ON matches FOR ALL USING (true);
CREATE POLICY "Allow authenticated full access to matches" ON matches FOR ALL USING (auth.role() = 'authenticated');

-- Grant full permissions to anon role for matches table
GRANT ALL PRIVILEGES ON matches TO anon;
GRANT USAGE, SELECT ON SEQUENCE matches_id_seq TO anon;

-- Drop existing policies for tournaments table
DROP POLICY IF EXISTS "Allow public read access to tournaments" ON tournaments;
DROP POLICY IF EXISTS "Allow authenticated full access to tournaments" ON tournaments;

-- Create new policies that allow anon users full access to tournaments
CREATE POLICY "Allow anon full access to tournaments" ON tournaments FOR ALL USING (true);
CREATE POLICY "Allow authenticated full access to tournaments" ON tournaments FOR ALL USING (auth.role() = 'authenticated');

-- Grant full permissions to anon role for tournaments table
GRANT ALL PRIVILEGES ON tournaments TO anon;
GRANT USAGE, SELECT ON SEQUENCE tournaments_id_seq TO anon;