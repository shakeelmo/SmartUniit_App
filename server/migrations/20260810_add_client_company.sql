-- Add client company column to project completion reports
ALTER TABLE project_completion_reports ADD COLUMN client_company VARCHAR(255) NULL AFTER client_name;
