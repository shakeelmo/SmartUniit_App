import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FolderOpen, 
  CheckSquare, 
  Users, 
  Settings,
  BarChart3,
  FileText,
  Building2,
  UserCheck,
  ClipboardList,
  DollarSign,
  Receipt,
  BookOpen,
  Calculator,
  Shield,
  Bell,
  Truck,
  CreditCard,
  X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { PERMISSIONS } from '../../lib/permissions';
import { clsx } from 'clsx';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, permission: null },
  { name: 'Vendors', href: '/vendors', icon: Building2, permission: PERMISSIONS.VENDORS_READ },
  { name: 'Customers', href: '/customers', icon: UserCheck, permission: PERMISSIONS.CUSTOMERS_READ },
  { name: 'Proposals', href: '/proposals', icon: ClipboardList, permission: PERMISSIONS.PROPOSALS_READ },
  { name: 'Projects', href: '/projects', icon: FolderOpen, permission: PERMISSIONS.PROJECTS_READ },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare, permission: PERMISSIONS.TASKS_READ },
  { name: 'Quotations', href: '/quotations', icon: FileText, permission: PERMISSIONS.QUOTATIONS_READ },
  { name: 'Invoices', href: '/invoices', icon: Receipt, permission: PERMISSIONS.INVOICES_READ },
  { name: 'Delivery Notes', href: '/delivery-notes', icon: Truck, permission: PERMISSIONS.DELIVERY_NOTES_READ },
  { name: 'Expenses', href: '/expenses', icon: CreditCard, permission: 'role:superadmin' },
  { name: 'Case Studies', href: '/case-studies', icon: BookOpen, permission: PERMISSIONS.CASE_STUDIES_READ },
  { name: 'Budget', href: '/budget', icon: Calculator, permission: PERMISSIONS.BUDGET_READ },
  { name: 'Reports', href: '/reports', icon: BarChart3, permission: null },
];

const adminNavigation = [
  { name: 'Users', href: '/users', icon: Users, permission: PERMISSIONS.USERS_MANAGE },
  { name: 'Roles & Permissions', href: '/roles', icon: Shield, permission: PERMISSIONS.ROLES_MANAGE },
  { name: 'Notifications', href: '/notifications', icon: Bell, permission: null },
  { name: 'Settings', href: '/settings', icon: Settings, permission: PERMISSIONS.SETTINGS_MANAGE },
];

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const { user, hasPermission } = useAuth();

  const filteredNavigation = navigation.filter(item => {
    if (!item.permission) return true;
    if (item.permission.startsWith('role:')) {
      const role = item.permission.split(':')[1];
      return user?.role === role;
    }
    const [resource, action] = item.permission.split(':');
    return hasPermission(resource, action);
  });

  const filteredAdminNavigation = adminNavigation.filter(item => {
    if (!item.permission) return true;
    // Split permission string like 'users:manage' into ['users', 'manage']
    const [resource, action] = item.permission.split(':');
    return hasPermission(resource, action);
  });

  return (
    <div className="w-64 bg-dark-900 text-white flex flex-col h-full">
      <div className="p-4 border-b border-dark-700 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">SmartUniit Task Flow</h2>
          <p className="text-xs text-gray-400">Business Workflow Management</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden text-gray-300 hover:text-white p-1 rounded hover:bg-dark-800"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {filteredNavigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              clsx(
                'flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-300 hover:bg-dark-800 hover:text-white'
              )
            }
            onClick={onClose}
          >
            <item.icon className="mr-3 h-5 w-5" />
            {item.name}
          </NavLink>
        ))}

        {filteredAdminNavigation.length > 0 && (
          <>
            <div className="border-t border-dark-700 my-4"></div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
              Administration
            </div>
            {filteredAdminNavigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-300 hover:bg-dark-800 hover:text-white'
                  )
                }
                onClick={onClose}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      <div className="p-4 border-t border-dark-700">
        <div className="text-xs text-gray-400">
          © 2024 Smart Universe
        </div>
      </div>
    </div>
  );
}