import React, { useState } from 'react';
import { Calendar, User, DollarSign, Building2, MoreHorizontal, Edit, Trash2, Eye, Download, Paperclip } from 'lucide-react';
import { Proposal } from '../../types/proposal';
import { format, parseISO } from 'date-fns';
import { formatCurrencyWithSymbol } from '../../utils/format';

interface ProposalCardProps {
  proposal: Proposal;
  customer?: any;
  vendor?: any;
  onEdit: (proposal: Proposal) => void;
  onDelete: (proposalId: string) => void;
  onView: (proposal: Proposal) => void;
  onExportPDF: (proposal: Proposal) => void;
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
    
    return format(date, 'MMM dd, yyyy');
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'N/A';
  }
};

export function ProposalCard({ 
  proposal, 
  customer, 
  vendor, 
  onEdit, 
  onDelete, 
  onView, 
  onExportPDF 
}: ProposalCardProps) {
  const [showActions, setShowActions] = useState(false);

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this proposal? This action cannot be undone.')) {
      onDelete(proposal.id);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-lg font-semibold text-dark-900">{proposal.title}</h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[proposal.status]}`}>
              {statusLabels[proposal.status]}
            </span>
          </div>
          <p className="text-dark-600 text-sm line-clamp-2 mb-3">{proposal.description}</p>
        </div>
        
        <div className="relative ml-4">
          <button
            onClick={() => setShowActions(!showActions)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <MoreHorizontal className="w-4 h-4 text-dark-600" />
          </button>
          
          {showActions && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
              <button
                onClick={() => {
                  onView(proposal);
                  setShowActions(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-dark-700 hover:bg-gray-100 flex items-center"
              >
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </button>
              <button
                onClick={() => {
                  onEdit(proposal);
                  setShowActions(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-dark-700 hover:bg-gray-100 flex items-center"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </button>
              <button
                onClick={() => {
                  onExportPDF(proposal);
                  setShowActions(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 flex items-center"
              >
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </button>
              <hr className="my-1" />
              <button
                onClick={() => {
                  handleDelete();
                  setShowActions(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center text-dark-600">
            <User className="w-4 h-4 mr-2" />
            {customer?.name || 'Unknown Customer'}
          </div>
          {proposal.value && (
            <div className="flex items-center text-dark-600">
              <DollarSign className="w-4 h-4 mr-1" />
              {formatCurrencyWithSymbol(proposal.value, 'SAR')}
            </div>
          )}
        </div>

        {vendor && (
          <div className="flex items-center text-sm text-dark-600">
            <Building2 className="w-4 h-4 mr-2" />
            {vendor.name}
          </div>
        )}

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center text-dark-600">
            <Calendar className="w-4 h-4 mr-2" />
            Created {formatDate(proposal.createdAt)}
          </div>
          {proposal.attachments && proposal.attachments.length > 0 && (
            <div className="flex items-center text-dark-600">
              <Paperclip className="w-4 h-4 mr-1" />
              {proposal.attachments.length} file{proposal.attachments.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-xs text-dark-500">
            Updated {formatDate(proposal.updatedAt)}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onView(proposal)}
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              View Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}