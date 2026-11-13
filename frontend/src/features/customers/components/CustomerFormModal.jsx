import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { FieldRequirementsBox } from '@/components/feedback/FieldRequirementsBox';

export function CustomerFormModal({ isOpen, onClose, onSubmit, isLoading }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    customerType: 'NEW',
    source: 'WEBSITE',
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
    const street = formData.addressLine.trim() || 'Main Street';
    const pin = formData.pincode.trim() || '600001';

    onSubmit({
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone.trim(),
      customerType: formData.customerType,
      segment: formData.customerType,
      source: formData.source,
      addresses: [
        {
          type: 'SHIPPING',
          street,
          addressLine: street,
          city: formData.city.trim() || 'Chennai',
          state: formData.state.trim() || 'Tamil Nadu',
          postalCode: pin,
          pincode: pin,
          country: 'India',
          isDefault: true,
        }
      ]
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
          <div>
            <Input
              label="First Name"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
              placeholder="e.g. Rahul"
            />
            {formData.firstName && (formData.firstName.trim().length < 3 || !/^[A-Za-z\s.]+$/.test(formData.firstName)) && (
              <div className="mt-1.5">
                <FieldRequirementsBox type="name" value={formData.firstName} />
              </div>
            )}
          </div>
          <div>
            <Input
              label="Last Name"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="e.g. Sharma"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Input
              label="Email Address"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="rahul@example.com"
            />
            {formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) && (
              <div className="mt-1.5">
                <FieldRequirementsBox type="email" value={formData.email} />
              </div>
            )}
          </div>
          <div>
            <Input
              label="Phone Number"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              placeholder="+91 98765 43210"
            />
            {formData.phone && formData.phone.replace(/[\s\-\+]/g, '').slice(-10).length !== 10 && (
              <div className="mt-1.5">
                <FieldRequirementsBox type="phone" value={formData.phone} />
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Segment Type</label>
            <select
              name="customerType"
              value={formData.customerType}
              onChange={handleChange}
              className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white focus:outline-hidden focus:border-brand-500 font-medium"
            >
              <option value="NEW">New Customer</option>
              <option value="RETURNING">Returning Customer</option>
              <option value="VIP">VIP Account</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Acquisition Source</label>
            <select
              name="source"
              value={formData.source}
              onChange={handleChange}
              className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white focus:outline-hidden focus:border-brand-500 font-medium"
            >
              <option value="WEBSITE">Website Organic</option>
              <option value="DIRECT_LEAD">Direct Lead / Inbound</option>
              <option value="SOCIAL_MEDIA">Social Media Campaign</option>
              <option value="REFERRAL">Customer Referral</option>
              <option value="MANUAL">Manual Sales Desk</option>
            </select>
          </div>
        </div>

        <Input
          label="Street Address"
          name="addressLine"
          value={formData.addressLine}
          onChange={handleChange}
          placeholder="Building, street, landmark (optional)"
        />

        <div className="grid grid-cols-3 gap-2.5">
          <Input label="City" name="city" value={formData.city} onChange={handleChange} />
          <Input label="State" name="state" value={formData.state} onChange={handleChange} />
          <div>
            <Input label="PIN Code" name="pincode" value={formData.pincode} onChange={handleChange} placeholder="600001" />
            {formData.pincode && !/^\d{6}$/.test(formData.pincode.trim()) && (
              <div className="mt-1.5">
                <FieldRequirementsBox type="pincode" value={formData.pincode} />
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
          <Button variant="outline" size="sm" onClick={onClose} type="button">
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


