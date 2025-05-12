/*
  # Ajout du champ profile_url pour les artistes

  1. Changements
    - Ajout de la colonne profile_url à la table artists
    - La colonne est optionnelle pour permettre une migration en douceur
*/

ALTER TABLE artists
ADD COLUMN IF NOT EXISTS profile_url text;