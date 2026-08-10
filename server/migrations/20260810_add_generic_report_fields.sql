-- Add report type (specific/generic) and dynamic sections to project completion reports
ALTER TABLE project_completion_reports ADD COLUMN report_type VARCHAR(20) DEFAULT 'specific' AFTER status;
ALTER TABLE project_completion_reports ADD COLUMN sections LONGTEXT AFTER photos;
