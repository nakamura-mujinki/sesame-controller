-- =============================================
-- Add days_of_week to schedules table
-- days_of_week: integer array [0-6] where 0=Sunday, 1=Monday, ..., 6=Saturday
-- Empty array or NULL means every day
-- =============================================

ALTER TABLE public.schedules
ADD COLUMN days_of_week INTEGER[] DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.schedules.days_of_week IS 'Days of week to execute: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat. NULL or empty = every day.';
