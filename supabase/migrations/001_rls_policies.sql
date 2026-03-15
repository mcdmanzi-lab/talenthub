-- ═══════════════════════════════════════════════════════════════
-- TalentHub — Row Level Security Policies
-- Run this once in your Supabase SQL editor
-- ═══════════════════════════════════════════════════════════════

-- ─── Helper: is the current user an admin? ───────────────────
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND email = current_setting('app.admin_email', true)
  );
$$ LANGUAGE sql SECURITY DEFINER;


-- ════════════════════════════════════════════════════════════════
-- PROFILES
-- ════════════════════════════════════════════════════════════════
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Anyone can read public worker profiles (needed for job board browsing)
CREATE POLICY "profiles_read_public"
  ON profiles FOR SELECT
  USING (true);

-- Users can only update their own profile
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can only insert their own profile (during signup)
CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Only admin can delete profiles
CREATE POLICY "profiles_delete_admin"
  ON profiles FOR DELETE
  USING (is_admin());


-- ════════════════════════════════════════════════════════════════
-- JOBS
-- ════════════════════════════════════════════════════════════════
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Anyone can read approved/featured jobs
CREATE POLICY "jobs_read_approved"
  ON jobs FOR SELECT
  USING (status = 'approved' OR employer_id = auth.uid() OR is_admin());

-- Only authenticated employers can insert jobs
CREATE POLICY "jobs_insert_employer"
  ON jobs FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth.uid() = employer_id
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'employer')
  );

-- Employers update only their own jobs; admin updates any
CREATE POLICY "jobs_update_own_or_admin"
  ON jobs FOR UPDATE
  USING (auth.uid() = employer_id OR is_admin())
  WITH CHECK (auth.uid() = employer_id OR is_admin());

-- Employers delete only their own jobs; admin deletes any
CREATE POLICY "jobs_delete_own_or_admin"
  ON jobs FOR DELETE
  USING (auth.uid() = employer_id OR is_admin());


-- ════════════════════════════════════════════════════════════════
-- APPLICATIONS
-- ════════════════════════════════════════════════════════════════
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Applicants see their own applications; employers see apps for their jobs
CREATE POLICY "applications_read"
  ON applications FOR SELECT
  USING (
    applicant_id = auth.uid()
    OR EXISTS (SELECT 1 FROM jobs WHERE jobs.id = applications.job_id AND jobs.employer_id = auth.uid())
    OR is_admin()
  );

-- Only the applicant themselves can insert an application
CREATE POLICY "applications_insert_own"
  ON applications FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth.uid() = applicant_id
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'worker')
  );

-- Employers can update status on their job applications; applicant can delete their own
CREATE POLICY "applications_update"
  ON applications FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM jobs WHERE jobs.id = applications.job_id AND jobs.employer_id = auth.uid())
    OR is_admin()
  );

CREATE POLICY "applications_delete"
  ON applications FOR DELETE
  USING (
    applicant_id = auth.uid()
    OR EXISTS (SELECT 1 FROM jobs WHERE jobs.id = applications.job_id AND jobs.employer_id = auth.uid())
    OR is_admin()
  );


-- ════════════════════════════════════════════════════════════════
-- MESSAGES
-- ════════════════════════════════════════════════════════════════
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Users only read messages they sent or received
CREATE POLICY "messages_read_own"
  ON messages FOR SELECT
  USING (sender_id = auth.uid() OR receiver_id = auth.uid() OR is_admin());

CREATE POLICY "messages_insert_own"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = sender_id);

-- Users can update read status on messages they received
CREATE POLICY "messages_update_receiver"
  ON messages FOR UPDATE
  USING (receiver_id = auth.uid() OR is_admin());

CREATE POLICY "messages_delete_admin"
  ON messages FOR DELETE
  USING (sender_id = auth.uid() OR is_admin());


-- ════════════════════════════════════════════════════════════════
-- NOTIFICATIONS
-- ════════════════════════════════════════════════════════════════
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_read_own"
  ON notifications FOR SELECT
  USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "notifications_insert_system"
  ON notifications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "notifications_update_own"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid() OR is_admin());


-- ════════════════════════════════════════════════════════════════
-- SAVED JOBS
-- ════════════════════════════════════════════════════════════════
ALTER TABLE saved_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saved_jobs_own"
  ON saved_jobs FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- ════════════════════════════════════════════════════════════════
-- JOB ALERTS
-- ════════════════════════════════════════════════════════════════
ALTER TABLE job_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "job_alerts_own"
  ON job_alerts FOR ALL
  USING (user_id = auth.uid() OR is_admin())
  WITH CHECK (user_id = auth.uid());


-- ════════════════════════════════════════════════════════════════
-- JOB PAYMENTS
-- ════════════════════════════════════════════════════════════════
ALTER TABLE job_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "job_payments_read"
  ON job_payments FOR SELECT
  USING (employer_id = auth.uid() OR is_admin());

CREATE POLICY "job_payments_insert_own"
  ON job_payments FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = employer_id);

CREATE POLICY "job_payments_update_admin"
  ON job_payments FOR UPDATE
  USING (is_admin());


-- ════════════════════════════════════════════════════════════════
-- FEATURED REQUESTS
-- ════════════════════════════════════════════════════════════════
ALTER TABLE featured_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "featured_requests_read"
  ON featured_requests FOR SELECT
  USING (employer_id = auth.uid() OR is_admin());

CREATE POLICY "featured_requests_insert_own"
  ON featured_requests FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = employer_id);

CREATE POLICY "featured_requests_update_admin"
  ON featured_requests FOR UPDATE
  USING (is_admin());


-- ════════════════════════════════════════════════════════════════
-- COMPANIES
-- ════════════════════════════════════════════════════════════════
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "companies_read_public"
  ON companies FOR SELECT
  USING (true);

CREATE POLICY "companies_write_own"
  ON companies FOR ALL
  USING (employer_id = auth.uid() OR is_admin())
  WITH CHECK (employer_id = auth.uid());


-- ════════════════════════════════════════════════════════════════
-- COMPANY REVIEWS
-- ════════════════════════════════════════════════════════════════
ALTER TABLE company_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reviews_read_public"
  ON company_reviews FOR SELECT
  USING (true);

CREATE POLICY "reviews_insert_worker"
  ON company_reviews FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'worker')
  );

CREATE POLICY "reviews_delete_own_or_admin"
  ON company_reviews FOR DELETE
  USING (reviewer_id = auth.uid() OR is_admin());


-- ════════════════════════════════════════════════════════════════
-- PORTFOLIO & EXPERIENCE
-- ════════════════════════════════════════════════════════════════
ALTER TABLE portfolio ENABLE ROW LEVEL SECURITY;

CREATE POLICY "portfolio_read_public"  ON portfolio FOR SELECT USING (true);
CREATE POLICY "portfolio_write_own"    ON portfolio FOR ALL   USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

ALTER TABLE experience ENABLE ROW LEVEL SECURITY;

CREATE POLICY "experience_read_public" ON experience FOR SELECT USING (true);
CREATE POLICY "experience_write_own"   ON experience FOR ALL   USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());


-- ════════════════════════════════════════════════════════════════
-- RECOVERY REQUESTS
-- ════════════════════════════════════════════════════════════════
ALTER TABLE recovery_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recovery_admin_only"
  ON recovery_requests FOR ALL
  USING (is_admin());
