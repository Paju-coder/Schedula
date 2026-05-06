-- ============================================================
-- Schedula Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- USERS TABLE
-- Extended profile (Supabase auth.users handles authentication)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  slug TEXT NOT NULL UNIQUE,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AVAILABILITY TABLE
-- Weekly recurring schedule per user
CREATE TABLE IF NOT EXISTS public.availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL DEFAULT '09:00:00',
  end_time TIME NOT NULL DEFAULT '17:00:00',
  is_active BOOLEAN NOT NULL DEFAULT true,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  buffer_minutes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, day_of_week)
);

-- BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  guest_name TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  guest_phone TEXT,
  purpose TEXT,
  slot_date DATE NOT NULL,
  slot_time TIME NOT NULL,
  meet_link TEXT,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'rescheduled', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- BLOCKED DATES TABLE
CREATE TABLE IF NOT EXISTS public.blocked_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  blocked_date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, blocked_date)
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_dates ENABLE ROW LEVEL SECURITY;

-- Users: own profile + public slug lookup
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Allow public access via slug (for booking page)
CREATE POLICY "Anyone can view public profile by slug"
  ON public.users FOR SELECT
  USING (true);

-- Availability: public read, owner write
CREATE POLICY "Anyone can read availability"
  ON public.availability FOR SELECT
  USING (true);

CREATE POLICY "Owners can manage availability"
  ON public.availability FOR ALL
  USING (auth.uid() = user_id);

-- Bookings: owner can read all, anyone can insert
CREATE POLICY "Anyone can create bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Owners can view own bookings"
  ON public.bookings FOR SELECT
  USING (auth.uid() = host_id);

CREATE POLICY "Owners can update own bookings"
  ON public.bookings FOR UPDATE
  USING (auth.uid() = host_id);

-- Blocked dates: owner only
CREATE POLICY "Owners can manage blocked dates"
  ON public.blocked_dates FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can read blocked dates"
  ON public.blocked_dates FOR SELECT
  USING (true);

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_users_slug ON public.users(slug);
CREATE INDEX IF NOT EXISTS idx_bookings_host_date ON public.bookings(host_id, slot_date);
CREATE INDEX IF NOT EXISTS idx_availability_user ON public.availability(user_id);
CREATE INDEX IF NOT EXISTS idx_blocked_dates_user ON public.blocked_dates(user_id, blocked_date);

-- ============================================================
-- Done! Your Schedula database is ready.
-- ============================================================
