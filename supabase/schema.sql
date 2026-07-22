-- ================================================
-- SCHOOL SPORTS EVENT MANAGER — DATABASE SCHEMA
-- Run this in Supabase SQL Editor
-- ================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ================================================
-- ENUMS
-- ================================================
CREATE TYPE student_category AS ENUM ('Sub Junior', 'Junior', 'Senior');
CREATE TYPE event_type AS ENUM ('individual', 'group');
CREATE TYPE event_status AS ENUM ('open', 'locked');

-- ================================================
-- TABLES
-- ================================================

-- Groups / Houses
CREATE TABLE groups (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL UNIQUE,
  color      TEXT,                          -- hex color e.g. '#e74c3c'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Students
CREATE TABLE students (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id  UUID REFERENCES schools(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  class      TEXT NOT NULL,
  category   student_category NOT NULL,
  group_id   UUID REFERENCES groups(id) ON DELETE SET NULL,
  photo_url  TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Events
CREATE TABLE events (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  type             event_type NOT NULL,
  points_1st       INTEGER NOT NULL DEFAULT 5,
  points_2nd       INTEGER NOT NULL DEFAULT 3,
  points_3rd       INTEGER NOT NULL DEFAULT 1,
  point_multiplier FLOAT NOT NULL DEFAULT 1.0,
  status           event_status NOT NULL DEFAULT 'open',
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Participants (who can compete in an event)
CREATE TABLE participants (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id   UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  group_id   UUID REFERENCES groups(id) ON DELETE CASCADE,
  -- Only one of student_id or group_id should be set
  CONSTRAINT participants_student_unique UNIQUE (event_id, student_id),
  CONSTRAINT participants_group_unique   UNIQUE (event_id, group_id),
  CONSTRAINT participants_one_type CHECK (
    (student_id IS NOT NULL AND group_id IS NULL)
    OR (student_id IS NULL AND group_id IS NOT NULL)
  )
);

-- Results
CREATE TABLE results (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id     UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  rank         INTEGER NOT NULL CHECK (rank IN (1, 2, 3)),
  student_id   UUID REFERENCES students(id) ON DELETE CASCADE,
  group_id     UUID REFERENCES groups(id) ON DELETE CASCADE,
  points_earned FLOAT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT results_rank_unique UNIQUE (event_id, rank),
  CONSTRAINT results_one_type CHECK (
    (student_id IS NOT NULL AND group_id IS NULL)
    OR (student_id IS NULL AND group_id IS NOT NULL)
  )
);

-- ================================================
-- INDEXES
-- ================================================
CREATE INDEX idx_students_group_id   ON students(group_id);
CREATE INDEX idx_students_category   ON students(category);
CREATE INDEX idx_participants_event  ON participants(event_id);
CREATE INDEX idx_participants_student ON participants(student_id);
CREATE INDEX idx_participants_group  ON participants(group_id);
CREATE INDEX idx_results_event       ON results(event_id);
CREATE INDEX idx_results_student     ON results(student_id);
CREATE INDEX idx_results_group       ON results(group_id);

-- ================================================
-- ROW LEVEL SECURITY
-- ================================================

ALTER TABLE groups       ENABLE ROW LEVEL SECURITY;
ALTER TABLE students     ENABLE ROW LEVEL SECURITY;
ALTER TABLE events       ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE results      ENABLE ROW LEVEL SECURITY;

-- Helper: check if event is open and belongs to user's school context
CREATE OR REPLACE FUNCTION is_event_open(p_event_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  -- If super admin, bypass school checks and check if open
  IF public.is_super_admin() THEN
    RETURN EXISTS (
      SELECT 1 FROM events WHERE id = p_event_id AND status = 'open'
    );
  END IF;

  -- Otherwise, verify event is open and belongs to the current user's school
  RETURN EXISTS (
    SELECT 1 FROM events 
    WHERE id = p_event_id 
      AND status = 'open' 
      AND school_id = public.current_user_school_id()
  );
END;
$$;

-- GROUPS policies
CREATE POLICY "Authenticated users can read groups"
  ON groups FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert groups"
  ON groups FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update groups"
  ON groups FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete groups"
  ON groups FOR DELETE TO authenticated USING (true);

-- STUDENTS policies
CREATE POLICY "Authenticated users can read students"
  ON students FOR SELECT TO authenticated USING (true);
CREATE POLICY "School admins can insert students for their school"
  ON students FOR INSERT TO authenticated
  WITH CHECK (
    (
      (auth.jwt() -> 'user_metadata' ->> 'role') = 'school_admin'
      AND school_id::text = (auth.jwt() -> 'user_metadata' ->> 'school_id')
    )
    OR
    (
      (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
    )
  );
CREATE POLICY "Authenticated users can update students"
  ON students FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete students"
  ON students FOR DELETE TO authenticated USING (true);

-- EVENTS policies
CREATE POLICY "Authenticated users can read events"
  ON events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert events"
  ON events FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update events"
  ON events FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete events"
  ON events FOR DELETE TO authenticated USING (true);

-- PARTICIPANTS policies
CREATE POLICY "Authenticated users can read participants"
  ON participants FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert participants"
  ON participants FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can delete participants"
  ON participants FOR DELETE TO authenticated USING (true);

-- RESULTS policies (insert/update blocked when event is locked)
CREATE POLICY "Authenticated users can read results"
  ON results FOR SELECT TO authenticated USING (true);
CREATE POLICY "Can insert results only when event is open"
  ON results FOR INSERT TO authenticated
  WITH CHECK (is_event_open(event_id));
CREATE POLICY "Can update results only when event is open"
  ON results FOR UPDATE TO authenticated
  USING (is_event_open(event_id))
  WITH CHECK (is_event_open(event_id));
CREATE POLICY "Authenticated users can delete results"
  ON results FOR DELETE TO authenticated USING (true);

-- ================================================
-- REALTIME (run after enabling realtime on project)
-- ================================================
-- In Supabase Dashboard → Database → Replication
-- Enable replication for: results, participants

-- ================================================
-- SAMPLE DATA (optional — remove before production)
-- ================================================

-- INSERT INTO groups (name, color) VALUES
--   ('Red House',   '#ef4444'),
--   ('Blue House',  '#3b82f6'),
--   ('Green House', '#22c55e'),
--   ('Gold House',  '#f59e0b');
