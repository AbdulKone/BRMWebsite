-- Ajouter les contraintes uniques
ALTER TABLE api_providers ADD CONSTRAINT api_providers_name_unique UNIQUE (name);
ALTER TABLE industry_mappings ADD CONSTRAINT industry_mappings_industry_unique UNIQUE (industry);
ALTER TABLE location_mappings ADD CONSTRAINT location_mappings_location_unique UNIQUE (location);
ALTER TABLE company_size_mappings ADD CONSTRAINT company_size_mappings_size_range_unique UNIQUE (size_range);

-- Puis utiliser ON CONFLICT
INSERT INTO api_providers (name, endpoint, rate_limit, fields, active, api_key_env) VALUES
('Hunter.io', 'https://api.hunter.io/v2', 100, '["email", "first_name", "last_name", "position", "company", "domain", "confidence"]'::jsonb, true, 'HUNTER_API_KEY')
ON CONFLICT (name) DO UPDATE SET
  endpoint = EXCLUDED.endpoint,
  rate_limit = EXCLUDED.rate_limit,
  fields = EXCLUDED.fields,
  active = EXCLUDED.active,
  api_key_env = EXCLUDED.api_key_env;

-- ... reste des insertions avec ON CONFLICT