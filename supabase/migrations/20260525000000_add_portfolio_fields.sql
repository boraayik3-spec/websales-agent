-- Add new columns to outreach table for portfolio tracking and classification
ALTER TABLE outreach
ADD COLUMN IF NOT EXISTS classification TEXT CHECK (classification IN ('interested', 'not_interested', 'maybe')),
ADD COLUMN IF NOT EXISTS portfolio_sent_at TIMESTAMP WITH TIME ZONE;

-- Update stage enum to include new statuses
-- Note: If stage column is already enum, you may need to recreate it or add values differently
-- For now, we rely on TEXT type check in application logic

-- Create index on classification for faster queries
CREATE INDEX IF NOT EXISTS idx_outreach_classification ON outreach(classification);

-- Create index on portfolio_sent_at for portfolio tracking
CREATE INDEX IF NOT EXISTS idx_outreach_portfolio_sent_at ON outreach(portfolio_sent_at);

-- Update the stage check constraint if needed (depends on current implementation)
-- This allows the new stages: portfolio_sent, uninterested, maybe_interested
