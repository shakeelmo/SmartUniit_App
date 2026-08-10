import React, { useEffect, useState } from 'react';
import {
  X,
  Upload,
  Save,
  CheckCircle2,
  Building2,
  User,
  Phone,
  Mail,
  Briefcase,
  MapPin,
  Calendar,
  FileText,
  ImagePlus,
  ClipboardList,
  LayoutTemplate,
  ListPlus,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { api } from '../../lib/api';
import { SignaturePad } from './SignaturePad';
import { ProjectCompletionReport } from '../../types/projectCompletionReport';

interface CreateProjectCompletionReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  editReport?: ProjectCompletionReport | null;
}

const DEFAULT_SIGNATURES = [
  { label: 'Client Representative 1', name: '', designation: '', signature: '', date: '' },
  { label: 'Client Representative 2', name: '', designation: '', signature: '', date: '' },
  { label: 'SmartUniit Representative', name: '', designation: '', signature: '', date: '' },
];

const EXECUTION_SECTIONS = [
  { key: 'civilWork', label: 'Civil Work', placeholder: 'Excavation, trenching, conduits...' },
  { key: 'cableConduit', label: 'Cable & Conduit Installation', placeholder: 'Cable types, conduit details...' },
  { key: 'networkHardware', label: 'Network Hardware', placeholder: 'Patch panels, cabinets, racks...' },
  { key: 'layingPulling', label: 'Laying & Pulling Activities', placeholder: 'Cable routes, distances...' },
  { key: 'splicingTermination', label: 'Splicing & Termination', placeholder: 'Splices, pigtails, testing...' },
];

const emptyForm = {
  reportType: 'specific',
  title: '',
  subtitle: '',
  clientName: '',
  clientCompany: '',
  clientFormerName: '',
  clientLogo: '',
  clientRepName: '',
  clientRepDesignation: '',
  clientRepPhone: '',
  clientRepEmail: '',
  contractorName: 'Smart Universe Communication and Information Technology',
  contractorLogo: '',
  submissionDate: '',
  completionDate: '',
  version: 'V 1.0',
  projectLocation: '',
  projectManager: '',
  scopeOfWork: '',
  introduction: '',
  scopeContent: '',
  testingDetails: '',
  conclusion: '',
  status: 'draft',
};

const inputClass =
  'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors text-sm';
const labelClass = 'block text-sm font-medium text-dark-700 mb-1.5';

