-- Migración 041: Añadir columna source a action_history
-- Permite distinguir registros creados por el frontend vs backend

ALTER TABLE action_history ADD COLUMN IF NOT EXISTS source VARCHAR(20) DEFAULT 'backend';

-- Marcar registros existentes como provenientes del frontend
UPDATE action_history SET source = 'frontend' WHERE source = 'backend';
