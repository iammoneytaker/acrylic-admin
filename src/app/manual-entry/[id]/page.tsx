'use client';
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import OnlineQuoteGenerator from './ManualEntryQuoteGenerator';
import Image from 'next/image';

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

  if (!entry) {
    return <div>Loading...</div>;
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
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">수동 입력 상세 정보</h1>
      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            업체/이름
          </label>
          <p>{entry.name_or_company}</p>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            연락처
          </label>
          <p>{entry.contact}</p>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            사업자번호
          </label>
          <p>{entry.business_number || '-'}</p>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            제품
          </label>
          <p>{entry.product}</p>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            설명
          </label>
          <p>{entry.description}</p>
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
              >
                <Image
                  src={imageUrl}
                  alt={`Product ${index + 1}`}
                  width={128}
                  height={128} // 레이아웃에 맞게 크기 조정
                  className="w-32 h-32 object-cover m-2 transition-transform transform hover:scale-105 hover:shadow-lg"
                  onError={() => console.error('이미지 로드 오류:', imageUrl)}
                />
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2">
          상담 내용
        </label>
        <textarea
          value={consultationNotes}
          onChange={(e) => setConsultationNotes(e.target.value)}
          className="w-full h-32 p-2 border rounded"
        />
        <button
          onClick={saveConsultationNotes}
          className="mt-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          상담 내용 저장
        </button>
      </div>

      <button
        onClick={() => setShowQuoteModal(true)}
        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
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
  );
};

export default ManualEntryDetailPage;
