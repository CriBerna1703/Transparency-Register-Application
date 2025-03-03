-- Main table for lobbyist information
CREATE TABLE IF NOT EXISTS lobbyist_profile (
    lobbyist_id VARCHAR(50) PRIMARY KEY,         -- Unique ID of the lobbyist
    organization_name VARCHAR(255),              -- Name of the organization
    registration_number VARCHAR(50),             -- Registration number
    registration_status VARCHAR(50),             -- Registration status
    registration_date DATETIME,                  -- Registration date
    last_update_date DATETIME,                   -- Last update date
    next_update_date DATETIME,                   -- Next update date
    acronym VARCHAR(255),                        -- Organization acronym
    entity_form VARCHAR(255),                    -- Entity form (e.g., corporation)
    website VARCHAR(255),                        -- Website
    head_office_address TEXT,                    -- Head office address
    head_office_phone VARCHAR(50),               -- Head office phone
    eu_office_address TEXT,                      -- EU office address
    eu_office_phone VARCHAR(50),                 -- EU office phone
    legal_representative VARCHAR(255),           -- Name of the legal representative
    legal_representative_role VARCHAR(255),      -- Role of the legal representative
    eu_relations_representative VARCHAR(255),      -- Name of the EU affairs representative
    eu_relations_representative_role VARCHAR(255), -- Role of the EU affairs representative
    transparency_register_url VARCHAR(255),        -- Url to lobbyist page
    country VARCHAR(255),                          -- Country
    creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for fields of interest
CREATE TABLE IF NOT EXISTS fields_of_interest (
    field_id INT AUTO_INCREMENT PRIMARY KEY,
    field_name VARCHAR(255) UNIQUE,
    creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for lobbyst fields of interest
CREATE TABLE IF NOT EXISTS lobbyist_fields_of_interest (
    lobbyist_id VARCHAR(50),                    -- Lobbyist ID (foreign key)
    field_id INT,                               -- Field ID (foreign key)
    creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (lobbyist_id, field_id),        -- Composite primary key
    FOREIGN KEY (lobbyist_id) REFERENCES lobbyist_profile(lobbyist_id) ON DELETE CASCADE,
    FOREIGN KEY (field_id) REFERENCES fields_of_interest(field_id) ON DELETE CASCADE
);

-- Table to store membership details
CREATE TABLE IF NOT EXISTS memberships (
    membership_id INT AUTO_INCREMENT PRIMARY KEY,      -- Unique identifier for the membership
    membership_name TEXT,               				-- Name of the membership
    membership_lobbyist_id VARCHAR(50),                -- Possible lobbyist ID if the membership matches
    creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Timestamp for creation
    FOREIGN KEY (membership_lobbyist_id) REFERENCES lobbyist_profile(lobbyist_id) ON DELETE CASCADE
);

-- Table to link lobbyists to memberships
CREATE TABLE IF NOT EXISTS lobbyist_memberships  (
    lobbyist_id VARCHAR(50),                            -- Lobbyist ID (foreign key)
    membership_id INT,                                 -- membership ID (foreign key)
    creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Timestamp for creation
    PRIMARY KEY (lobbyist_id, membership_id),          -- Composite primary key
    FOREIGN KEY (lobbyist_id) REFERENCES lobbyist_profile(lobbyist_id) ON DELETE CASCADE,
    FOREIGN KEY (membership_id) REFERENCES memberships(membership_id) ON DELETE CASCADE
);

-- Table for legislative proposals
CREATE TABLE IF NOT EXISTS proposals (
    proposal_id INT AUTO_INCREMENT PRIMARY KEY,       -- Unique ID for the proposal
    proposal_description TEXT NOT NULL,               -- Description of the legislative proposal
    creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table linking lobbyists and proposals
CREATE TABLE IF NOT EXISTS lobbyist_proposals (
    lobbyist_id VARCHAR(50),                          -- Lobbyist ID (foreign key)
    proposal_id INT,                                  -- Proposal ID (foreign key)
    creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (lobbyist_id, proposal_id),           -- Composite primary key
    FOREIGN KEY (lobbyist_id) REFERENCES lobbyist_profile(lobbyist_id) ON DELETE CASCADE,
    FOREIGN KEY (proposal_id) REFERENCES proposals(proposal_id) ON DELETE CASCADE
);

-- Table for Commission representatives
CREATE TABLE IF NOT EXISTS commission_representative (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,        -- Name of the representative
    creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for directorate
CREATE TABLE IF NOT EXISTS directorate (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name TEXT NOT NULL,                      -- Name of directorate
    creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for meetings with the European Commission
CREATE TABLE IF NOT EXISTS commission_meetings (
    lobbyist_id VARCHAR(50),                     -- Lobbyist ID (foreign key)
    meeting_number INT,                          -- Meeting number
    meeting_date DATE,                           -- Meeting date
    topic TEXT,                                  -- Meeting topic
    representative_id INT,                       -- Main representative of the Commission
    location VARCHAR(255),                       -- Corresponding department or office
    creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (lobbyist_id, meeting_number),   -- Composite primary key
    FOREIGN KEY (lobbyist_id) REFERENCES lobbyist_profile(lobbyist_id) ON DELETE CASCADE,
    FOREIGN KEY (representative_id) REFERENCES commission_representative(id) ON DELETE CASCADE
);

-- Table for representatives allocation
CREATE TABLE IF NOT EXISTS representative_allocation (
    id INT AUTO_INCREMENT PRIMARY KEY,
    representative_id INT NOT NULL,              -- Name of the representative
    year INT NOT NULL,                           -- Year of representation
    directorate_id INT NOT NULL,                 -- Directorate
    role VARCHAR(255),                           -- Role
    creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (representative_id) REFERENCES commission_representative(id) ON DELETE CASCADE,
    FOREIGN KEY (directorate_id) REFERENCES directorate(id) ON DELETE CASCADE
);
