-- BioFlux database schema for MySQL

CREATE DATABASE IF NOT EXISTS bioflux_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE bioflux_db;

CREATE TABLE users (
  id CHAR(36) PRIMARY KEY NOT NULL DEFAULT (UUID()),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(128) NOT NULL,
  role ENUM('resident','company','farmer') NOT NULL,
  location VARCHAR(255),
  phone VARCHAR(50),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE overflow_reports (
  id CHAR(36) PRIMARY KEY NOT NULL DEFAULT (UUID()),
  reporter_id CHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  location VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'Pending',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_overflow_reports_user FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE manure_requests (
  id CHAR(36) PRIMARY KEY NOT NULL DEFAULT (UUID()),
  farmer_id CHAR(36) NOT NULL,
  amount_requested VARCHAR(100) NOT NULL,
  location VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'Pending',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_manure_requests_user FOREIGN KEY (farmer_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE researchers (
  id CHAR(36) PRIMARY KEY NOT NULL DEFAULT (UUID()),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  institution VARCHAR(255),
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

CREATE TABLE measurements (
  id CHAR(36) PRIMARY KEY NOT NULL DEFAULT (UUID()),
  sample_id CHAR(36) NOT NULL,
  metric VARCHAR(100) NOT NULL,
  value DECIMAL(12,4) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  measured_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  CONSTRAINT fk_measurements_sample FOREIGN KEY (sample_id) REFERENCES samples(id) ON DELETE CASCADE
) ENGINE=InnoDB;
