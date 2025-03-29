-- Create a profiles table that links to auth.users
-- The 'references auth.users' creates a foreign key constraint
-- ensuring each profile must belong to a valid user
create table
    public.profiles (
        id uuid not null references auth.users on delete cascade, -- Links to Supabase Auth user ID
        full_name text,
        email text unique,                                        -- Ensures no duplicate emails
        avatar_url text,
        primary key(id)                                          -- Uses auth user ID as primary key
    );

-- Enable Row Level Security (RLS)
-- This means NO access is allowed by default
-- We must explicitly grant permissions through policies
alter table profiles enable row level security;

-- Policy 1: Allow anyone to view profiles
-- This is useful for public profile pages or user directories
-- 'true' means this policy always passes
create policy "Public profiles are viewable by everyone." on profiles for
  select using (true);

-- Policy 2: Users can only create their own profile
-- auth.uid() is a Supabase function that returns the current user's ID
-- This ensures users can't create profiles for other users
create policy "Users can insert their own profile" on profiles for
    insert
    with check (auth.uid() = id);

-- Policy 3: Users can only update their own profile
-- Similar to insert policy, but for update operations
create policy "Users can update their own profile" on profiles for
    using (auth.uid() = id);

-- Trigger function: Automatically create profile on user signup
-- This function runs with elevated privileges (security definer)
-- It creates a profile entry whenever a new auth.users record is created
create function public.handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url, email)
  values (
    new.id,                                              -- Use the new auth user's ID
    new.raw_user_meta_data->>'full_name',               -- Extract from metadata JSON
    new.raw_user_meta_data->>'avatar_url',              -- Extract from metadata JSON
    new.raw_user_meta_data->>'email'                    -- Extract from metadata JSON
    );
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger: Links the function to auth.users table
-- 'after insert' means it runs after a new user is created
-- 'for each row' means it runs for every new user
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_new_user(); 