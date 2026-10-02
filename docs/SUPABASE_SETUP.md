# Connecting Supabase to Tinkerers' Lab Portal

Follow these quick steps to connect your Supabase database:

---

### Step 1: Create a Project in Supabase
1. Sign in to [Supabase](https://supabase.com).
2. Click **New Project** and name it (e.g., `tinkerers-lab-ahduni`).
3. Set your database password and choose your nearest region (e.g., Mumbai `ap-south-1` or Singapore `ap-southeast-1`).

---

### Step 2: Run the Schema Migration
1. In your Supabase dashboard, open the **SQL Editor** from the left navigation.
2. Open the file `supabase/schema.sql` from this repository.
3. Paste the entire SQL script into the SQL Editor and click **Run** (Ctrl + Enter).
4. This will instantly create:
   - `profiles` table with role-based access control.
   - `projects` table with student AU verification & other applicant fields.
   - `inventory_items` pre-seeded with Tinkerers' Lab machinery, tools, and electronics.
   - `stock_balances` tracking available and reserved quantities.
   - `tool_borrows` for tracking equipment checkout and returns.
   - Row Level Security (RLS) policies and performance indexes.

---

### Step 3: Add Your Environment Variables
In your deployment environment (or local `.env.local`), set the following variables:

```bash
# From Supabase Dashboard -> Project Settings -> API
NEXT_PUBLIC_SUPABASE_URL="https://your-project-id.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-publishable-key"

# Secret Service Role Key (Keep private)
SUPABASE_SERVICE_ROLE_KEY="your-service-role-secret-key"
```

---

### Step 4: Add Your First Faculty / Staff Administrator
To promote a user to staff or admin:
1. Have the staff or faculty member sign in via the portal.
2. In the Supabase SQL Editor, run:

```sql
update public.profiles
set role = 'admin', is_active = true
where email = 'faculty.name@ahduni.edu.in';
```

---

### Automatic Fallback:
If Supabase environment variables are not yet entered, the portal continues to work smoothly using its built-in in-memory store so you can test all features without interruption.
