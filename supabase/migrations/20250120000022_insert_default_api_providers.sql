-- Insertion des providers API par défaut (sans ON CONFLICT car pas de contrainte unique sur name)
INSERT INTO api_providers (name, endpoint, rate_limit, fields, active, api_key_env) 
SELECT 'Hunter.io', 'https://api.hunter.io/v2', 100, '["email", "first_name", "last_name", "position", "company", "domain", "confidence"]'::jsonb, true, 'HUNTER_API_KEY'
WHERE NOT EXISTS (SELECT 1 FROM api_providers WHERE name = 'Hunter.io');

INSERT INTO api_providers (name, endpoint, rate_limit, fields, active, api_key_env) 
SELECT 'Apollo.io', 'https://api.apollo.io/v1', 50, '["email", "first_name", "last_name", "title", "organization_name", "linkedin_url"]'::jsonb, false, 'APOLLO_API_KEY'
WHERE NOT EXISTS (SELECT 1 FROM api_providers WHERE name = 'Apollo.io');

INSERT INTO api_providers (name, endpoint, rate_limit, fields, active, api_key_env) 
SELECT 'ZoomInfo', 'https://api.zoominfo.com/lookup', 25, '["email", "firstName", "lastName", "jobTitle", "companyName", "industry"]'::jsonb, false, 'ZOOMINFO_API_KEY'
WHERE NOT EXISTS (SELECT 1 FROM api_providers WHERE name = 'ZoomInfo');

-- Insertion des mappings d'industrie par défaut
INSERT INTO industry_mappings (industry, keywords, description) 
SELECT 'music', ARRAY['music', 'musician', 'artist', 'record', 'studio', 'sound'], 'Industrie musicale'
WHERE NOT EXISTS (SELECT 1 FROM industry_mappings WHERE industry = 'music');

INSERT INTO industry_mappings (industry, keywords, description) 
SELECT 'media', ARRAY['media', 'television', 'radio', 'broadcast', 'news', 'journalism'], 'Médias et communication'
WHERE NOT EXISTS (SELECT 1 FROM industry_mappings WHERE industry = 'media');

INSERT INTO industry_mappings (industry, keywords, description) 
SELECT 'advertising', ARRAY['advertising', 'marketing', 'agency', 'creative', 'brand', 'campaign'], 'Publicité et marketing'
WHERE NOT EXISTS (SELECT 1 FROM industry_mappings WHERE industry = 'advertising');

INSERT INTO industry_mappings (industry, keywords, description) 
SELECT 'luxury', ARRAY['luxury', 'fashion', 'jewelry', 'premium', 'haute couture', 'designer'], 'Secteur du luxe'
WHERE NOT EXISTS (SELECT 1 FROM industry_mappings WHERE industry = 'luxury');

INSERT INTO industry_mappings (industry, keywords, description) 
SELECT 'sports', ARRAY['sports', 'fitness', 'athlete', 'team', 'competition', 'training'], 'Sports et fitness'
WHERE NOT EXISTS (SELECT 1 FROM industry_mappings WHERE industry = 'sports');

-- Insertion des mappings de localisation par défaut
INSERT INTO location_mappings (location, keywords, country_code) 
SELECT 'france', ARRAY['france', 'french', 'paris', 'lyon', 'marseille', 'toulouse'], 'FR'
WHERE NOT EXISTS (SELECT 1 FROM location_mappings WHERE location = 'france');

INSERT INTO location_mappings (location, keywords, country_code) 
SELECT 'europe', ARRAY['europe', 'european', 'eu', 'london', 'berlin', 'madrid'], 'EU'
WHERE NOT EXISTS (SELECT 1 FROM location_mappings WHERE location = 'europe');

INSERT INTO location_mappings (location, keywords, country_code) 
SELECT 'international', ARRAY['international', 'global', 'worldwide', 'multinational'], 'INT'
WHERE NOT EXISTS (SELECT 1 FROM location_mappings WHERE location = 'international');

-- Insertion des mappings de taille d'entreprise par défaut
INSERT INTO company_size_mappings (size_range, min_employees, max_employees, description) 
SELECT 'startup', 1, 10, 'Startups et très petites entreprises'
WHERE NOT EXISTS (SELECT 1 FROM company_size_mappings WHERE size_range = 'startup');

INSERT INTO company_size_mappings (size_range, min_employees, max_employees, description) 
SELECT 'small', 11, 50, 'Petites entreprises'
WHERE NOT EXISTS (SELECT 1 FROM company_size_mappings WHERE size_range = 'small');

INSERT INTO company_size_mappings (size_range, min_employees, max_employees, description) 
SELECT 'medium', 51, 200, 'Entreprises moyennes'
WHERE NOT EXISTS (SELECT 1 FROM company_size_mappings WHERE size_range = 'medium');

INSERT INTO company_size_mappings (size_range, min_employees, max_employees, description) 
SELECT 'large', 201, 999999, 'Grandes entreprises'
WHERE NOT EXISTS (SELECT 1 FROM company_size_mappings WHERE size_range = 'large');