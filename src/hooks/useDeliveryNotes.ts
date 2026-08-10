import { useState, useEffect } from 'react';
import { api } from '../lib/api';

export function useDeliveryNotes() {
  const [deliveryNotes, setDeliveryNotes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDeliveryNotes();
  }, []);

  const fetchDeliveryNotes = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await api.getDeliveryNotes();
      const formattedNotes = response.deliveryNotes.map((note: any) => ({
        id: note.id,
        noteNumber: note.note_number,
        status: note.status || 'draft',
        customerId: note.customer_id,
        invoiceId: note.invoice_id,
        deliveryDate: new Date(note.delivery_date),
        recipientName: note.recipient_name,
        signature: note.signature,
        notes: note.notes,
        createdAt: new Date(note.created_at),
        updatedAt: new Date(note.updated_at),
        createdBy: note.created_by,
        customerName: note.customer_name,
        createdByName: note.created_by_name,
      }));

      setDeliveryNotes(formattedNotes);
    } catch (error) {
      console.error('Error fetching delivery notes:', error);
      setError('Failed to fetch delivery notes');
    } finally {
      setIsLoading(false);
    }
  };

  const addDeliveryNote = async (note: any) => {
    try {
      setError(null);
      
      const noteData = {
        customer_id: note.customerId,
        invoice_id: note.invoiceId,
        delivery_date: note.deliveryDate.toISOString().split('T')[0],
        recipient_name: note.recipientName,
        signature: note.signature,
        notes: note.notes,
        status: note.status || 'draft',
        items: note.items?.map((item: any) => ({
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          remarks: item.remarks,
        })) || [],
      };

      const response = await api.createDeliveryNote(noteData);
      
      // Refresh delivery notes list
      await fetchDeliveryNotes();
      return response.deliveryNote;
    } catch (error) {
      console.error('Error creating delivery note:', error);
      setError('Failed to create delivery note');
      throw error;
    }
  };

  const updateDeliveryNote = async (id: string, updates: any) => {
    try {
      setError(null);
      
      const updateData: any = {};
      
      if (updates.deliveryDate) updateData.delivery_date = updates.deliveryDate.toISOString().split('T')[0];
      if (updates.recipientName) updateData.recipient_name = updates.recipientName;
      if (updates.signature) updateData.signature = updates.signature;
      if (updates.notes) updateData.notes = updates.notes;
      if (updates.status) updateData.status = updates.status;
      if (updates.items) updateData.items = updates.items.map((item: any) => ({
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        remarks: item.remarks,
      }));

      await api.updateDeliveryNote(id, updateData);
      
      // Refresh delivery notes list
      await fetchDeliveryNotes();
    } catch (error) {
      console.error('Error updating delivery note:', error);
      setError('Failed to update delivery note');
      throw error;
    }
  };

  const deleteDeliveryNote = async (id: string) => {
    try {
      setError(null);
      
      await api.deleteDeliveryNote(id);
      
      // Refresh delivery notes list
      await fetchDeliveryNotes();
    } catch (error) {
      console.error('Error deleting delivery note:', error);
      setError('Failed to delete delivery note');
      throw error;
    }
  };

  return {
    deliveryNotes,
    isLoading,
    error,
    fetchDeliveryNotes,
    addDeliveryNote,
    updateDeliveryNote,
    deleteDeliveryNote,
  };
} 
