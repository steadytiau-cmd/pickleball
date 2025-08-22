-- Add tournament_type column to teams table
ALTER TABLE teams ADD COLUMN tournament_type VARCHAR(50) DEFAULT 'group_stage';

-- Add check constraint to ensure valid values
ALTER TABLE teams ADD CONSTRAINT teams_tournament_type_check 
  CHECK (tournament_type IN ('group_stage', 'mixed_double_championship'));

-- Update existing teams to have group_stage as default
UPDATE teams SET tournament_type = 'group_stage' WHERE tournament_type IS NULL;

-- Make the column NOT NULL after setting default values
ALTER TABLE teams ALTER COLUMN tournament_type SET NOT NULL;

-- Add comment to the column
COMMENT ON COLUMN teams.tournament_type IS 'Type of tournament the team participates in: group_stage or mixed_double_championship';