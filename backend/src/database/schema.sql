CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    email VARCHAR(180) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(40) NOT NULL CHECK (role IN ('BORROWER', 'LOAN_OFFICER', 'COLLECTION_AGENT', 'ADMIN')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS borrowers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    full_name VARCHAR(180) NOT NULL,
    normalized_name VARCHAR(180),
    name_phonetic_key VARCHAR(180),

    nid_number VARCHAR(40),
    phone VARCHAR(30),
    dob DATE,

    father_name VARCHAR(180),
    mother_name VARCHAR(180),
    address_text TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_borrowers_nid ON borrowers(nid_number);
CREATE INDEX IF NOT EXISTS idx_borrowers_phone ON borrowers(phone);
CREATE INDEX IF NOT EXISTS idx_borrowers_name_key ON borrowers(name_phonetic_key);

CREATE TABLE IF NOT EXISTS loan_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    borrower_id UUID NOT NULL REFERENCES borrowers(id) ON DELETE CASCADE,

    requested_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    business_type VARCHAR(120),
    branch_id VARCHAR(80),

    device_fingerprint TEXT,
    device_hash TEXT,
    ip_address INET,
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),

    status VARCHAR(50) NOT NULL DEFAULT 'SUBMITTED'
        CHECK (status IN (
            'SUBMITTED',
            'OCR_PENDING',
            'FRAUD_CHECK_PENDING',
            'FRAUD_LOW',
            'MANUAL_REVIEW',
            'ENHANCED_VERIFICATION',
            'APPROVED',
            'REJECTED'
        )),

    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_applications_borrower ON loan_applications(borrower_id);
CREATE INDEX IF NOT EXISTS idx_applications_device_hash ON loan_applications(device_hash);
CREATE INDEX IF NOT EXISTS idx_applications_ip ON loan_applications(ip_address);
CREATE INDEX IF NOT EXISTS idx_applications_status ON loan_applications(status);

CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    application_id UUID NOT NULL REFERENCES loan_applications(id) ON DELETE CASCADE,

    document_type VARCHAR(50) NOT NULL
        CHECK (document_type IN ('NID_FRONT', 'NID_BACK', 'SELFIE', 'BUSINESS_DOC', 'BANK_STATEMENT')),

    original_name TEXT NOT NULL,
    stored_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    mime_type VARCHAR(100),
    file_size INTEGER,

    ocr_text TEXT,
    ocr_data JSONB DEFAULT '{}'::jsonb,

    metadata_status VARCHAR(50) DEFAULT 'NOT_CHECKED'
        CHECK (metadata_status IN ('NOT_CHECKED', 'PRESENT', 'MISSING', 'SUSPICIOUS')),

    tampering_score INTEGER DEFAULT 0 CHECK (tampering_score BETWEEN 0 AND 100),
    tampering_reasons JSONB DEFAULT '[]'::jsonb,

    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_documents_application ON documents(application_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(document_type);

CREATE TABLE IF NOT EXISTS fraud_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    application_id UUID NOT NULL UNIQUE REFERENCES loan_applications(id) ON DELETE CASCADE,

    fraud_score INTEGER NOT NULL CHECK (fraud_score BETWEEN 0 AND 100),
    fraud_level VARCHAR(20) NOT NULL CHECK (fraud_level IN ('LOW', 'MEDIUM', 'HIGH')),

    review_status VARCHAR(40) NOT NULL DEFAULT 'PENDING'
        CHECK (review_status IN (
            'PENDING',
            'AUTO_PASSED',
            'MANUAL_REVIEW',
            'ENHANCED_VERIFICATION',
            'CLEARED',
            'REJECTED'
        )),

    recommended_action VARCHAR(80) NOT NULL,

    reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
    signals JSONB NOT NULL DEFAULT '{}'::jsonb,

    checked_by UUID REFERENCES users(id),
    manual_decision VARCHAR(40)
        CHECK (manual_decision IN ('CLEARED', 'REJECTED', 'REQUEST_MORE_DOCUMENTS', 'FIELD_VERIFICATION') OR manual_decision IS NULL),

    manual_note TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fraud_checks_level ON fraud_checks(fraud_level);
CREATE INDEX IF NOT EXISTS idx_fraud_checks_review_status ON fraud_checks(review_status);

CREATE TABLE IF NOT EXISTS fraud_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    application_id UUID REFERENCES loan_applications(id) ON DELETE CASCADE,
    action VARCHAR(120) NOT NULL,
    actor_id UUID REFERENCES users(id),
    details JSONB DEFAULT '{}'::jsonb,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fraud_logs_application ON fraud_audit_logs(application_id);