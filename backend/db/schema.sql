-- APAC Services Margin Analysis Database Schema

-- Users table for authentication and authorization
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    client_name VARCHAR(255) NOT NULL,
    client_code VARCHAR(50) UNIQUE,
    region VARCHAR(100),
    industry VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    project_name VARCHAR(255) NOT NULL,
    project_code VARCHAR(50) UNIQUE,
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Financial data table
CREATE TABLE IF NOT EXISTS financial_data (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    period_month INTEGER CHECK (period_month BETWEEN 1 AND 12),
    period_year INTEGER,
    revenue DECIMAL(15, 2),
    cost_of_goods_sold DECIMAL(15, 2),
    operating_expenses DECIMAL(15, 2),
    gross_margin DECIMAL(15, 2),
    gross_margin_percentage DECIMAL(5, 2),
    net_margin DECIMAL(15, 2),
    net_margin_percentage DECIMAL(5, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, period_month, period_year)
);

-- Staff roles table with hourly rates (OPEX - Altera staff)
CREATE TABLE IF NOT EXISTS staff_roles (
    id SERIAL PRIMARY KEY,
    role_name VARCHAR(255) UNIQUE NOT NULL,
    hourly_rate_usd DECIMAL(10, 2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    cost_category VARCHAR(50) DEFAULT 'OPEX',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Role rate history table to track rate changes over time
CREATE TABLE IF NOT EXISTS role_rate_history (
    id SERIAL PRIMARY KEY,
    role_id INTEGER REFERENCES staff_roles(id) ON DELETE CASCADE,
    old_rate DECIMAL(10, 2),
    new_rate DECIMAL(10, 2) NOT NULL,
    changed_by INTEGER REFERENCES users(id),
    change_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reason TEXT
);

-- Third party resources table (COGS - external contractors/vendors)
CREATE TABLE IF NOT EXISTS third_party_resources (
    id SERIAL PRIMARY KEY,
    resource_name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255),
    daily_rate DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    cost_category VARCHAR(50) DEFAULT 'COGS',
    resource_type VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Project resources table to track resource allocation to projects
CREATE TABLE IF NOT EXISTS project_resources (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    period_month INTEGER CHECK (period_month BETWEEN 1 AND 12),
    period_year INTEGER,

    -- Staff resource (OPEX)
    staff_role_id INTEGER REFERENCES staff_roles(id),
    staff_hours DECIMAL(10, 2),

    -- Third party resource (COGS)
    third_party_resource_id INTEGER REFERENCES third_party_resources(id),
    third_party_hours DECIMAL(10, 2),

    -- Calculated costs
    total_cost_usd DECIMAL(15, 2),
    cost_category VARCHAR(50),

    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Either staff_role_id OR third_party_resource_id must be set, but not both
    CONSTRAINT check_resource_type CHECK (
        (staff_role_id IS NOT NULL AND third_party_resource_id IS NULL) OR
        (staff_role_id IS NULL AND third_party_resource_id IS NOT NULL)
    )
);

-- Upload history table to track spreadsheet imports
CREATE TABLE IF NOT EXISTS upload_history (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    uploaded_by INTEGER REFERENCES users(id),
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    records_imported INTEGER,
    status VARCHAR(50),
    error_message TEXT
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_financial_data_project_id ON financial_data(project_id);
CREATE INDEX IF NOT EXISTS idx_financial_data_period ON financial_data(period_year, period_month);
CREATE INDEX IF NOT EXISTS idx_clients_region ON clients(region);
CREATE INDEX IF NOT EXISTS idx_staff_roles_active ON staff_roles(is_active);
CREATE INDEX IF NOT EXISTS idx_role_rate_history_role_id ON role_rate_history(role_id);
CREATE INDEX IF NOT EXISTS idx_third_party_resources_active ON third_party_resources(is_active);
CREATE INDEX IF NOT EXISTS idx_project_resources_project_id ON project_resources(project_id);
CREATE INDEX IF NOT EXISTS idx_project_resources_period ON project_resources(period_year, period_month);
CREATE INDEX IF NOT EXISTS idx_project_resources_staff_role ON project_resources(staff_role_id);
CREATE INDEX IF NOT EXISTS idx_project_resources_third_party ON project_resources(third_party_resource_id);

-- Create a view for comprehensive project financial summary
CREATE OR REPLACE VIEW project_financial_summary AS
SELECT
    p.id AS project_id,
    p.project_name,
    p.project_code,
    c.client_name,
    c.region,
    c.industry,
    fd.period_year,
    fd.period_month,
    fd.revenue,
    fd.cost_of_goods_sold,
    fd.operating_expenses,
    fd.gross_margin,
    fd.gross_margin_percentage,
    fd.net_margin,
    fd.net_margin_percentage
FROM projects p
JOIN clients c ON p.client_id = c.id
LEFT JOIN financial_data fd ON p.id = fd.project_id;

-- Insert default Altera staff roles (OPEX) with placeholder hourly rates
-- Note: These rates should be updated by system administrators
INSERT INTO staff_roles (role_name, hourly_rate_usd, cost_category, description) VALUES
    ('Project/Program Director', 150.00, 'OPEX', 'Senior leadership role overseeing project/program delivery'),
    ('Project Manager', 120.00, 'OPEX', 'Manages project execution and team coordination'),
    ('PMO Assistant', 75.00, 'OPEX', 'Supports PMO activities and project administration'),
    ('Implementation Consultant', 110.00, 'OPEX', 'Leads implementation activities and client engagement'),
    ('Solution Architect', 140.00, 'OPEX', 'Designs technical solutions and architecture'),
    ('System Engineer', 100.00, 'OPEX', 'Implements and maintains system infrastructure'),
    ('Training Manager', 115.00, 'OPEX', 'Manages training programs and curriculum development'),
    ('Trainer/Training Consultant', 95.00, 'OPEX', 'Delivers training and consulting services'),
    ('Platform Technology', 105.00, 'OPEX', 'Platform technology specialist'),
    ('Integration Consultant', 110.00, 'OPEX', 'Handles system integration and data migration'),
    ('Global Services PM', 125.00, 'OPEX', 'Global services project manager'),
    ('Global Services IC', 110.00, 'OPEX', 'Global services implementation consultant'),
    ('Global Services SE', 100.00, 'OPEX', 'Global services system engineer'),
    ('APAC Testing Consultant', 90.00, 'OPEX', 'Testing and quality assurance specialist'),
    ('APAC India Roles', 70.00, 'OPEX', 'India-based APAC team members'),
    ('Domestic non-APAC roles', 85.00, 'OPEX', 'Domestic staff outside APAC region')
ON CONFLICT (role_name) DO NOTHING;
