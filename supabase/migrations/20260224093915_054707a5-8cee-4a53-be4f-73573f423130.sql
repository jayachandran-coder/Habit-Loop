ALTER TABLE public.push_subscriptions ADD COLUMN preferred_hour integer NOT NULL DEFAULT 20;
-- 20 = 8 PM UTC, preserving existing behavior