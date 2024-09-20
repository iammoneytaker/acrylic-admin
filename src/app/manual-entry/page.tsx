'use client';
import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const ManualEntryPage: React.FC = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name_or_company: '',
    contact: '',
    business_number: '',
    product: '',
    description: '',
    images: [] as File[],
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData({ ...formData, images: Array.from(e.target.files) });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 이미지 업로드
    const imageUrls = await Promise.all(
      formData.images.map(async (image, index) => {
        const fileExt = image.name.split('.').pop();
        const fileName = `${Date.now()}_${index}.${fileExt}`;
        const { data, error } = await supabase.storage
          .from('product-images')
          .upload(fileName, image);

        if (error) {
          console.error('Error uploading image:', error);
          return null;
        }

        // 업로드된 이미지의 public URL 가져오기
        const { data: publicUrlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName);

        return publicUrlData?.publicUrl || null;
      })
    );
    // 데이터베이스에 저장
    const { data, error } = await supabase.from('manual_entries').insert({
      ...formData,
      images: imageUrls.filter(Boolean),
    });

    if (error) {
      console.error('Error inserting data:', error);
      alert('데이터 저장 중 오류가 발생했습니다.');
    } else {
      alert('데이터가 성공적으로 저장되었습니다.');
      router.push('/manual-entries');
    }
  };

  return (
    <div className="container mx-auto p-4 bg-gray-50 min-h-screen">
      <div className="mb-6 flex justify-between items-center">
        <Link
          href="/"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-300 ease-in-out"
        >
          홈으로
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-center text-gray-800">
          직접 입력
        </h1>
        <div className="w-24"></div>
      </div>
      <form
        onSubmit={handleSubmit}
        className="space-y-6 bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              업체 또는 이름
            </label>
            <input
              type="text"
              name="name_or_company"
              value={formData.name_or_company}
              onChange={handleInputChange}
              required
              className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              전화번호
            </label>
            <input
              type="tel"
              name="contact"
              value={formData.contact}
              onChange={handleInputChange}
              required
              className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            사업자번호 (선택)
          </label>
          <input
            type="text"
            name="business_number"
            value={formData.business_number}
            onChange={handleInputChange}
            className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            제품
          </label>
          <input
            type="text"
            name="product"
            value={formData.product}
            onChange={handleInputChange}
            required
            className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            만들어야 할 것
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            required
            rows={4}
            className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            이미지 업로드
          </label>
          <input
            type="file"
            onChange={handleFileChange}
            multiple
            className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-300 ease-in-out"
          >
            저장
          </button>
        </div>
      </form>
    </div>
  );
};

export default ManualEntryPage;
