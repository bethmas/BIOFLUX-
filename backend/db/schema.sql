-- BioFlux database schema for MySQL

CREATE DATABASE IF NOT EXISTS bioflux_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE bioflux_db;

CREATE TABLE researchers (
  id CHAR(36) PRIMARY KEY NOT NULL DEFAULT (UUID()),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  institution VARCHAR(255),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE users (
  id CHAR(36) PRIMARY KEY NOT NULL DEFAULT (UUID()),
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'researcher',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE experiments (
  id CHAR(36) PRIMARY KEY NOT NULL DEFAULT (UUID()),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  researcher_id CHAR(36) NOT NULL,
  started_at DATE,
  status VARCHAR(50) NOT NULL DEFAULT 'planned',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_experiments_researcher FOREIGN KEY (researcher_id) REFERENCES researchers(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE samples (
  id CHAR(36) PRIMARY KEY NOT NULL DEFAULT (UUID()),
  experiment_id CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  species VARCHAR(255),
  collected_at DATETIME,
  volume_ml DECIMAL(10,3) CHECK (volume_ml >= 0),
  notes TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_samples_experiment FOREIGN KEY (experiment_id) REFERENCES experiments(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE resident_reports (
  id CHAR(36) PRIMARY KEY NOT NULL DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  sample_id CHAR(36),
  title VARCHAR(255) NOT NULL DEFAULT 'Resident Report',
  description TEXT NOT NULL,
  location VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'Pending',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  CONSTRAINT fk_resident_reports_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_resident_reports_sample FOREIGN KEY (sample_id) REFERENCES samples(id) ON DELETE SET NULL
) ENGINE=InnoDB;
