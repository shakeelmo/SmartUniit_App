// Set API base URL for development
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api';

class ApiService {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    // Get token from localStorage
    this.token = localStorage.getItem('smartuniit_token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('smartuniit_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('smartuniit_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
      console.log('Making API request with token:', this.token.substring(0, 20) + '...');
    } else {
      console.log('Making API request without token');
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    console.log('API request details:', {
      url,
      method: options.method || 'GET',
      headers: Object.keys(headers),
      hasBody: !!options.body,
      body: options.body ? JSON.parse(options.body as string) : null
    });

    try {
      console.log('Starting fetch request to:', url);
      const response = await fetch(url, config);
      
      console.log('API response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        url: response.url
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API error response:', errorData);
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('API success response:', data);
      return data;
    } catch (error: any) {
      console.error('API request failed with details:', {
        error: error,
        message: error.message,
        name: error.name,
        stack: error.stack,
        url: url,
        method: options.method || 'GET'
      });
      throw error;
    }
  }

  // Auth endpoints
  async login(email: string, password: string) {
    return this.request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(email: string, password: string, userData: any) {
    return this.request<{ token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, ...userData }),
    });
  }

  async getProfile() {
    return this.request<{ user: any }>('/auth/profile');
  }

  async updateProfile(data: any) {
    return this.request<{ user: any }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return this.request<{ message: string }>('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  async logout() {
    return this.request<{ message: string }>('/auth/logout', {
      method: 'POST',
    });
  }

  // Customer endpoints
  async getCustomers(params?: any) {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.request<{ customers: any[]; pagination: any }>(`/customers${queryString}`);
  }

  async getCustomer(id: string) {
    return this.request<{ customer: any }>(`/customers/${id}`);
  }

  async createCustomer(data: any) {
    return this.request<{ customer: any }>('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCustomer(id: string, data: any) {
    return this.request<{ customer: any }>(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCustomer(id: string) {
    return this.request<{ message: string }>(`/customers/${id}`, {
      method: 'DELETE',
    });
  }

  // Vendor endpoints
  async getVendors(params?: any) {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.request<{ vendors: any[]; pagination: any }>(`/vendors${queryString}`);
  }

  async getVendor(id: string) {
    return this.request<{ vendor: any }>(`/vendors/${id}`);
  }

  async createVendor(data: any) {
    return this.request<{ vendor: any; message: string }>(`/vendors`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateVendor(id: string, data: any) {
    return this.request<{ vendor: any; message: string }>(`/vendors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteVendor(id: string) {
    return this.request<{ message: string }>(`/vendors/${id}`, {
      method: 'DELETE',
    });
  }

  async exportVendors() {
    const response = await fetch(`${this.baseUrl}/vendors/export/excel`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to export vendors');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vendors-export-${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  async exportCustomers() {
    const response = await fetch(`${this.baseUrl}/customers/export/excel`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to export customers');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers-export-${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  // Project endpoints
  async getProjects(params?: any) {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.request<{ projects: any[]; pagination: any }>(`/projects${queryString}`);
  }

  async getProject(id: string) {
    return this.request<{ project: any }>(`/projects/${id}`);
  }

  async createProject(data: any) {
    return this.request<{ project: any }>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProject(id: string, data: any) {
    return this.request<{ project: any }>(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteProject(id: string) {
    return this.request<{ message: string }>(`/projects/${id}`, {
      method: 'DELETE',
    });
  }

  // Task endpoints
  async getTasks(params?: any) {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.request<{ tasks: any[]; pagination: any }>(`/tasks${queryString}`);
  }

  async getTask(id: string) {
    return this.request<{ task: any }>(`/tasks/${id}`);
  }

  async createTask(data: any) {
    return this.request<{ task: any }>('/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTask(id: string, data: any) {
    return this.request<{ task: any }>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTask(id: string) {
    return this.request<{ message: string }>(`/tasks/${id}`, {
      method: 'DELETE',
    });
  }

  // Proposal endpoints
  async getProposals(params?: any) {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.request<{ proposals: any[]; pagination: any }>(`/proposals${queryString}`);
  }

  async getProposal(id: string) {
    return this.request<{ proposal: any }>(`/proposals/${id}`);
  }

  async createProposal(data: any) {
    return this.request<{ proposal: any }>('/proposals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProposal(id: string, data: any) {
    return this.request<{ proposal: any }>(`/proposals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteProposal(id: string) {
    return this.request<{ message: string }>(`/proposals/${id}`, {
      method: 'DELETE',
    });
  }

  // Quotation endpoints
  async getQuotations(params?: any) {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.request<{ quotations: any[]; pagination: any }>(`/quotations${queryString}`);
  }

  async getQuotation(id: string) {
    return this.request<{ quotation: any }>(`/quotations/${id}`);
  }

  async createQuotation(data: any) {
    return this.request<{ quotation: any }>('/quotations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateQuotation(id: string, data: any) {
    return this.request<{ quotation: any }>(`/quotations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteQuotation(id: string) {
    return this.request<{ message: string }>(`/quotations/${id}`, {
      method: 'DELETE',
    });
  }

  // Invoice endpoints
  async getInvoices(params?: any) {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.request<{ invoices: any[]; pagination: any }>(`/invoices${queryString}`);
  }

  async getInvoice(id: string) {
    return this.request<{ invoice: any }>(`/invoices/${id}`);
  }

  async createInvoice(data: any) {
    return this.request<{ invoice: any }>('/invoices', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateInvoice(id: string, data: any) {
    return this.request<{ invoice: any }>(`/invoices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteInvoice(id: string) {
    return this.request<{ message: string }>(`/invoices/${id}`, {
      method: 'DELETE',
    });
  }

  // Budget endpoints
  async getBudgets(params?: any) {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.request<{ budgets: any[]; pagination: any }>(`/budgets${queryString}`);
  }

  async getBudget(id: string) {
    return this.request<{ budget: any }>(`/budgets/${id}`);
  }

  async createBudget(data: any) {
    return this.request<{ budget: any }>('/budgets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateBudget(id: string, data: any) {
    return this.request<{ budget: any }>(`/budgets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteBudget(id: string) {
    return this.request<{ message: string }>(`/budgets/${id}`, {
      method: 'DELETE',
    });
  }

  // User endpoints (admin only)
  async getUsers(params?: any) {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.request<{ users: any[]; pagination: any }>(`/users${queryString}`);
  }

  async getUser(id: string) {
    return this.request<{ user: any }>(`/users/${id}`);
  }

  async createUser(data: any) {
    return this.request<{ user: any }>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUser(id: string, data: any) {
    return this.request<{ user: any }>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(id: string) {
    return this.request<{ message: string }>(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  // Report endpoints
  async getDashboardStats() {
    return this.request<any>('/reports/dashboard');
  }

  async getProjectProgress() {
    return this.request<{ projects: any[] }>('/reports/projects/progress');
  }

  async getFinancialSummary() {
    return this.request<any>('/reports/financial/summary');
  }

  async getUserActivity() {
    return this.request<any>('/reports/users/activity');
  }

  // Delivery Notes endpoints
  async getDeliveryNotes(params?: any) {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.request<{ deliveryNotes: any[] }>(`/delivery-notes${queryString}`);
  }

  async getDeliveryNote(id: string) {
    return this.request<{ deliveryNote: any }>(`/delivery-notes/${id}`);
  }

  async createDeliveryNote(data: any) {
    return this.request<{ deliveryNote: any }>('/delivery-notes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateDeliveryNote(id: string, data: any) {
    return this.request<{ deliveryNote: any }>(`/delivery-notes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteDeliveryNote(id: string) {
    return this.request<{ message: string }>(`/delivery-notes/${id}`, {
      method: 'DELETE',
    });
  }

  // Settings
  async getCompanySettings() {
    const response = await this.request('/settings/company');
    return response;
  }

  async updateCompanySettings(settings: any) {
    const response = await this.request('/settings/company', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
    return response;
  }

  // Expenses endpoints
  async getExpenses(params?: string) {
    const queryString = params ? `?${params}` : '';
    return this.request<{ expenses: any[]; pagination: any }>(`/expenses${queryString}`);
  }

  async getExpense(id: string) {
    return this.request<{ expense: any }>(`/expenses/${id}`);
  }

  async createExpense(data: any) {
    return this.request<{ expense: any }>('/expenses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateExpense(id: string, data: any) {
    return this.request<{ expense: any }>(`/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteExpense(id: string) {
    return this.request<{ message: string }>(`/expenses/${id}`, {
      method: 'DELETE',
    });
  }

  async getExpenseCategories(type?: string) {
    const queryString = type ? `?type=${type}` : '';
    return this.request<{ categories: any[] }>(`/expenses/categories/all${queryString}`);
  }

  async getCashFlowSummary(params?: string) {
    const queryString = params ? `?${params}` : '';
    return this.request<any>(`/expenses/reports/cash-flow${queryString}`);
  }

  async exportExpenses(params?: string) {
    const queryString = params ? `?${params}` : '';
    return this.request<any>(`/expenses/export/excel${queryString}`);
  }
}

export const api = new ApiService(API_BASE_URL); 