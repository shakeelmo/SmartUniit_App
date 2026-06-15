import React, { useState } from 'react';
import { Plus, Search, Filter, ClipboardList, DollarSign, Calendar, User, Download, FileText } from 'lucide-react';
import { ProposalCard } from '../components/Proposals/ProposalCard';
import { CreateProposalModal } from '../components/Proposals/CreateProposalModal';
import { ProposalDetailModal } from '../components/Proposals/ProposalDetailModal';
import { useProposals } from '../hooks/useProposals';
import { useAuth } from '../contexts/AuthContext';
import { Proposal } from '../types/proposal';
import { pdfExports } from '../utils/pdfExports';
import toast from 'react-hot-toast';
import { formatCurrencyWithSymbol } from '../utils/format';

export function Proposals() {
  const { user, hasPermission } = useAuth();
  const { 
    proposals, 
    customers, 
    vendors, 
    isLoading, 
    addProposal, 
    updateProposal, 
    deleteProposal,
    uploadAttachment,
    removeAttachment,
  } = useProposals();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingProposal, setEditingProposal] = useState<Proposal | null>(null);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const filteredProposals = proposals.filter(proposal => {
    const customer = customers.find(c => c.id === proposal.customerId);
    const vendor = vendors.find(v => v.id === proposal.vendorId);
    
    const matchesSearch = proposal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         proposal.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || proposal.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: proposals.length,
    draft: proposals.filter(p => p.status === 'draft').length,
    submitted: proposals.filter(p => p.status === 'submitted').length,
    approved: proposals.filter(p => p.status === 'approved').length,
    rejected: proposals.filter(p => p.status === 'rejected').length,
    won: proposals.filter(p => p.status === 'won').length,
    totalValue: proposals.reduce((sum, p) => sum + (p.value || 0), 0),
  };

  const handleCreateProposal = async (proposalData: any) => {
    try {
      await addProposal(proposalData);
      toast.success('Proposal created successfully');
    } catch (error) {
      toast.error('Failed to create proposal');
      console.error('Error creating proposal:', error);
    }
  };

  const handleEditProposal = async (proposalData: any) => {
    if (!editingProposal) return;
    
    try {
      await updateProposal(editingProposal.id, proposalData);
      setEditingProposal(null);
      toast.success('Proposal updated successfully');
    } catch (error) {
      toast.error('Failed to update proposal');
      console.error('Error updating proposal:', error);
    }
  };

  const handleDeleteProposal = async (proposalId: string) => {
    try {
      await deleteProposal(proposalId);
      toast.success('Proposal deleted successfully');
    } catch (error) {
      toast.error('Failed to delete proposal');
      console.error('Error deleting proposal:', error);
    }
  };

  const handleExportPDF = async (proposal: Proposal) => {
    try {
      setIsExporting(proposal.id);
      const customer = customers.find(c => c.id === proposal.customerId);
      await pdfExports.exportProposalPDF(proposal, customer);
      toast.success('PDF exported successfully');
    } catch (error) {
      toast.error('Failed to export PDF');
      console.error('Error exporting PDF:', error);
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportWord = (proposal: Proposal) => {
    try {
      const customer = customers.find(c => c.id === proposal.customerId);
      pdfExports.exportProposalWord(proposal, customer);
      toast.success('Word document exported successfully');
    } catch (error) {
      toast.error('Failed to export Word document');
      console.error('Error exporting Word document:', error);
    }
  };

  const handleViewProposal = (proposal: Proposal) => {
    setSelectedProposal(proposal);
    setIsDetailModalOpen(true);
  };

  const handleUploadAttachment = async (proposalId: string, file: File) => {
    try {
      await uploadAttachment(proposalId, file);
      toast.success('File uploaded successfully');
      
      // Refresh the selected proposal if it's the one being updated
      if (selectedProposal?.id === proposalId) {
        const updatedProposal = proposals.find(p => p.id === proposalId);
        if (updatedProposal) {
          setSelectedProposal(updatedProposal);
        }
      }
    } catch (error) {
      toast.error('Failed to upload file');
      console.error('Error uploading file:', error);
    }
  };

  const handleRemoveAttachment = async (proposalId: string, attachmentId: string) => {
    try {
      await removeAttachment(proposalId, attachmentId);
      toast.success('File removed successfully');
      
      // Refresh the selected proposal if it's the one being updated
      if (selectedProposal?.id === proposalId) {
        const updatedProposal = proposals.find(p => p.id === proposalId);
        if (updatedProposal) {
          setSelectedProposal(updatedProposal);
        }
      }
    } catch (error) {
      toast.error('Failed to remove file');
      console.error('Error removing file:', error);
    }
  };

  const canCreateProposal = hasPermission('proposals', 'create');
  const canEditProposal = hasPermission('proposals', 'update');
  const canDeleteProposal = hasPermission('proposals', 'delete');

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-900">Proposals</h1>
          <p className="text-dark-600">Manage business proposals and track their progress</p>
        </div>
        {canCreateProposal && (
          <button 
            onClick={() => {
              setEditingProposal(null);
              setIsCreateModalOpen(true);
            }}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Proposal</span>
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-dark-600">Total Proposals</p>
              <p className="text-2xl font-bold text-dark-900">{stats.total}</p>
            </div>
            <div className="p-3 bg-primary-100 rounded-lg">
              <ClipboardList className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-dark-600">Submitted</p>
              <p className="text-2xl font-bold text-blue-600">{stats.submitted}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <ClipboardList className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-dark-600">Won</p>
              <p className="text-2xl font-bold text-green-600">{stats.won}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <ClipboardList className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-dark-600">Total Value</p>
              <p className="text-2xl font-bold text-primary-600">
                {formatCurrencyWithSymbol(stats.totalValue, 'SAR')}
              </p>
            </div>
            <div className="p-3 bg-primary-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search proposals, customers, vendors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-dark-600" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="under_review">Under Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="won">Won</option>
                <option value="lost">Lost</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Proposals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProposals.map((proposal) => {
          const customer = customers.find(c => c.id === proposal.customerId);
          const vendor = vendors.find(v => v.id === proposal.vendorId);
          
          return (
            <ProposalCard
              key={proposal.id}
              proposal={proposal}
              customer={customer}
              vendor={vendor}
              canEdit={canEditProposal}
              canDelete={canDeleteProposal}
              onEdit={(proposal) => {
                setEditingProposal(proposal);
                setIsDetailModalOpen(false);
                setSelectedProposal(null);
                setIsCreateModalOpen(true);
              }}
              onDelete={handleDeleteProposal}
              onView={handleViewProposal}
              onExportPDF={handleExportPDF}
              onExportWord={handleExportWord}
            />
          );
        })}
      </div>

      {filteredProposals.length === 0 && (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ClipboardList className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-dark-900 mb-2">No proposals found</h3>
          <p className="text-dark-600 mb-4">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'Get started by creating your first proposal'
            }
          </p>
          {canCreateProposal && !searchTerm && statusFilter === 'all' && (
            <button 
              onClick={() => {
                setEditingProposal(null);
                setIsCreateModalOpen(true);
              }}
              className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Create Proposal
            </button>
          )}
        </div>
      )}

      {/* Create/Edit Proposal Modal */}
      <CreateProposalModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingProposal(null);
        }}
        onSubmit={editingProposal ? handleEditProposal : handleCreateProposal}
        customers={customers}
        vendors={vendors}
        editProposal={editingProposal}
      />

      {/* Proposal Detail Modal */}
      {selectedProposal && (
        <ProposalDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedProposal(null);
          }}
          proposal={selectedProposal}
          customer={customers.find(c => c.id === selectedProposal.customerId)}
          vendor={vendors.find(v => v.id === selectedProposal.vendorId)}
          onUploadAttachment={handleUploadAttachment}
          onRemoveAttachment={handleRemoveAttachment}
          onExportPDF={handleExportPDF}
          onExportWord={handleExportWord}
          onEdit={canEditProposal ? (proposal) => {
            setEditingProposal(proposal);
            setIsDetailModalOpen(false);
            setSelectedProposal(null);
            setIsCreateModalOpen(true);
          } : undefined}
        />
      )}
    </div>
  );
}