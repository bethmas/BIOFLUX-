-- BioFlux sample data for MySQL

USE bioflux_db;

INSERT INTO researchers (id, name, email, institution)
VALUES
  ('4e4e7b66-8a4a-4d9c-af1f-110c0c6c6d90', 'Dr. Maya Santos', 'maya.santos@biofluxlab.edu', 'BioFlux Research Institute'),
  ('7c1d8e91-2c80-4f0a-b18a-9f7a0365d8fa', 'Samir Patel', 'samir.patel@biofluxlab.edu', 'BioFlux Research Institute');

INSERT INTO users (id, username, email, password, role)
VALUES
  ('2a1b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d', 'leone_wambi', 'leone.wambi@biofluxlab.edu', 'group7', 'researcher'),
  ('3b4c5d6e-7f8a-4b9c-0d1e-2f3a4b5c6d7e', 'keith_williams', 'keith.williams@biofluxlab.edu', 'group7', 'researcher'),
  ('4c5d6e7f-8a9b-4c0d-1e2f-3a4b5c6d7e8f', 'namuddu_vivian', 'namuddu.vivian@biofluxlab.edu', 'group7', 'researcher'),
  ('5d6e7f8a-9b0c-4d1e-2f3a-4b5c6d7e8f9a', 'achia_bethmas', 'achia.bethmas@biofluxlab.edu', 'group7', 'researcher');

INSERT INTO experiments (id, title, description, researcher_id, started_at, status)
VALUES
  ('e64b9f9a-bfa1-4a21-8abc-a9afe7f09409', 'Microfluidic shear stress on endothelial cells', 'Evaluate cell response to controlled fluid flow in a microchannel array.', '4e4e7b66-8a4a-4d9c-af1f-110c0c6c6d90', '2026-06-15', 'active'),
  ('a5d1c9b1-1934-4f7f-a99b-8d0f5bf7f3b2', 'Live tracking of plankton migration', 'Collect time-series sample measurements to identify collective motion patterns.', '7c1d8e91-2c80-4f0a-b18a-9f7a0365d8fa', '2026-05-20', 'completed');

INSERT INTO samples (id, experiment_id, name, species, collected_at, volume_ml, notes)
VALUES
  ('c5d6629b-984c-4d7e-92ed-8d25f4e1f8f2', 'e64b9f9a-bfa1-4a21-8abc-a9afe7f09409', 'Endothelial sample A', 'HUVEC', '2026-06-16 10:30:00', 1.25, 'Baseline sample before shear ramp.'),
  ('d4e1f2a3-7b8c-4e9d-8f2a-2b3c4d5e6f70', 'a5d1c9b1-1934-4f7f-a99b-8d0f5bf7f3b2', 'Plankton sample B', 'Diatom', '2026-05-21 09:15:00', 2.50, 'Collected at 0.5m depth during morning run.'),
  ('f3b2c1d4-0e5f-4a6b-9c7d-8e9f0a1b2c3d', 'e64b9f9a-bfa1-4a21-8abc-a9afe7f09409', 'Endothelial sample B', 'HUVEC', '2026-06-16 11:00:00', 1.10, 'Post-shear sample for comparison.');

INSERT INTO resident_reports (id, user_id, sample_id, title, description, location, phone, status, created_at, notes)
VALUES
  ('d9a90f80-3c4d-4b73-a974-70a5c1e0e4a0', '2a1b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d', 'c5d6629b-984c-4d7e-92ed-8d25f4e1f8f2', 'Water issue report', 'Resident reported unusual swelling near the sample site.', 'Nakawa Village', '+256700123456', 'Pending', '2026-06-16 11:00:00', 'Follow-up requested within 24 hours.'),
  ('3a5b6c7d-8e9f-4a0b-1c2d-3e4f5a6b7c8d', '3b4c5d6e-7f8a-4b9c-0d1e-2f3a4b5c6d7e', 'c5d6629b-984c-4d7e-92ed-8d25f4e1f8f2', 'Positive feedback', 'Resident shared positive feedback about the monitoring process.', 'Kampala East', '+256700987654', 'Reviewed', '2026-06-16 12:00:00', 'No further action required.'),
  ('5a6b7c8d-9e0f-4a1b-2c3d-4e5f6a7b8c9d', '4c5d6e7f-8a9b-4c0d-1e2f-3a4b5c6d7e8f', 'f3b2c1d4-0e5f-4a6b-9c7d-8e9f0a1b2c3d', 'Collection delay incident', 'Resident reported a delayed collection window.', 'Mukono', '+256701111111', 'Pending', '2026-06-16 12:30:00', 'Escalated to field support.'),
  ('1b2c3d4e-5f6a-7b8c-9d0e-1f2a3b4c5d6e', '5d6e7f8a-9b0c-4d1e-2f3a-4b5c6d7e8f9a', 'd4e1f2a3-7b8c-4e9d-8f2a-2b3c4d5e6f70', 'Status request', 'Resident requested an updated sample status summary.', 'Jinja', '+256702222222', 'In Progress', '2026-05-21 10:00:00', 'Waiting for lab confirmation.'),
  ('6d5c4b3a-2f1e-0d9c-8b7a-6e5f4d3c2b1a', '2a1b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d', 'd4e1f2a3-7b8c-4e9d-8f2a-2b3c4d5e6f70', 'Labeling concern', 'Resident reported inconsistent labeling during collection.', 'Gulu', '+256703333333', 'Pending', '2026-05-21 10:30:00', 'Labeling issue documented.');
