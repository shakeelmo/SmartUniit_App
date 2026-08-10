import React, { useState } from 'react';
import { Plus, FileText, Download, Pencil, Trash2, Search, Building2 } from 'lucide-react';
import { useProjectCompletionReports } from '../hooks/useProjectCompletionReports';
import { CreateProjectCompletionReportModal } from '../components/ProjectCompletionReports/CreateProjectCompletionReportModal';
import { ProjectCompletionReport } from '../types/projectCompletionReport';
import { generateProjectCompletionReportPdf } from '../utils/projectCompletionReportPdf';
import toast from 'react-hot-toast';

const formatDate = (value?: string) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-GB');
};

export function ProjectCompletionReports() {
  const { reports, isLoading, addReport, updateReport, deleteReport } = useProjectCompletionReports();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<ProjectCompletionReport | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<string | null>(null);

  const filteredReports = reports.filter((report) => {
    const term = searchTerm.toLowerCase();
    return (
      report.title.toLowerCase().includes(term) ||
      report.clientName.toLowerCase().includes(term) ||
      report.reportNumber.toLowerCase().includes(term)
    );
  });

  const handleSave = async (data: any) => {
    if (editingReport) {
      await updateReport(editingReport.id, data);
      toast.success('Report updated successfully');
    } else {
      await addReport(data);
      toast.success('Report created successfully');
    }
  };

  const handleDownloadPdf = async (report: ProjectCompletionReport) => {
    setIsGeneratingPdf(report.id);
    try {
      const pdf = await generateProjectCompletionReportPdf(report);
      pdf.save(`${report.reportNumber || 'project-completion-report'}.pdf`);
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPdf(null);
    }
  };

  const handleDelete = async (report: ProjectCompletionReport) => {
    if (!window.confirm(`Delete report ${report.reportNumber}? This action cannot be undone.`)) return;
    try {
      await deleteReport(report.id);
      toast.success('Report deleted successfully');
    } catch (error) {
      toast.error('Failed to delete report');
    }
  };

  const openCreate = () => {
    setEditingReport(null);
    setIsModalOpen(true);
  };

  const openEdit = (report: ProjectCompletionReport) => {
    setEditingReport(report);
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded-xl"></div>
          <div className="h-32 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-900">Project Completion Reports</h1>
          <p className="text-dark-600">Create and manage project completion reports with customer sign-off</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Report
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by title, client, or report number..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {filteredReports.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-dark-600">No project completion reports yet.</p>
          <button onClick={openCreate} className="mt-3 text-primary-600 hover:underline text-sm font-medium">
            Create your first report
          </button>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3">Report No</th>
                <th className="px-4 py-3">Project Title</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Completion Date</th>
                <th className="px-4 py-3">Version</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((report) => (
                <tr key={report.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-primary-700">{report.reportNumber}</td>
                  <td className="px-4 py-3 text-dark-800">{report.title}</td>
                  <td className="px-4 py-3 text-dark-600">{report.clientName || '-'}</td>
                  <td className="px-4 py-3 text-dark-600">{formatDate(report.completionDate)}</td>
                  <td className="px-4 py-3 text-dark-600">{report.version || '-'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        report.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {report.status === 'completed' ? 'Completed' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleDownloadPdf(report)}
                        disabled={isGeneratingPdf === report.id}
                        title="Download PDF"
                        className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      >
                        {isGeneratingPdf === report.id ? (
                          <span className="block w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => openEdit(report)}
                        title="Edit"
                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(report)}
                        title="Delete"
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CreateProjectCompletionReportModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingReport(null);
        }}
        onSubmit={handleSave}
        editReport={editingReport}
      />
    </div>
  );
}
