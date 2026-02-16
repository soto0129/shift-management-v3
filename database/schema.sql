-- Supabaseで実行するSQL
-- Supabase → SQL Editor で実行してください

-- ============================================
-- 1. staffテーブル（スタッフ情報）
-- ============================================
CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  hourly_wage INTEGER NOT NULL CHECK (hourly_wage > 0),
  max_hours_per_week INTEGER DEFAULT 40 CHECK (max_hours_per_week > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staff_user ON staff(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_name ON staff(name);

-- ============================================
-- 2. shiftsテーブル（シフトデータ）
-- ============================================
CREATE TABLE IF NOT EXISTS shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_confirmed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT check_shift_time CHECK (end_time > start_time),
  CONSTRAINT unique_staff_date_time UNIQUE (staff_id, date, start_time)
);

CREATE INDEX IF NOT EXISTS idx_shifts_user ON shifts(user_id);
CREATE INDEX IF NOT EXISTS idx_shifts_date ON shifts(date);
CREATE INDEX IF NOT EXISTS idx_shifts_staff ON shifts(staff_id);

-- ============================================
-- 3. availabilityテーブル（勤務可能時間）
-- ============================================
CREATE TABLE IF NOT EXISTS availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  priority INTEGER NOT NULL DEFAULT 2 CHECK (priority >= 1 AND priority <= 3),
  CONSTRAINT check_time_range CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_availability_user ON availability(user_id);
CREATE INDEX IF NOT EXISTS idx_availability_staff ON availability(staff_id);

-- ============================================
-- 4. RLS（Row Level Security）設定
-- ============================================
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;

-- staffテーブルのポリシー
DROP POLICY IF EXISTS "Users can view own staff" ON staff;
CREATE POLICY "Users can view own staff" ON staff FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own staff" ON staff;
CREATE POLICY "Users can insert own staff" ON staff FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own staff" ON staff;
CREATE POLICY "Users can update own staff" ON staff FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own staff" ON staff;
CREATE POLICY "Users can delete own staff" ON staff FOR DELETE USING (auth.uid() = user_id);

-- shiftsテーブルのポリシー
DROP POLICY IF EXISTS "Users can view own shifts" ON shifts;
CREATE POLICY "Users can view own shifts" ON shifts FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own shifts" ON shifts;
CREATE POLICY "Users can insert own shifts" ON shifts FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own shifts" ON shifts;
CREATE POLICY "Users can update own shifts" ON shifts FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own shifts" ON shifts;
CREATE POLICY "Users can delete own shifts" ON shifts FOR DELETE USING (auth.uid() = user_id);

-- availabilityテーブルのポリシー
DROP POLICY IF EXISTS "Users can view own availability" ON availability;
CREATE POLICY "Users can view own availability" ON availability FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own availability" ON availability;
CREATE POLICY "Users can insert own availability" ON availability FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own availability" ON availability;
CREATE POLICY "Users can update own availability" ON availability FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own availability" ON availability;
CREATE POLICY "Users can delete own availability" ON availability FOR DELETE USING (auth.uid() = user_id);

SELECT 'セットアップ完了' AS message;
