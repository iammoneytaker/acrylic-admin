'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';

interface SubmissionDetail {
  [key: string]: any;
}

const labelMap: { [key: string]: string } = {
  response_date: '응답일시',
  participant_number: '참여자',
  name_or_company: '성함 혹은 업체명(*)',
  contact: '연락처(*)',
  email: '이메일 ( 세금계산서 하실 시 필수)',
  business_registration_file: '사업자 등록증 ( 세금계산서 하실 시 필수 )',
  privacy_agreement: '개인정보 수집 동의(*)',
  first_time_buyer: '처음이신가요? 구매한 적 있으신가요?(*)',
  product_description: '주문하려는 상품에 대해 알려주세요:)(*)',
  product_size: '제품의 사이즈를 알려주세요.(*)',
  thickness: '두께를 알려주세요.(*)',
  material: '재료를 알려주세요(*)',
  color: '컬러를 알려주세요.(*)',
  quantity: '수량은 몇개인가요?(*)',
  desired_delivery: '납품은 언제쯤 원하시나요?(*)',
  product_image: '제품을 설명할 수 있는 자료를 올려주세요.( 이미지 )',
  product_drawing: '제품 도면을 올려주세요',
  inquiry: '문의사항을 적어주세요.(*)',
  referral_source:
    '아크릴 맛집을 어느 경로를 통해 오셨는지 알려주시면 감사하겠습니다!(*)',
};

const DetailPage = () => {
  const params = useParams();
  const [submission, setSubmission] = useState<SubmissionDetail | null>(null);

  useEffect(() => {
    const fetchSubmission = async () => {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('id', params.id)
        .single();

      if (error) {
        console.error('Error fetching submission:', error);
      } else {
        setSubmission(data);
      }
    };

    fetchSubmission();
  }, [params.id]);

  if (!submission) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">상세 정보</h1>
      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        {Object.entries(submission).map(([key, value]) => (
          <div key={key} className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              {labelMap[key] || key}
            </label>
            <p className="text-gray-700">{value?.toString() || '-'}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DetailPage;
