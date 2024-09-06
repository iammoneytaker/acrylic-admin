// DataEntryForm.tsx

import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

const DataEntryForm: React.FC = () => {
  const [formData, setFormData] = useState({
    response_date: '',
    participant_number: '',
    name_or_company: '',
    contact: '',
    email: '',
    business_registration_file: '',
    privacy_agreement: false,
    first_time_buyer: false,
    product_description: '',
    product_size: '',
    thickness: '',
    material: '',
    color: '',
    quantity: '',
    desired_delivery: '',
    product_image: '',
    product_drawing: '',
    inquiry: '',
    referral_source: '',
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;
    setFormData((prevData) => ({ ...prevData, [name]: fieldValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('submissions').insert([formData]);
    if (error) {
      console.error('Error inserting data:', error);
      alert('데이터 생성 중 오류가 발생했습니다.');
    } else {
      alert('데이터가 성공적으로 생성되었습니다.');
      setFormData({
        response_date: '',
        participant_number: '',
        name_or_company: '',
        contact: '',
        email: '',
        business_registration_file: '',
        privacy_agreement: false,
        first_time_buyer: false,
        product_description: '',
        product_size: '',
        thickness: '',
        material: '',
        color: '',
        quantity: '',
        desired_delivery: '',
        product_image: '',
        product_drawing: '',
        inquiry: '',
        referral_source: '',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 폼 필드 */}
      <div>
        <label htmlFor="response_date" className="block font-medium">
          응답일시
        </label>
        <input
          type="datetime-local"
          id="response_date"
          name="response_date"
          value={formData.response_date}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      </div>
      {/* 나머지 폼 필드 */}
      <button
        type="submit"
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        생성하기
      </button>
    </form>
  );
};

export default DataEntryForm;