const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export function CreateProjectCompletionReportModal({
  isOpen,
  onClose,
  onSubmit,
  editReport,
}: CreateProjectCompletionReportModalProps) {
  const [formData, setFormData] = useState<any>({ ...emptyForm });
  const [executionDetails, setExecutionDetails] = useState<Record<string, string>>({});
  const [photos, setPhotos] = useState<{ name?: string; dataUrl: string }[]>([]);
  const [signatures, setSignatures] = useState(DEFAULT_SIGNATURES.map((s) => ({ ...s })));
  const [sections, setSections] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (editReport) {
      setFormData({
        reportType: editReport.reportType || 'specific',
        title: editReport.title || '',
        subtitle: editReport.subtitle || '',
        clientName: editReport.clientName || '',
        clientCompany: editReport.clientCompany || '',
        clientFormerName: editReport.clientFormerName || '',
        clientLogo: editReport.clientLogo || '',
        clientRepName: editReport.clientRepName || '',
        clientRepDesignation: editReport.clientRepDesignation || '',
        clientRepPhone: editReport.clientRepPhone || '',
        clientRepEmail: editReport.clientRepEmail || '',
        contractorName: editReport.contractorName || emptyForm.contractorName,
        contractorLogo: editReport.contractorLogo || '',
        submissionDate: editReport.submissionDate || '',
        completionDate: editReport.completionDate || '',
        version: editReport.version || 'V 1.0',
        projectLocation: editReport.projectLocation || '',
        projectManager: editReport.projectManager || '',
        scopeOfWork: editReport.scopeOfWork || '',
        introduction: editReport.introduction || '',
        scopeContent: editReport.scopeContent || '',
        testingDetails: editReport.testingDetails || '',
        conclusion: editReport.conclusion || '',
        status: editReport.status || 'draft',
      });
      setExecutionDetails(
        EXECUTION_SECTIONS.reduce((acc, s) => {
          acc[s.key] = (editReport.executionDetails?.[s.key] || []).join('\n');
          return acc;
        }, {} as Record<string, string>)
      );
      setPhotos(editReport.photos || []);
      setSections(editReport.sections || []);
      const sigs = [...DEFAULT_SIGNATURES];
      (editReport.signatures || []).forEach((sig, idx) => {
        if (sigs[idx]) sigs[idx] = { ...sigs[idx], ...sig };
      });
      setSignatures(sigs);
    } else {
      setFormData({ ...emptyForm });
      setExecutionDetails({});
      setPhotos([]);
      setSections([]);
      setSignatures(DEFAULT_SIGNATURES.map((s) => ({ ...s })));
    }
    api.getCustomers({ limit: 1000 }).then((res: any) => setCustomers(res.customers || [])).catch(() => {});
  }, [isOpen, editReport]);

  if (!isOpen) return null;

  const setField = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleCustomerSelect = (customerId: string) => {
    if (!customerId) return;
    const customer = customers.find((c) => c.id === customerId);
    if (!customer) return;
    setField('clientName', customer.name || '');
    setField('clientCompany', customer.company || '');
    setField('clientRepEmail', customer.email || '');
    setField('clientRepPhone', customer.phone || '');
    setField('clientRepName', customer.contact_person || '');
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await readFileAsDataUrl(file);
    setField('clientLogo', dataUrl);
  };

  const handlePhotosUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const loaded = await Promise.all(files.map(async (f) => ({ name: f.name, dataUrl: await readFileAsDataUrl(f) })));
    setPhotos((prev) => [...prev, ...loaded].slice(0, 30));
  };

  const updateSignature = (index: number, field: string, value: string) => {
    setSignatures((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  };

  const addSection = () => {
    setSections((prev) => [
      ...prev,
      {
        id: `sec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title: `Section ${prev.length + 1}`,
        type: 'paragraph',
        content: '',
      },
    ]);
  };

  const removeSection = (id: string) => {
    setSections((prev) => prev.filter((s) => s.id !== id));
  };

  const updateSection = (id: string, field: string, value: string) => {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const moveSection = (index: number, direction: -1 | 1) => {
    setSections((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const buildPayload = (status: string) => ({
    reportType: formData.reportType || 'specific',
    title: formData.title,
    subtitle: formData.subtitle,
    clientName: formData.clientName,
    clientCompany: formData.clientCompany,
    clientFormerName: formData.clientFormerName,
    clientLogo: formData.clientLogo || null,
    clientRepName: formData.clientRepName,
    clientRepDesignation: formData.clientRepDesignation,
    clientRepPhone: formData.clientRepPhone,
    clientRepEmail: formData.clientRepEmail,
    contractorName: formData.contractorName,
    contractorLogo: formData.contractorLogo || null,
    submissionDate: formData.submissionDate,
    completionDate: formData.completionDate,
    version: formData.version,
    projectLocation: formData.projectLocation,
    projectManager: formData.projectManager,
    scopeOfWork: formData.scopeOfWork,
    introduction: formData.introduction,
    scopeContent: formData.scopeContent,
    executionDetails: Object.fromEntries(
      Object.entries(executionDetails).map(([k, v]) => [
        k,
        String(v)
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
      ])
    ),
    testingDetails: formData.testingDetails,
    conclusion: formData.conclusion,
    photos,
    signatures,
    sections: formData.reportType === 'generic' ? sections : [],
    status,
  });

  const handleSubmit = async (status: string) => {
    setIsSubmitting(true);
    try {
      await onSubmit(buildPayload(status));
      toast.success(status === 'completed' ? 'Report completed successfully' : 'Report saved as draft');
      onClose();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to save report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const sectionCard = (title: string, icon: React.ReactNode, children: React.ReactNode) => (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-4">
      <h3 className="text-sm font-semibold text-dark-900 flex items-center gap-2">
        {icon}
        {title}
      </h3>
      {children}
    </div>
  );

  const field = (label: string, name: string, type: string = 'text', required = false, options?: React.InputHTMLAttributes<HTMLInputElement>) => (
    <div>
      <label className={labelClass}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={formData[name] || ''}
        onChange={(e) => setField(name, e.target.value)}
        className={inputClass}
        {...options}
      />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-xl font-bold text-dark-900">
              {editReport ? `Edit Report ${editReport.reportNumber}` : 'New Project Completion Report'}
            </h2>
            <p className="text-sm text-dark-600">Create a completion report based on the SmartUniit format</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Report Template */}
          {sectionCard('Report Template', <LayoutTemplate className="w-4 h-4 text-primary-600" />, (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label
                className={`border rounded-xl p-4 cursor-pointer transition-colors ${
                  formData.reportType === 'specific'
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="reportType"
                  className="hidden"
                  checked={formData.reportType === 'specific'}
                  onChange={() => setField('reportType', 'specific')}
                />
                <p className="text-sm font-semibold text-dark-900">Specific Template</p>
                <p className="text-xs text-dark-600 mt-1">Fixed sections for projects like fiber optic / network installation (Introduction, Scope, Execution Details, Testing, Conclusion).</p>
              </label>
              <label
                className={`border rounded-xl p-4 cursor-pointer transition-colors ${
                  formData.reportType === 'generic'
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="reportType"
                  className="hidden"
                  checked={formData.reportType === 'generic'}
                  onChange={() => setField('reportType', 'generic')}
                />
                <p className="text-sm font-semibold text-dark-900">Generic Template</p>
                <p className="text-xs text-dark-600 mt-1">Build your own sections for any type of project — add, reorder, and remove sections as needed.</p>
              </label>
            </div>
          ))}

          {/* Customer Information */}
          {sectionCard('Customer Information', <Building2 className="w-4 h-4 text-primary-600" />, (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className={labelClass}>Select existing customer (optional prefill)</label>
                  <select className={inputClass} onChange={(e) => handleCustomerSelect(e.target.value)} defaultValue="">
                    <option value="">-- Choose a customer --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.email ? `(${c.email})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                {field('Customer Name', 'clientName', 'text', true)}
                {field('Client Company', 'clientCompany')}
                {field('Formerly Known As (optional)', 'clientFormerName')}
                {field('Representative Name', 'clientRepName')}
                {field('Representative Designation', 'clientRepDesignation')}
                {field('Representative Phone', 'clientRepPhone', 'tel')}
                {field('Representative Email', 'clientRepEmail', 'email')}
                <div className="md:col-span-2">
                  <label className={labelClass}>Customer Logo</label>
                  <div className="flex items-center gap-4">
                    {formData.clientLogo ? (
                      <img src={formData.clientLogo} alt="Customer logo" className="h-14 w-auto border border-gray-200 rounded-lg p-1 bg-white" />
                    ) : (
                      <div className="h-14 w-28 border border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400">
                        <Upload className="w-5 h-5" />
                      </div>
                    )}
                    <label className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-dark-700 hover:bg-gray-50 cursor-pointer transition-colors">
                      <Upload className="w-4 h-4" />
                      Upload logo
                      <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                    </label>
                    {formData.clientLogo && (
                      <button type="button" className="text-xs text-red-600 hover:underline" onClick={() => setField('clientLogo', '')}>
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </>
          ))}

          {/* Project Information */}
          {sectionCard('Project Information', <Briefcase className="w-4 h-4 text-primary-600" />, (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {field('Project Title', 'title', 'text', true)}
              {field('Subtitle / Scope Summary', 'subtitle')}
              {field('Contractor Name', 'contractorName', 'text', true)}
              {field('Project Manager', 'projectManager')}
              {field('Project Location', 'projectLocation')}
              {field('Version', 'version')}
              {field('Completion Date', 'completionDate', 'date')}
              {field('Submission Date', 'submissionDate', 'date')}
              <div className="md:col-span-2">
                <label className={labelClass}>Scope of Work</label>
                <textarea
                  value={formData.scopeOfWork}
                  onChange={(e) => setField('scopeOfWork', e.target.value)}
                  className={inputClass}
                  rows={3}
                  placeholder="Brief description of the completed work..."
                />
              </div>
            </div>
          ))}

          {/* Report Sections (specific template) */}
          {formData.reportType === 'specific' && sectionCard('Report Sections', <FileText className="w-4 h-4 text-primary-600" />, (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>1. Introduction</label>
                <textarea
                  value={formData.introduction}
                  onChange={(e) => setField('introduction', e.target.value)}
                  className={inputClass}
                  rows={3}
                  placeholder="Official introduction to the completion report..."
                />
              </div>
              <div>
                <label className={labelClass}>3. Project Scope</label>
                <textarea
                  value={formData.scopeContent}
                  onChange={(e) => setField('scopeContent', e.target.value)}
                  className={inputClass}
                  rows={3}
                  placeholder="Detailed scope, tasks performed, and deliverables..."
                />
              </div>
              <div>
                <label className={labelClass}>4. Execution Details (one item per line)</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {EXECUTION_SECTIONS.map((section) => (
                    <div key={section.key}>
                      <label className="block text-xs font-medium text-dark-600 mb-1">{section.label}</label>
                      <textarea
                        value={executionDetails[section.key] || ''}
                        onChange={(e) =>
                          setExecutionDetails((prev) => ({ ...prev, [section.key]: e.target.value }))
                        }
                        className={inputClass}
                        rows={3}
                        placeholder={section.placeholder}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelClass}>5. Testing and Verification</label>
                <textarea
                  value={formData.testingDetails}
                  onChange={(e) => setField('testingDetails', e.target.value)}
                  className={inputClass}
                  rows={3}
                  placeholder="Continuity tests, end-to-end testing, results..."
                />
              </div>
              <div>
                <label className={labelClass}>7. Conclusion</label>
                <textarea
                  value={formData.conclusion}
                  onChange={(e) => setField('conclusion', e.target.value)}
                  className={inputClass}
                  rows={3}
                  placeholder="Final conclusion and project status..."
                />
              </div>
            </div>
          ))}

          {/* Report Sections (generic template) */}
          {formData.reportType === 'generic' && sectionCard('Report Sections', <ListPlus className="w-4 h-4 text-primary-600" />, (
            <div className="space-y-4">
              {sections.length === 0 && (
                <p className="text-sm text-gray-500">No sections yet. Add your first section to start building the report.</p>
              )}
              {sections.map((sec, index) => (
                <div key={sec.id} className="border border-gray-200 rounded-lg p-4 space-y-3 bg-white">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-500">Section {index + 1}</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveSection(index, -1)}
                        disabled={index === 0}
                        className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg disabled:opacity-30"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveSection(index, 1)}
                        disabled={index === sections.length - 1}
                        className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg disabled:opacity-30"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeSection(sec.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-2">
                      <label className={labelClass}>Section Title</label>
                      <input
                        value={sec.title}
                        onChange={(e) => updateSection(sec.id, 'title', e.target.value)}
                        className={inputClass}
                        placeholder="e.g. 1. Introduction"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Content Type</label>
                      <select
                        value={sec.type}
                        onChange={(e) => updateSection(sec.id, 'type', e.target.value)}
                        className={inputClass}
                      >
                        <option value="paragraph">Paragraph</option>
                        <option value="bullets">Bullet Points</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>
                      {sec.type === 'bullets' ? 'Content (one item per line)' : 'Content'}
                    </label>
                    <textarea
                      value={sec.content}
                      onChange={(e) => updateSection(sec.id, 'content', e.target.value)}
                      className={inputClass}
                      rows={4}
                      placeholder={
                        sec.type === 'bullets'
                          ? 'Item one\nItem two\nItem three'
                          : 'Write the section content here...'
                      }
                    />
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addSection}
                className="inline-flex items-center justify-center gap-2 w-full px-3 py-2.5 border border-dashed border-gray-300 rounded-lg text-sm text-primary-600 hover:bg-primary-50 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Section
              </button>
            </div>
          ))}

          {/* Photos */}
          {sectionCard('Project Photos', <ImagePlus className="w-4 h-4 text-primary-600" />, (
            <>
              <label className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-dark-700 hover:bg-gray-50 cursor-pointer transition-colors">
                <ImagePlus className="w-4 h-4" />
                Add photos
                <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotosUpload} />
              </label>
              {photos.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {photos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <img src={photo.dataUrl} alt={photo.name || `Photo ${index + 1}`} className="h-24 w-full object-cover rounded-lg border border-gray-200" />
                      <button
                        type="button"
                        onClick={() => setPhotos((prev) => prev.filter((_, i) => i !== index))}
                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          ))}

          {/* Sign-off */}
          {sectionCard('Sign-off & Signatures', <ClipboardList className="w-4 h-4 text-primary-600" />, (
            <div className="space-y-6">
              {signatures.map((sig, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3 bg-white">
                  <p className="text-sm font-semibold text-dark-800">{sig.label}</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className={labelClass}>Name</label>
                      <input
                        value={sig.name}
                        onChange={(e) => updateSignature(index, 'name', e.target.value)}
                        className={inputClass}
                        placeholder="Full name"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Designation</label>
                      <input
                        value={sig.designation}
                        onChange={(e) => updateSignature(index, 'designation', e.target.value)}
                        className={inputClass}
                        placeholder="Designation"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Date</label>
                      <input
                        type="date"
                        value={sig.date}
                        onChange={(e) => updateSignature(index, 'date', e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Signature</label>
                    <SignaturePad value={sig.signature} onChange={(dataUrl) => updateSignature(index, 'signature', dataUrl)} />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl sticky bottom-0">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            Cancel
          </button>
          <button
            onClick={() => handleSubmit('draft')}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-dark-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            Save Draft
          </button>
          <button
            onClick={() => handleSubmit('completed')}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            {editReport ? 'Update & Complete' : 'Save & Complete'}
          </button>
        </div>
      </div>
    </div>
  );
}
