import React, { useState } from 'react';
import { X, Calendar, User, DollarSign, Building2, Paperclip, Download, Trash2, Upload, Activity, Edit } from 'lucide-react';
import { Proposal } from '../../types/proposal';
import { format, parseISO } from 'date-fns';
import { formatCurrencyWithSymbol } from '../../utils/format';

// Helper function to safely format dates
const formatDate = (dateValue: any): string => {
  try {
    if (!dateValue) return 'N/A';
    
    let date: Date;
    if (typeof dateValue === 'string') {
      date = parseISO(dateValue);
    } else if (dateValue instanceof Date) {
      date = dateValue;
    } else {
      return 'N/A';
    }
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return 'N/A';
    }
    
    return format(date, 'MMM dd, yyyy HH:mm');
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'N/A';
  }
};

// Helper function to safely format short dates
const formatShortDate = (dateValue: any): string => {
  try {
    if (!dateValue) return 'N/A';
    
    let date: Date;
    if (typeof dateValue === 'string') {
      date = parseISO(dateValue);
    } else if (dateValue instanceof Date) {
      date = dateValue;
    } else {
      return 'N/A';
    }
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return 'N/A';
    }
    
    return format(date, 'MMM dd, yyyy');
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'N/A';
  }
};

interface ProposalDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposal: Proposal;
  customer?: any;
  vendor?: any;
  onUploadAttachment: (proposalId: string, file: File) => void;
  onRemoveAttachment: (proposalId: string, attachmentId: string) => void;
  onExportPDF: (proposal: Proposal) => void;
  onEdit?: (proposal: Proposal) => void;
}

const statusColors = {
  draft: 'bg-gray-100 text-gray-800',
  submitted: 'bg-blue-100 text-blue-800',
  under_review: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  won: 'bg-emerald-100 text-emerald-800',
  lost: 'bg-red-100 text-red-800',
};

const statusLabels = {
  draft: 'Draft',
  submitted: 'Submitted',
  under_review: 'Under Review',
  approved: 'Approved',
  rejected: 'Rejected',
  won: 'Won',
  lost: 'Lost',
};

export function ProposalDetailModal({
  isOpen,
  onClose,
  proposal,
  customer,
  vendor,
  onUploadAttachment,
  onRemoveAttachment,
  onExportPDF,
  onEdit,
}: ProposalDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'attachments' | 'activity'>('details');
  const [isDragging, setIsDragging] = useState(false);

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;
    
    Array.from(files).forEach(file => {
      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'image/jpeg',
        'image/png',
        'image/gif',
      ];
      
      if (!allowedTypes.includes(file.type)) {
        alert(`File type ${file.type} is not allowed. Please upload PDF, Word, Excel, or image files.`);
        return;
      }
      
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      
      onUploadAttachment(proposal.id, file);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-dark-900">{proposal.title}</h2>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[proposal.status]}`}>
              {statusLabels[proposal.status]}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {onEdit && (
              <button
                onClick={() => onEdit(proposal)}
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Edit className="w-4 h-4" />
                <span>Edit Proposal</span>
              </button>
            )}
            <button
              onClick={() => onExportPDF(proposal)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-dark-600" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'details', label: 'Details', icon: User },
              { id: 'attachments', label: 'Attachments', icon: Paperclip },
              { id: 'activity', label: 'Activity Log', icon: Activity },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {activeTab === 'details' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-dark-900 mb-3">Proposal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-1">Title</label>
                    <p className="text-dark-900">{proposal.title}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-1">Status</label>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[proposal.status]}`}>
                      {statusLabels[proposal.status]}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-1">Customer</label>
                    <p className="text-dark-900">{customer?.name || 'Unknown Customer'}</p>
                    <p className="text-sm text-dark-600">{customer?.email}</p>
                  </div>
                  {vendor && (
                    <div>
                      <label className="block text-sm font-medium text-dark-700 mb-1">Vendor</label>
                      <p className="text-dark-900">{vendor.name}</p>
                      <p className="text-sm text-dark-600">{vendor.email}</p>
                    </div>
                  )}
                  {proposal.value && (
                    <div>
                      <label className="block text-sm font-medium text-dark-700 mb-1">Estimated Value</label>
                      <p className="text-dark-900 font-semibold">{formatCurrencyWithSymbol(proposal.value, 'SAR')}</p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-1">Created</label>
                    <p className="text-dark-900">{formatDate(proposal.createdAt)}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-dark-900 mb-3">Description</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-dark-700 whitespace-pre-wrap">{proposal.description}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'attachments' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-dark-900 mb-3">Attachments</h3>
                
                {/* File Upload Area */}
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    isDragging
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-dark-900 mb-2">
                    Drop files here or click to upload
                  </p>
                  <p className="text-sm text-dark-600 mb-4">
                    Supports PDF, Word, Excel, and image files (max 10MB each)
                  </p>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
                    onChange={(e) => handleFileUpload(e.target.files)}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg cursor-pointer transition-colors"
                  >
                    Choose Files
                  </label>
                </div>
              </div>

              {/* Attachments List */}
              {proposal.attachments.length > 0 && (
                <div>
                  <h4 className="font-medium text-dark-900 mb-3">
                    Uploaded Files ({proposal.attachments.length})
                  </h4>
                  <div className="space-y-3">
                    {proposal.attachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <Paperclip className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="font-medium text-dark-900">{attachment.name}</p>
                            <p className="text-sm text-dark-600">
                              {formatFileSize(attachment.size)} • Uploaded {formatShortDate(attachment.uploadedAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <a
                            href={attachment.url}
                            download={attachment.name}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => onRemoveAttachment(proposal.id, attachment.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remove"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-dark-900">Activity Log</h3>
              <div className="space-y-4">
                {proposal.activityLog.map((entry) => (
                  <div key={entry.id} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                    <div className="w-2 h-2 bg-primary-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-dark-900">{entry.user}</p>
                        <p className="text-sm text-dark-500">
                          {formatDate(entry.timestamp)}
                        </p>
                      </div>
                      <p className="text-sm text-dark-600 capitalize">
                        {entry.action.replace('_', ' ')}
                      </p>
                      {entry.details && (
                        <p className="text-sm text-dark-500 mt-1">{entry.details}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}