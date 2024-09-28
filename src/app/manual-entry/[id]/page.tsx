'use client';
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import OnlineQuoteGenerator from './ManualEntryQuoteGenerator';
import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
import 'react-quill/dist/quill.snow.css';

interface ManualEntryDetail {
  id: number;
  name_or_company: string;
  contact: string;
  business_number: string;
  product: string;
  description: string;
  images: string[];
  created_at: string;
}

const ManualEntryDetailPage: React.FC = () => {
  const params = useParams();
  const [entry, setEntry] = useState<ManualEntryDetail | null>(null);
  const [consultationNotes, setConsultationNotes] = useState('');
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<ManualEntryDetail | null>(null);

  useEffect(() => {
    fetchEntry();
    fetchConsultationNotes();
  }, [params.id]);

  const fetchEntry = async () => {
    const { data, error } = await supabase
      .from('manual_entries')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) {
      console.error('Error fetching entry:', error);
    } else if (data) {
      const processedImages = await Promise.all(
        data.images.map(async (imagePath: string) => {
          if (imagePath.startsWith('http')) {
            return imagePath;
          }
          const {
            data: { publicUrl },
          } = supabase.storage.from('product-images').getPublicUrl(imagePath);
          return publicUrl;
        })
      );

      console.log(processedImages);
      setEntry({ ...data, images: processedImages });
    }
  };

  const fetchConsultationNotes = async () => {
    const { data, error } = await supabase
      .from('manual_entry_notes')
      .select('notes')
      .eq('entry_id', params.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching consultation notes:', error);
    } else if (data) {
      setConsultationNotes(data.notes);
    }
  };

  const saveConsultationNotes = async () => {
    const { error } = await supabase.from('manual_entry_notes').insert({
      entry_id: params.id,
      notes: consultationNotes,
    });

    if (error) {
      console.error('Error saving consultation notes:', error);
    } else {
      alert('상담 내용이 저장되었습니다.');
    }
  };

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setEditForm((prev) => (prev ? { ...prev, [name]: value } : null));
  };

  const startEditing = () => {
    setIsEditing(true);
    setEditForm(entry);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditForm(null);
  };

  const saveEdit = async () => {
    if (!editForm) return;

    const { data, error } = await supabase
      .from('manual_entries')
      .update(editForm)
      .eq('id', params.id);

    if (error) {
      console.error('Error updating entry:', error);
      alert('항목 수정 중 오류가 발생했습니다.');
    } else {
      setEntry(editForm);
      setIsEditing(false);
      alert('항목이 성공적으로 수정되었습니다.');
    }
  };

  if (!entry) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  }

  const supplierData = {
    companyName: '아크릴맛집',
    representative: '윤우섭',
    businessNumber: '382-75-00268',
    address: '서울특별시 중구 을지로33길 33, 청자빌딩 201호',
    contactNumber: '010-2410-2474',
    email: 'official.uone@gmail.com',
  };

  const ordererData = {
    companyName: entry.name_or_company,
    representative: entry.name_or_company,
    businessNumber: entry.business_number,
    address: '-',
    contactNumber: entry.contact,
    email: '-',
    id: entry?.id,
  };

  return (
    <div className="container mx-auto p-4 bg-gray-50 min-h-screen">
      <div className="mb-6 flex justify-between items-center">
        <Link
          href="/manual-entries"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-300 ease-in-out"
        >
          목록으로
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-center text-gray-800">
          수동 입력 상세 정보
        </h1>
        <div className="w-24"></div>
      </div>

      <div className="flex flex-col lg:flex-row space-y-6 lg:space-y-0 lg:space-x-6">
        <div className="w-full lg:w-2/3">
          <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
            {isEditing ? (
              <>
                {/* 수정 모드 UI */}
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    업체/이름
                  </label>
                  <input
                    type="text"
                    name="name_or_company"
                    value={editForm?.name_or_company || ''}
                    onChange={handleEditChange}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    연락처
                  </label>
                  <input
                    type="text"
                    name="contact"
                    value={editForm?.contact || ''}
                    onChange={handleEditChange}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    사업자번호
                  </label>
                  <input
                    type="text"
                    name="business_number"
                    value={editForm?.business_number || ''}
                    onChange={handleEditChange}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    제품
                  </label>
                  <input
                    type="text"
                    name="product"
                    value={editForm?.product || ''}
                    onChange={handleEditChange}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    설명
                  </label>
                  <textarea
                    name="description"
                    value={editForm?.description || ''}
                    onChange={handleEditChange}
                    className="w-full p-2 border rounded"
                    rows={4}
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    이미지
                  </label>
                  <div className="flex flex-wrap">
                    {entry.images.map((imageUrl, index) => (
                      <a
                        key={index}
                        href={imageUrl}
                        download={`product-image-${index + 1}.png`}
                        className="m-2"
                      >
                        <Image
                          src={imageUrl}
                          alt={`Product ${index + 1}`}
                          width={128}
                          height={128}
                          className="w-32 h-32 object-cover rounded transition-transform transform hover:scale-105 hover:shadow-lg"
                          onError={() =>
                            console.error('이미지 로드 오류:', imageUrl)
                          }
                        />
                      </a>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end space-x-2 mt-4">
                  <button
                    onClick={saveEdit}
                    className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                  >
                    저장
                  </button>
                  <button
                    onClick={cancelEditing}
                    className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                  >
                    취소
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* 기존 상세 정보 표시 UI */}
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    업체/이름
                  </label>
                  <p className="text-gray-700 bg-gray-100 p-2 rounded">
                    {entry.name_or_company}
                  </p>
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    연락처
                  </label>
                  <p className="text-gray-700 bg-gray-100 p-2 rounded">
                    {entry.contact}
                  </p>
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    사업자번호
                  </label>
                  <p className="text-gray-700 bg-gray-100 p-2 rounded">
                    {entry.business_number || '-'}
                  </p>
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    제품
                  </label>
                  <p className="text-gray-700 bg-gray-100 p-2 rounded">
                    {entry.product}
                  </p>
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    설명
                  </label>
                  <p className="text-gray-700 bg-gray-100 p-2 rounded">
                    {entry.description}
                  </p>
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    이미지
                  </label>
                  <div className="flex flex-wrap">
                    {entry.images.map((imageUrl, index) => (
                      <a
                        key={index}
                        href={imageUrl}
                        download={`product-image-${index + 1}.png`}
                        className="m-2"
                      >
                        <Image
                          src={imageUrl}
                          alt={`Product ${index + 1}`}
                          width={128}
                          height={128}
                          className="w-32 h-32 object-cover rounded transition-transform transform hover:scale-105 hover:shadow-lg"
                          onError={() =>
                            console.error('이미지 로드 오류:', imageUrl)
                          }
                        />
                      </a>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end mt-4">
                  <button
                    onClick={startEditing}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                  >
                    수정
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="w-full lg:w-1/3">
          <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              상담 내용
            </label>
            <div className="mb-4">
              <ReactQuill
                value={consultationNotes}
                onChange={setConsultationNotes}
                modules={{
                  toolbar: [
                    [{ header: [1, 2, false] }],
                    ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                    [
                      { list: 'ordered' },
                      { list: 'bullet' },
                      { indent: '-1' },
                      { indent: '+1' },
                    ],
                    ['link', 'image'],
                    ['clean'],
                  ],
                }}
                formats={[
                  'header',
                  'bold',
                  'italic',
                  'underline',
                  'strike',
                  'blockquote',
                  'list',
                  'bullet',
                  'indent',
                  'link',
                  'image',
                ]}
                className="h-64 flex flex-col"
              />
            </div>
          </div>

          <div className="mb-4">
            <button
              onClick={saveConsultationNotes}
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full transition duration-300 ease-in-out"
            >
              상담 내용 저장
            </button>
          </div>

          <button
            onClick={() => setShowQuoteModal(true)}
            className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full transition duration-300 ease-in-out"
          >
            견적서 및 거래명세서 생성
          </button>

          {showQuoteModal && (
            <OnlineQuoteGenerator
              supplierData={supplierData}
              ordererData={ordererData}
              onClose={() => setShowQuoteModal(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ManualEntryDetailPage;
