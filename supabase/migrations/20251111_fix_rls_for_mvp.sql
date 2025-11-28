-- Temporary MVP fix: Allow anonymous access to employees table
-- TODO: Replace with proper auth-based RLS when implementing user authentication

-- Drop existing restrictive policy
drop policy if exists "Users can only access their own employee record" on employees;

-- Allow all operations for MVP development (authenticated and anonymous)
create policy "Allow all employee operations for MVP"
  on employees
  for all
  using (true)
  with check (true);

-- Allow insert for all users
create policy "Allow insert for all users"
  on employees
  for insert
  to anon, authenticated
  with check (true);

-- Allow update for all users
create policy "Allow update for all users"
  on employees
  for update
  to anon, authenticated
  using (true)
  with check (true);

-- Allow select for all users
create policy "Allow select for all users"
  on employees
  for select
  to anon, authenticated
  using (true);

-- Similarly update policies for dependent tables
drop policy if exists "Users can only access their own schedules" on schedules;
create policy "Allow all schedule operations for MVP"
  on schedules
  for all
  using (true)
  with check (true);

drop policy if exists "Users can only access their own time records" on time_records;
create policy "Allow all time_records operations for MVP"
  on time_records
  for all
  using (true)
  with check (true);

drop policy if exists "Users can only access their own MC records" on mc_records;
create policy "Allow all mc_records operations for MVP"
  on mc_records
  for all
  using (true)
  with check (true);

drop policy if exists "Users can only access their own salary records" on monthly_salaries;
create policy "Allow all salary operations for MVP"
  on monthly_salaries
  for all
  using (true)
  with check (true);
