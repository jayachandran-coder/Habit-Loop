-- Add unique constraint on user_id for upsert support
ALTER TABLE public.push_subscriptions ADD CONSTRAINT push_subscriptions_user_id_key UNIQUE (user_id);

-- Enable pg_cron and pg_net for scheduled notifications
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
