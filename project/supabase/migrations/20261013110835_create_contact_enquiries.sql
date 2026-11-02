/*
# Create contact_enquiries table

1. New Tables
- `contact_enquiries`
- `id` (uuid, primary key)
- `name` (text, visitor name)
- `phone` (text, UK phone number)
- `email` (text, visitor email)
- `postcode` (text, property postcode)
- `service` (text, requested service)
- `model` (text, equipment make/model)
- `symptoms` (text, description of the problem)
- `access` (text, access / preferred time notes)
- `contact_permission` (boolean, visitor confirmed contact permission)
- `status` (text, enquiry status, defaults to 'draft')
- `created_at` (timestamptz, submission time)

2. Security
- Enable RLS on `contact_enquiries`.
- This is a no-auth public contact form (single-tenant), so allow anon + authenticated to INSERT only.
- No SELECT/UPDATE/DELETE for anon — enquiries are private to the business owner.
- INSERT is open so the public form can submit; the WITH CHECK enforces that contact_permission must be true.

3. Important notes
- The contact form is the honest email-draft workflow with an optional Supabase persistence layer.
- Enquiries are stored for the business owner to review; visitors cannot read other submissions.
- Length limits match the validated form fields.
*/

CREATE TABLE IF NOT EXISTS contact_enquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 100),
  phone text NOT NULL,
  email text NOT NULL CHECK (char_length(email) <= 254),
  postcode text NOT NULL,
  service text NOT NULL CHECK (char_length(service) <= 100),
  model text CHECK (char_length(model) <= 160),
  symptoms text NOT NULL CHECK (char_length(symptoms) BETWEEN 10 AND 1500),
  access text CHECK (char_length(access) <= 200),
  contact_permission boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE contact_enquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_enquiries" ON contact_enquiries;
CREATE POLICY "anon_insert_enquiries" ON contact_enquiries
  FOR INSERT TO anon, authenticated
  WITH CHECK (contact_permission = true);
