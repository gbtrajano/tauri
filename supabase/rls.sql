-- Enable Row Level Security on licenses table
alter table licenses enable row level security;

-- Policy: users can view own license (or service_role if user_id is null)
create policy "users can view own license"
on licenses for select
using (auth.uid() = user_id or user_id is null);

-- Policy: users can update own license
create policy "users can update own license"
on licenses for update
using (auth.uid() = user_id or user_id is null)
with check (auth.uid() = user_id or user_id is null);
