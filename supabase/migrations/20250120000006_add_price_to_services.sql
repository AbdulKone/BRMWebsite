-- Ajouter le champ price à la table services
ALTER TABLE services ADD COLUMN IF NOT EXISTS price text;

-- Mettre à jour les services existants avec un prix par défaut
UPDATE services SET price = 'Sur devis' WHERE price IS NULL;