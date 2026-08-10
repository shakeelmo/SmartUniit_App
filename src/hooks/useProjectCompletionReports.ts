import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import { ProjectCompletionReport } from '../types/projectCompletionReport';

const mapReport = (r: any): ProjectCompletionReport => ({
  id: r.id,
  reportNumber: r.report_number || r.reportNumber || '',
  title: r.title || '',
  subtitle: r.subtitle || '',
  clientName: r.client_name || r.clientName || '',
  clientCompany: r.client_company || r.clientCompany || '',
  clientFormerName: r.client_former_name || r.clientFormerName || '',
  clientLogo: r.client_logo || r.clientLogo || null,
  clientRepName: r.client_rep_name || r.clientRepName || '',
  clientRepDesignation: r.client_rep_designation || r.clientRepDesignation || '',
  clientRepPhone: r.client_rep_phone || r.clientRepPhone || '',
  clientRepEmail: r.client_rep_email || r.clientRepEmail || '',
  contractorName: r.contractor_name || r.contractorName || '',
  contractorLogo: r.contractor_logo || r.contractorLogo || null,
  submissionDate: r.submission_date || r.submissionDate || '',
  completionDate: r.completion_date || r.completionDate || '',
  version: r.version || '',
  projectLocation: r.project_location || r.projectLocation || '',
  projectManager: r.project_manager || r.projectManager || '',
  scopeOfWork: r.scope_of_work || r.scopeOfWork || '',
  introduction: r.introduction || '',
  scopeContent: r.scope_content || r.scopeContent || '',
  executionDetails: r.executionDetails || {},
  testingDetails: r.testing_details || r.testingDetails || '',
  conclusion: r.conclusion || '',
  photos: r.photos || [],
  signatures: r.signatures || [],
  status: r.status || 'draft',
  createdBy: r.created_by,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

export function useProjectCompletionReports() {
  const [reports, setReports] = useState<ProjectCompletionReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReports = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await api.getProjectCompletionReports({ limit: 1000 });
      setReports((data.reports || []).map(mapReport));
    } catch (error) {
      console.error('Error fetching project completion reports:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const addReport = async (report: Omit<ProjectCompletionReport, 'id' | 'reportNumber'>) => {
    try {
      const { report: created } = await api.createProjectCompletionReport(report);
      await fetchReports();
      return mapReport(created);
    } catch (error) {
      console.error('Error creating project completion report:', error);
      throw error;
    }
  };

  const updateReport = async (id: string, updates: Partial<ProjectCompletionReport>) => {
    try {
      const { report: updated } = await api.updateProjectCompletionReport(id, updates);
      await fetchReports();
      return mapReport(updated);
    } catch (error) {
      console.error('Error updating project completion report:', error);
      throw error;
    }
  };

  const deleteReport = async (id: string) => {
    try {
      await api.deleteProjectCompletionReport(id);
      await fetchReports();
    } catch (error) {
      console.error('Error deleting project completion report:', error);
      throw error;
    }
  };

  return {
    reports,
    isLoading,
    addReport,
    updateReport,
    deleteReport,
    refetch: fetchReports,
  };
}
