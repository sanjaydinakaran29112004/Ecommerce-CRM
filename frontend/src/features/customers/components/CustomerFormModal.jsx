import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export function CustomerFormModal({ isOpen, onClose, onSubmit, isLoading }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    customerType: 'NEW',
    source: 'Website Organic',
    addressLine: '',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '',
  });

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      customerCode: `CUST-${Math.floor(10000 + Math.random() * 90000)}`,
      totalSpent: 0,
      ordersCount: 0,
      status: 'ACTIVE',
      addresses: [
        {
          type: 'SHIPPING',
          addressLine: formData.addressLine,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          country: 'India',
          isDefault: true,
        }
      ],
      createdAt: new Date().toISOString(),
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Customer Profile"
      description="Create a centralized customer profile with contact information and addresses"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="First Name"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
            placeholder="e.g. Rahul"
          />
          <Input
            label="Last Name"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            placeholder="e.g. Sharma"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Email Address"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder="rahul@example.com"
          />
          <Input
            label="Phone Number"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
            placeholder="+91 98765 43210"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Segment Type</label>
            <select
              name="customerType"
              value={formData.customerType}
              onChange={handleChange}
              className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white focus:outline-hidden focus:border-brand-500"
            >
              <option value="NEW">New Customer</option>
              <option value="RETURNING">Returning Customer</option>
              <option value="VIP">VIP Account</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Acquisition Source</label>
            <select
              name="source"
              value={formData.source}
              onChange={handleChange}
              className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white focus:outline-hidden focus:border-brand-500"
            >
              <option value="Website Organic">Website Organic</option>
              <option value="Google Ads">Google Ads</option>
              <option value="Instagram Campaign">Instagram Campaign</option>
              <option value="Referral">Referral</option>
              <option value="Wholesale Inquiry">Wholesale Inquiry</option>
            </select>
          </div>
        </div>

        <Input
          label="Street Address"
          name="addressLine"
          value={formData.addressLine}
          onChange={handleChange}
          placeholder="Building, street, landmark"
        />

        <div className="grid grid-cols-3 gap-2.5">
          <Input label="City" name="city" value={formData.city} onChange={handleChange} />
          <Input label="State" name="state" value={formData.state} onChange={handleChange} />
          <Input label="PIN Code" name="pincode" value={formData.pincode} onChange={handleChange} placeholder="600001" />
        </div>

        <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isLoading}>
            Create Customer Profile
          </Button>
        </div>
      </form>
    </Modal>
  );
}

