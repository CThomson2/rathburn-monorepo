# Understanding Supabase Authentication and Authorization

## Users vs. Roles vs. Policies

### 1. **Users**

Users in Supabase are individual accounts with:

- Unique identifiers
- Authentication credentials (email/password, OAuth tokens, etc.)
- Profile information
- A JWT token containing claims about the user

### 2. Roles

In Supabase, there are two key concepts related to roles:

1. **PostgreSQL Roles** (Database-level)

- These are actual PostgreSQL database roles
- The default ones are:

  - `anon`: Used for unauthenticated requests
  - `authenticated`: Used for authenticated requests
  - `service_role`: Has bypassing privileges (admin-like)

2. **Application Roles** (Application-level)

- Dedicated business roles/groups (e.g supervisor, manager, engineer)
- They don't exist natively in Supabase - you need to create them yourself
- Typically stored in a custom table like `user_roles`

```sql
-- Example custom roles table
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- 'admin', 'manager', 'engineer', etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX user_roles_user_id_idx ON user_roles(user_id);
CREATE UNIQUE INDEX user_roles_user_id_role_idx ON user_roles(user_id, role);
```

### 3. Policies

Policies are rules that control access to your database tables:

- They are written as SQL conditions
- They determine whether a given database role can perform operations (`SELECT`, `INSERT`, `UPDATE`, `DELETE`)
- They can reference the current user via `auth.uid()`
- They are specific to Supabase's implementation of PostgreSQL Row Level Security (RLS)

```sql
-- Example policy: Users can only see their own data
CREATE POLICY "Users can view their own profiles"
ON profiles
FOR SELECT
USING (auth.uid() = user_id);
```

### 4. Authenticated vs. Anonymous

Default PostgreSQL roles, not application roles:

- **Anonymous** (`anon`): This role is used whenever someone accesses your Supabase project without being logged in. It typically has very limited access.
- **Authenticated** (`authenticated`): This role is used whenever someone is logged in. The JWT token identifies who they are.

These are the foundation of Supabase's auth system. You don't "add more roles" to this level - instead, you:

a. Create policies that determine what these roles can do
b. Create your own application-level roles system in your database

Policies in Supabase are PostgreSQL RLS (Row Level Security) policies:

a. First, you enable RLS on a table

```sql
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;
```

b. Then you create policies that define access rules:

```sql
CREATE POLICY "policy_name"
ON your_table
FOR [SELECT|INSERT|UPDATE|DELETE]
[TO authenticated|anon|specific_role]
USING (condition_expression)
[WITH CHECK (condition_expression)];
```

c. The `USING` clause filters which rows can be accessed
d. The optional `WITH CHECK` clause determines which data can be inserted/updated

Example policy that allows users to read data from their department:

```sql
CREATE POLICY "Read department data"
ON department_records
FOR SELECT
TO authenticated
USING (
  department_id IN (
    SELECT department_id FROM user_departments
    WHERE user_id = auth.uid()
  )
);
```

---

### 6. RBAC vs. RLS - They Work Together

RBAC (Role-Based Access Control) and RLS (Row-Level Security) are complementary:

- **RBAC**: Determines what actions a user can perform based on their role
- **RLS**: Determines which data rows a user can access

In Supabase, you implement both:

- **RLS** with Policies: Native to Supabase, controls data access
- **RBAC**: Implemented through custom tables and application logic

Here's how they work together:

```sql
-- 1. User roles table (RBAC)
CREATE TABLE user_roles (
  user_id UUID REFERENCES auth.users(id),
  role TEXT,
  PRIMARY KEY (user_id, role)
);

-- 2. RLS policy that checks for a specific role
CREATE POLICY "Only admins can delete records"
ON important_records
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);
```

### 7. Public SaaS vs. Internal Application

The architecture differs significantly between these use cases:

#### 1. Public SaaS with Thousands of Users

- Simpler permission model (often just "user" role)
- RLS policies focus on data isolation between users
- Example:

```sql
CREATE POLICY "Users can only see their own data"
ON user_data
FOR SELECT
USING (user_id = auth.uid());
```

#### 2. Internal App with Colleagues

- More complex role system (specific permissions per user)
- RLS policies that factor in department, role, and permissions
- Often uses junction tables to define permissions

Example setup:

```sql
-- Departments table
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL
);

-- User departments (many-to-many)
CREATE TABLE user_departments (
  user_id UUID REFERENCES auth.users(id),
  department_id UUID REFERENCES departments(id),
  PRIMARY KEY (user_id, department_id)
);

-- Permissions table
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL, -- 'inventory.read', 'inventory.write', etc.
  description TEXT
);

-- Role permissions
CREATE TABLE role_permissions (
  role TEXT NOT NULL,
  permission_id UUID REFERENCES permissions(id),
  PRIMARY KEY (role, permission_id)
);

-- RLS policy using both role and department
CREATE POLICY "Department inventory access"
ON inventory_items
FOR SELECT
USING (
  -- Can see inventory if in same department AND has permission
  EXISTS (
    SELECT 1 FROM user_departments ud
    JOIN user_roles ur ON ud.user_id = ur.user_id
    JOIN role_permissions rp ON ur.role = rp.role
    JOIN permissions p ON rp.permission_id = p.id
    WHERE ud.user_id = auth.uid()
    AND ud.department_id = inventory_items.department_id
    AND p.code = 'inventory.read'
  )
  -- OR is an admin
  OR EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);
```

---

## Best Practices for Your Internal App

### 1. Create custom application roles

Store them in a user_roles table
Examples: 'admin', 'inventory_manager', 'production_supervisor'

### 2. Implement a permissions system

Define granular permissions ('inventory.read', 'inventory.update', etc.)
Map roles to permissions

### 3. Use departments for organizational structure

Assign users to departments
Some policies can be department-specific

### 4. Create RLS policies that check:

User ID (for personal data)
Department membership (for department data)
Roles/permissions (for functional access)

### 5. Use SQL functions for complex operations

Encapsulate business logic in functions
Use `SECURITY DEFINER` for operations that need elevated privileges

Here's a simplified example of how it all works together:

```sql
-- When a user tries to update inventory status:

-- 1. Their JWT identifies them (auth.uid())
-- 2. RLS policy checks if they have 'inventory.update' permission
-- 3. If allowed, the update proceeds
-- 4. The update is audited with user ID for accountability
```

> This combination of PostgreSQL roles (anonymous/authenticated), application roles (admin/manager), permissions, and RLS policies gives you a flexible and secure system for your colleagues to interact with your inventory management application.

---

