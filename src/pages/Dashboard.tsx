import React from 'react';
import { 
  Building2, 
  UserCheck, 
  ClipboardList, 
  FolderOpen,
  CheckSquare, 
  FileText,
  Receipt,
  BookOpen,
  Calculator,
  TrendingUp,
  Users,
  DollarSign
} from 'lucide-react';
import { StatsCard } from '../components/Dashboard/StatsCard';
import { useAuth } from '../contexts/AuthContext';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { formatCurrencyWithSymbol } from '../utils/format';

export function Dashboard() {
  const { user } = useAuth();
  const { stats, isLoading } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
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
          <h1 className="text-2xl font-bold text-dark-900">
            Welcome back, {user?.name}
          </h1>
          <p className="text-dark-600">Here's what's happening in your business today.</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-dark-600">Today</p>
          <p className="text-lg font-semibold text-dark-900">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Vendors"
          value={stats.vendors.total}
          icon={Building2}
          color="primary"
          trend={{ value: 12, isPositive: true }}
        />
        <StatsCard
          title="Active Customers"
          value={stats.customers.active}
          icon={UserCheck}
          color="success"
          trend={{ value: 8, isPositive: true }}
        />
        <StatsCard
          title="Active Projects"
          value={stats.projects.active}
          icon={FolderOpen}
          color="secondary"
          trend={{ value: 15, isPositive: true }}
        />
        <StatsCard
          title="Pending Tasks"
          value={stats.tasks.todo + stats.tasks.inProgress}
          icon={CheckSquare}
          color="warning"
        />
      </div>

      {/* Secondary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Draft Proposals"
          value={stats.proposals.draft}
          icon={ClipboardList}
          color="primary"
        />
        <StatsCard
          title="Active Quotations"
          value={stats.proposals.submitted}
          icon={FileText}
          color="secondary"
        />
        <StatsCard
          title="Pending Invoices"
          value={stats.invoices.pending}
          icon={Receipt}
          color="warning"
        />
        <StatsCard
          title="Total Revenue"
          value={formatCurrencyWithSymbol(stats.invoices.totalAmount, 'SAR')}
          icon={DollarSign}
          color="success"
          trend={{ value: 23, isPositive: true }}
        />
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-dark-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            <button className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors group">
              <ClipboardList className="w-8 h-8 text-gray-400 group-hover:text-primary-500 mb-2" />
              <span className="text-sm font-medium text-dark-700 group-hover:text-primary-700">
                New Proposal
              </span>
            </button>
            <button className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors group">
              <FolderOpen className="w-8 h-8 text-gray-400 group-hover:text-primary-500 mb-2" />
              <span className="text-sm font-medium text-dark-700 group-hover:text-primary-700">
                Create Project
              </span>
            </button>
            <button className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors group">
              <UserCheck className="w-8 h-8 text-gray-400 group-hover:text-primary-500 mb-2" />
              <span className="text-sm font-medium text-dark-700 group-hover:text-primary-700">
                Add Customer
              </span>
            </button>
            <button className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors group">
              <Receipt className="w-8 h-8 text-gray-400 group-hover:text-primary-500 mb-2" />
              <span className="text-sm font-medium text-dark-700 group-hover:text-primary-700">
                Create Invoice
              </span>
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-dark-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-dark-900">New proposal submitted</p>
                <p className="text-xs text-dark-600">"Smart City IoT Infrastructure" - 2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-dark-900">Project milestone completed</p>
                <p className="text-xs text-dark-600">"Network Security Audit" - 4 hours ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-dark-900">New customer added</p>
                <p className="text-xs text-dark-600">"ARAMCO Digital Solutions" - 1 day ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-dark-900">Invoice payment received</p>
                <p className="text-xs text-dark-600">"INV-2024-001 - $15,000" - 2 days ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Overview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-dark-900 mb-4">Performance Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
            <h4 className="text-lg font-semibold text-dark-900">Revenue Growth</h4>
            <p className="text-2xl font-bold text-green-600">+23%</p>
            <p className="text-sm text-dark-600">vs last quarter</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <h4 className="text-lg font-semibold text-dark-900">Client Satisfaction</h4>
            <p className="text-2xl font-bold text-blue-600">94%</p>
            <p className="text-sm text-dark-600">average rating</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckSquare className="w-8 h-8 text-primary-600" />
            </div>
            <h4 className="text-lg font-semibold text-dark-900">Project Success</h4>
            <p className="text-2xl font-bold text-primary-600">89%</p>
            <p className="text-sm text-dark-600">on-time delivery</p>
          </div>
        </div>
      </div>
    </div>
  );
}