-- Table des providers API
CREATE TABLE IF NOT EXISTS api_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  rate_limit INTEGER DEFAULT 100,
  fields JSONB DEFAULT '[]',
  active BOOLEAN DEFAULT true,
  api_key_env TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des règles de filtrage
CREATE TABLE IF NOT EXISTS filter_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  filters JSONB NOT NULL DEFAULT '[]',
  logic TEXT CHECK (logic IN ('AND', 'OR')) DEFAULT 'AND',
  priority INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des mappings industrie
CREATE TABLE IF NOT EXISTS industry_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  industry TEXT NOT NULL UNIQUE,
  keywords TEXT[] NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des mappings localisation
CREATE TABLE IF NOT EXISTS location_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location TEXT NOT NULL UNIQUE,
  keywords TEXT[] NOT NULL,
  country_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des mappings taille d'entreprise
CREATE TABLE IF NOT EXISTS company_size_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  size_range TEXT NOT NULL UNIQUE,
  min_employees INTEGER NOT NULL,
  max_employees INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Politiques RLS
ALTER TABLE api_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE filter_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE industry_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_size_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users" ON api_providers FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users" ON filter_rules FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users" ON industry_mappings FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users" ON location_mappings FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users" ON company_size_mappings FOR ALL USING (auth.role() = 'authenticated');