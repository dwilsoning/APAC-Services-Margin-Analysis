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
