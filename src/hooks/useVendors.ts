import { useState, useEffect } from 'react';
import { Vendor } from '../types';
import { api } from '../lib/api';

// Transform backend data to frontend format
const transformVendorData = (backendVendor: any): Vendor => {
  return {
    id: backendVendor.id,
    name: backendVendor.name,
    email: backendVendor.email,
    phone: backendVendor.phone,
    address: backendVendor.address,
    contactPerson: backendVendor.contact_person,
    website: backendVendor.website,
    notes: backendVendor.notes,
    offering: backendVendor.offering,
    status: backendVendor.status,
    createdAt: new Date(backendVendor.created_at),
    updatedAt: new Date(backendVendor.updated_at),
    createdBy: backendVendor.created_by,
  };
};

// Transform frontend data to backend format
const transformToBackendFormat = (frontendVendor: any) => {
  return {
    name: frontendVendor.name,
    email: frontendVendor.email,
    phone: frontendVendor.phone,
    address: frontendVendor.address,
    contact_person: frontendVendor.contactPerson,
    website: frontendVendor.website,
    notes: frontendVendor.notes,
    offering: frontendVendor.offering,
    status: frontendVendor.status,
  };
};

export function useVendors() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchVendors = async () => {
    try {
      setIsLoading(true);
      const response = await api.getVendors({ limit: 1000 });
      const transformedVendors = (response.vendors || []).map(transformVendorData);
      setVendors(transformedVendors);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      setVendors([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const addVendor = async (vendor: Omit<Vendor, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      console.log('Starting vendor creation with data:', vendor);
      const backendData = transformToBackendFormat(vendor);
      console.log('Transformed backend data:', backendData);
      
      const response = await api.createVendor(backendData);
      console.log('API response:', response);
      
      const newVendor = transformVendorData(response.vendor);
      console.log('Transformed new vendor:', newVendor);
      
      setVendors(prev => [...prev, newVendor]);
      return newVendor;
    } catch (error: any) {
      console.error('Error creating vendor:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      throw error;
    }
  };

  const updateVendor = async (id: string, updates: Partial<Vendor>) => {
    try {
      const backendData = transformToBackendFormat(updates);
      const response = await api.updateVendor(id, backendData);
      const updatedVendor = transformVendorData(response.vendor);
      setVendors(prev => prev.map(vendor => 
        vendor.id === id ? updatedVendor : vendor
      ));
      return updatedVendor;
    } catch (error) {
      console.error('Error updating vendor:', error);
      throw error;
    }
  };

  const deleteVendor = async (id: string) => {
    try {
      await api.deleteVendor(id);
      setVendors(prev => prev.filter(vendor => vendor.id !== id));
    } catch (error) {
      console.error('Error deleting vendor:', error);
      throw error;
    }
  };

  return { 
    vendors, 
    isLoading, 
    addVendor, 
    updateVendor, 
    deleteVendor,
    refetch: fetchVendors
  };
}
