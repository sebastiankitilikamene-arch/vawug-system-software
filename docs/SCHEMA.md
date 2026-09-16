# VAWUG Sacco Database Schema

## Overview

PostgreSQL database schema for complete loan management system.

## Core Tables

### users (Staff/Employees)

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  role_id UUID REFERENCES roles(id),
  department VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### members (Sacco Members)

```sql
CREATE TABLE members (
  id UUID PRIMARY KEY,
  member_number VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  date_of_birth DATE,
  national_id VARCHAR(50) UNIQUE NOT NULL,
  gender ENUM('M', 'F', 'Other'),
  marital_status VARCHAR(20),
  employment_status VARCHAR(50),
  employer_name VARCHAR(255),
  salary DECIMAL(15,2),
  address_street VARCHAR(255),
  address_city VARCHAR(100),
  address_state VARCHAR(100),
  address_postal_code VARCHAR(20),
  country VARCHAR(100),
  kyc_verified BOOLEAN DEFAULT false,
  kyc_verified_at TIMESTAMP,
  kyc_verified_by UUID REFERENCES users(id),
  status ENUM('active', 'suspended', 'inactive') DEFAULT 'active',
  join_date DATE NOT NULL,
  profile_photo_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### loans (Loan Accounts)

```sql
CREATE TABLE loans (
  id UUID PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES members(id),
  loan_number VARCHAR(50) UNIQUE NOT NULL,
  loan_type ENUM('personal', 'business', 'emergency', 'education') NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  approved_amount DECIMAL(15,2),
  disbursed_amount DECIMAL(15,2) DEFAULT 0,
  outstanding_balance DECIMAL(15,2),
  currency VARCHAR(3) DEFAULT 'KES',
  
  -- Interest & Terms
  interest_rate DECIMAL(5,2) NOT NULL,
  interest_type ENUM('simple', 'compound') DEFAULT 'simple',
  tenure_months INT NOT NULL,
  monthly_payment DECIMAL(15,2),
  
  -- Dates
  application_date DATE NOT NULL,
  approval_date DATE,
  disbursement_date DATE,
  maturity_date DATE,
  next_payment_date DATE,
  
  -- Status & Workflow
  status ENUM('draft', 'submitted', 'under_review', 'approved', 'rejected', 'active', 'completed', 'defaulted') DEFAULT 'draft',
  applied_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  
  -- Insurance & Collateral
  insurance_required BOOLEAN DEFAULT false,
  insurance_amount DECIMAL(15,2),
  collateral_value DECIMAL(15,2),
  collateral_description TEXT,
  
  -- Flags
  is_defaulted BOOLEAN DEFAULT false,
  default_date DATE,
  penalty_accumulated DECIMAL(15,2) DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### repayments (Payment Schedule & Transactions)

```sql
CREATE TABLE repayments (
  id UUID PRIMARY KEY,
  loan_id UUID NOT NULL REFERENCES loans(id),
  scheduled_date DATE NOT NULL,
  due_amount DECIMAL(15,2) NOT NULL,
  paid_amount DECIMAL(15,2) DEFAULT 0,
  principal_paid DECIMAL(15,2) DEFAULT 0,
  interest_paid DECIMAL(15,2) DEFAULT 0,
  penalty_paid DECIMAL(15,2) DEFAULT 0,
  
  status ENUM('pending', 'partial', 'paid', 'overdue', 'waived') DEFAULT 'pending',
  payment_date DATE,
  payment_method VARCHAR(50), -- 'cash', 'bank_transfer', 'mobile_money'
  payment_reference VARCHAR(100),
  
  days_overdue INT DEFAULT 0,
  penalty_applied DECIMAL(15,2) DEFAULT 0,
  penalty_rate DECIMAL(5,2) DEFAULT 0, -- As percentage
  
  processed_by UUID REFERENCES users(id),
  notes TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### savings (Member Savings Accounts)

```sql
CREATE TABLE savings (
  id UUID PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES members(id),
  account_number VARCHAR(50) UNIQUE NOT NULL,
  account_type ENUM('share', 'savings', 'emergency') DEFAULT 'savings',
  balance DECIMAL(15,2) DEFAULT 0,
  interest_rate DECIMAL(5,2) DEFAULT 0,
  accumulated_interest DECIMAL(15,2) DEFAULT 0,
  status ENUM('active', 'frozen', 'closed') DEFAULT 'active',
  opened_date DATE NOT NULL,
  closed_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### transactions (Audit Trail)

```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY,
  transaction_type VARCHAR(50) NOT NULL, -- 'deposit', 'withdrawal', 'transfer', 'interest_accrual'
  member_id UUID REFERENCES members(id),
  from_account_id UUID,
  to_account_id UUID,
  amount DECIMAL(15,2) NOT NULL,
  description TEXT,
  status ENUM('pending', 'completed', 'failed', 'reversed') DEFAULT 'pending',
  reference_number VARCHAR(100) UNIQUE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);
```

### roles & permissions

```sql
CREATE TABLE roles (
  id UUID PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE permissions (
  id UUID PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE role_permissions (
  id UUID PRIMARY KEY,
  role_id UUID NOT NULL REFERENCES roles(id),
  permission_id UUID NOT NULL REFERENCES permissions(id),
  UNIQUE(role_id, permission_id)
);
```

### audit_logs (Compliance & Tracking)

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Indexes for Performance

```sql
CREATE INDEX idx_members_national_id ON members(national_id);
CREATE INDEX idx_members_email ON members(email);
CREATE INDEX idx_members_status ON members(status);

CREATE INDEX idx_loans_member_id ON loans(member_id);
CREATE INDEX idx_loans_status ON loans(status);
CREATE INDEX idx_loans_application_date ON loans(application_date);

CREATE INDEX idx_repayments_loan_id ON repayments(loan_id);
CREATE INDEX idx_repayments_status ON repayments(status);
CREATE INDEX idx_repayments_scheduled_date ON repayments(scheduled_date);

CREATE INDEX idx_transactions_member_id ON transactions(member_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

## Views for Reporting

```sql
CREATE VIEW member_loan_summary AS
SELECT 
  m.id,
  m.member_number,
  m.first_name || ' ' || m.last_name as member_name,
  COUNT(l.id) as total_loans,
  COUNT(CASE WHEN l.status = 'active' THEN 1 END) as active_loans,
  COALESCE(SUM(CASE WHEN l.status = 'active' THEN l.outstanding_balance ELSE 0 END), 0) as total_outstanding,
  COUNT(CASE WHEN l.status = 'defaulted' THEN 1 END) as defaulted_loans
FROM members m
LEFT JOIN loans l ON m.id = l.member_id
GROUP BY m.id, m.member_number, m.first_name, m.last_name;
```
