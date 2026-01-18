-- Rename scenario2_name to scenario0_name (scenario numbering starts from 0)
ALTER TABLE public.devices RENAME COLUMN scenario2_name TO scenario0_name;

-- Update existing schedules: old scenario1 -> scenario0, old scenario2 -> scenario1
-- Must do this in correct order to avoid conflicts
UPDATE public.schedules SET action = 'scenario0' WHERE action = 'scenario1';
UPDATE public.schedules SET action = 'scenario1' WHERE action = 'scenario2';
