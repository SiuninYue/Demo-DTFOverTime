-- Restore proper auth-based RLS policies
-- This replaces the temporary MVP policies with proper authentication-based access control

-- Drop all existing MVP policies
drop policy if exists "Allow all employee operations for MVP" on employees;
drop policy if exists "Allow insert for all users" on employees;
drop policy if exists "Allow update for all users" on employees;
drop policy if exists "Allow select for all users" on employees;
drop policy if exists "Allow all schedule operations for MVP" on schedules;
drop policy if exists "Allow all time_records operations for MVP" on time_records;
drop policy if exists "Allow all mc_records operations for MVP" on mc_records;
drop policy if exists "Allow all salary operations for MVP" on monthly_salaries;

-- Employees table: users can only access their own record (id = auth.uid())
create policy "Users can access only their own employee record"
  on employees
  for all
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Schedules table: users can only access schedules linked to their employee id
create policy "Users can access only their own schedules"
  on schedules
  for all
  to authenticated
  using (employee_id = auth.uid())
  with check (employee_id = auth.uid());

-- Time records table: users can only access their own time records
create policy "Users can access only their own time records"
  on time_records
  for all
  to authenticated
  using (employee_id = auth.uid())
  with check (employee_id = auth.uid());

-- MC records table: users can only access their own MC records
create policy "Users can access only their own MC records"
  on mc_records
  for all
  to authenticated
  using (employee_id = auth.uid())
  with check (employee_id = auth.uid());

-- Monthly salaries table: users can only access their own salary records
create policy "Users can access only their own salary records"
  on monthly_salaries
  for all
  to authenticated
  using (employee_id = auth.uid())
  with check (employee_id = auth.uid());

-- Note: Anonymous access is no longer permitted.
-- Users must be authenticated to access any data.
