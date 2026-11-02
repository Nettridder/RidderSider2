-- 005_repertoire_sort_order.sql — repertoires get a sort_order, so Note Admin can choose their order in the Noter menu.
-- Run ONCE on a database made with the OLD 001_schema.sql. A database made with the current 001_schema.sql
-- already has the column: then skip this file. Safe to run twice.
-- Paste in the Domeneshop database browser (SQL) and run.

USE `armeriddereno05`;

SET NAMES utf8mb4;

-- SAFETY: never run this in the old live site's database.
SET @STOP_this_is_the_live_database_choose_the_dev_database = IF(DATABASE() = 'armeriddere', (SELECT 1 UNION SELECT 2), 1);

ALTER TABLE repertoires
  ADD COLUMN IF NOT EXISTS sort_order int(11) NOT NULL DEFAULT 0 AFTER hidden_for_former;

-- Keep today's order (oldest first): numbers rows that have not been given an order yet.
SET @n = 0;
UPDATE repertoires SET sort_order = (@n := @n + 1) WHERE sort_order = 0 ORDER BY id;

SELECT id, name, sort_order FROM repertoires ORDER BY sort_order;
