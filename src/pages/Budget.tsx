import React, { useState } from 'react';
import { Plus, Search, Filter, Calculator, DollarSign, TrendingUp, AlertTriangle, Download } from 'lucide-react';
import { pdfExports } from '../utils/pdfExports';
import { formatCurrencyWithSymbol } from '../utils/format';

export function Budget() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isExporting, setIsExporting] = useState<string | null>(null);

  // Mock data
  const budgets = [
    {
      id: '1',
      project: 'Smart City IoT Infrastructure',
      totalAmount: 250000,
      spentAmount: 162500,
      status: 'active',
      categories: [
        { name: 'Hardware', allocatedAmount: 150000, spentAmount: 98000 },
        { name: 'Software', allocatedAmount: 50000, spentAmount: 32000 },
        { name: 'Installation', allocatedAmount: 30000, spentAmount: 20000 },
        { name: 'Training', allocatedAmount: 20000, spentAmount: 12500 },
      ],
      createdAt: new Date('2024-01-15'),
    },
    {
      id: '2',
      project: 'Digital Transformation Initiative',
      totalAmount: 500000,
      spentAmount: 125000,
      status: 'approved',
      categories: [
        { name: 'Software Licenses', allocatedAmount: 200000, spentAmount: 50000 },
        { name: 'Consulting', allocatedAmount: 150000, spentAmount: 37500 },
        { name: 'Training', allocatedAmount: 100000, spentAmount: 25000 },
        { name: 'Infrastructure', allocatedAmount: 50000, spentAmount: 12500 },
      ],
      createdAt: new Date('2024-02-01'),
    },
  ];

  const statusColors = {
    draft: 'bg-gray-100 text-gray-800',
    approved: 'bg-blue-100 text-blue-800',
    active: 'bg-green-100 text-green-800',
    completed: 'bg-purple-100 text-purple-800',
  };

  const totalBudget = budgets.reduce((sum, b) => sum + b.totalAmount, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spentAmount, 0);
  const utilizationRate = (totalSpent / totalBudget) * 100;

  const handleExportPDF = async (budget: any) => {
    try {
      setIsExporting(budget.id);
      const project = { 
        title: budget.project, 
        description: `Budget report for ${budget.project}` 
      };
      await pdfExports.exportBudgetPDF(budget, project, budget.categories);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-900">Budget Management</h1>
          <p className="text-dark-600">Track project budgets and financial performance</p>
        </div>
        <button className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
          <Plus className="w-4 h-4" />
          <span>Create Budget</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-dark-600">Total Budget</p>
              <p className="text-2xl font-bold text-dark-900">{formatCurrencyWithSymbol(totalBudget, 'SAR')}</p>
            </div>
            <div className="p-3 bg-primary-100 rounded-lg">
              <Calculator className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-dark-600">Total Spent</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrencyWithSymbol(totalSpent, 'SAR')}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-dark-600">Remaining</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrencyWithSymbol(totalBudget - totalSpent, 'SAR')}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-dark-600">Utilization</p>
              <p className="text-2xl font-bold text-yellow-600">{utilizationRate.toFixed(1)}%</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
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
              placeholder="Search budgets..."
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
                <option value="approved">Approved</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Budget Cards */}
      <div className="space-y-6">
        {budgets.map((budget) => {
          const utilizationPercentage = (budget.spentAmount / budget.totalAmount) * 100;
          
          return (
            <div key={budget.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-dark-900 mb-2">{budget.project}</h3>
                  <div className="flex items-center space-x-4 text-sm text-dark-600">
                    <span>Total: {formatCurrencyWithSymbol(budget.totalAmount, 'SAR')}</span>
                    <span>Spent: {formatCurrencyWithSymbol(budget.spentAmount, 'SAR')}</span>
                    <span>Remaining: {formatCurrencyWithSymbol(budget.totalAmount - budget.spentAmount, 'SAR')}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[budget.status as keyof typeof statusColors]}`}>
                    {budget.status}
                  </span>
                  <button
                    onClick={() => handleExportPDF(budget)}
                    disabled={isExporting === budget.id}
                    className="flex items-center space-x-1 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isExporting === budget.id ? (
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    <span>Export PDF</span>
                  </button>
                </div>
              </div>

              {/* Overall Progress */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-dark-700">Overall Utilization</span>
                  <span className="text-sm text-dark-600">{utilizationPercentage.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-300 ${
                      utilizationPercentage > 90 ? 'bg-red-500' : 
                      utilizationPercentage > 75 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(utilizationPercentage, 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Category Breakdown */}
              <div>
                <h4 className="text-md font-semibold text-dark-900 mb-4">Budget Categories</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {budget.categories.map((category, index) => {
                    const categoryUtilization = (category.spentAmount / category.allocatedAmount) * 100;
                    
                    return (
                      <div key={index} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-dark-700">{category.name}</span>
                          <span className="text-sm text-dark-600">
                            {formatCurrencyWithSymbol(category.spentAmount, 'SAR')} / {formatCurrencyWithSymbol(category.allocatedAmount, 'SAR')}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              categoryUtilization > 90 ? 'bg-red-500' : 
                              categoryUtilization > 75 ? 'bg-yellow-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${Math.min(categoryUtilization, 100)}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-dark-500 mt-1">
                          {categoryUtilization.toFixed(1)}% utilized
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-dark-500">
                    Created {budget.createdAt.toLocaleDateString()}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                      View Details
                    </button>
                    <button className="text-dark-600 hover:text-dark-800 text-sm">
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}