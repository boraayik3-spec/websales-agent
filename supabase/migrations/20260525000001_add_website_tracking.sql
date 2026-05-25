-- Add website tracking columns to businesses table
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS website_url TEXT,
ADD COLUMN IF NOT EXISTS website_repo_url TEXT,
ADD COLUMN IF NOT EXISTS website_status TEXT DEFAULT 'pending' CHECK (website_status IN ('pending', 'generating', 'deploying', 'deployed', 'failed')),
ADD COLUMN IF NOT EXISTS website_generated_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_businesses_website_status ON businesses(website_status);
CREATE INDEX IF NOT EXISTS idx_businesses_website_generated_at ON businesses(website_generated_at);
