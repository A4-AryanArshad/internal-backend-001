-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  client_name VARCHAR(255) NOT NULL,
  client_email VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'review', 'completed')),
  payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
  stripe_payment_id VARCHAR(255),
  selected_service UUID REFERENCES services(id),
  custom_quote_amount DECIMAL(10, 2),
  deadline TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Services table
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Project briefings table
CREATE TABLE IF NOT EXISTS project_briefings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  overall_description TEXT,
  submitted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Briefing images table
CREATE TABLE IF NOT EXISTS briefing_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  notes TEXT,
  order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_projects_client_email ON projects(client_email);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_payment_status ON projects(payment_status);
CREATE INDEX IF NOT EXISTS idx_briefing_images_project_id ON briefing_images(project_id);
CREATE INDEX IF NOT EXISTS idx_project_briefings_project_id ON project_briefings(project_id);

-- Insert sample services
INSERT INTO services (name, description, price, is_active) VALUES
  ('Complete Brand Identity Package', 'Full logo design, color palette, typography, and brand guidelines document', 4500.00, true),
  ('Logo Design Only', 'Professional logo design with 2 revision rounds', 1200.00, true),
  ('Brand Guidelines Document', 'Complete brand guidelines documentation for existing identity', 2800.00, true)
ON CONFLICT DO NOTHING;




















