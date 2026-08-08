import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Customer } from '../types';

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      // Fetch all customers (the API defaults to 10 per page, which hid older records)
      const { customers } = await api.getCustomers({ limit: 1000 });
      setCustomers(customers.map((c: any) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        company: c.company,
        address: c.address,
        notes: c.notes,
        status: c.status,
        createdAt: new Date(c.created_at),
        updatedAt: new Date(c.updated_at),
        createdBy: c.created_by,
      })));
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addCustomer = async (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const { customer: newCustomer } = await api.createCustomer(customer);
      await fetchCustomers();
      return newCustomer;
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  };

  const updateCustomer = async (id: string, updates: Partial<Customer>) => {
    try {
      const updateData: any = {};
      
      if (updates.name) updateData.name = updates.name;
      if (updates.email) updateData.email = updates.email;
      if (updates.phone) updateData.phone = updates.phone;
      if (updates.company) updateData.company = updates.company;
      if (updates.address) updateData.address = updates.address;
      if (updates.notes) updateData.notes = updates.notes;
      if (updates.status) updateData.status = updates.status;

      await api.updateCustomer(id, updateData);
      await fetchCustomers();
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  };

  const deleteCustomer = async (id: string) => {
    try {
      await api.deleteCustomer(id);
      await fetchCustomers();
    } catch (error) {
      console.error('Error deleting customer:', error);
      throw error;
    }
  };

  return {
    customers,
    isLoading,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    refetch: fetchCustomers,
  };
}
