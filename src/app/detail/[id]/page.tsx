'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import dynamic from 'next/dynamic';
import Link from 'next/link';

const OnlineQuoteGenerator = dynamic(
  () => import('./SubmissionQuoteGenerator'),
  { ssr: false }
);

const LinkParser = ({ text }: any) => {
  const linkRegex = /(https?:\/\/[^\s&]+)/g;

  const srcRegex = /&amp;src=/g;

  if (!linkRegex.test(text)) {
    return <React.Fragment>{text}</React.Fragment>;
  }
  // 먼저 전체 텍스트를 &amp;src= 기준으로 나눕니다.
  const decodeAndSplit = (text: string) => {
    return text
      .split(srcRegex)
      .flatMap((part: string) => decodeURIComponent(part).split(linkRegex));
  };

  const parts = decodeAndSplit(text).filter((value) => {
    if (value.trim() == '') return false;
    return true;
  });

  // parts.filter((value) => value !== '');

  return (
    <>
      {parts.map((part: any, index: number) => {
        return (
          <div key={part + index}>
            <a
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 underline hover:text-blue-700 transition-colors duration-300"
            >
              링크{index + 1}
            </a>
          </div>
        );
      })}
    </>
  );
};

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
  const [consultationNotes, setConsultationNotes] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);

  useEffect(() => {
    const fetchSubmission = async () => {
      const { data: submissionData, error: submissionError } = await supabase
        .from('submissions')
        .select('*')
        .eq('id', params.id)
        .single();

      if (submissionError) {
        console.error('Error fetching submission:', submissionError);
      } else {
        setSubmission(submissionData);
      }

      const { data: notesData, error: notesError } = await supabase
        .from('consultation_notes')
        .select('notes')
        .eq('submission_id', params.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (notesError) {
        console.error('Error fetching consultation notes:', notesError);
      } else {
        setConsultationNotes(notesData?.notes || '');
      }
    };

    fetchSubmission();
  }, [params.id]);

  const saveConsultationNotes = async () => {
    const { error } = await supabase.from('consultation_notes').insert({
      submission_id: params.id,
      notes: consultationNotes,
    });

    if (error) {
      console.error('Error saving consultation notes:', error);
    } else {
      alert('상담 내용이 저장되었습니다.');
    }
  };

  const supplierData = {
    companyName: '아크릴맛집',
    representative: '윤우섭',
    businessNumber: '382-75-00268',
    address: ' 서울특별시 을지로33길 31 명신빌딩 1층 101호',
    contactNumber: '010-2410-2474',
    email: 'official.uone@gmail.com',
  };

  const ordererData = {
    companyName: submission?.name_or_company || '',
    representative: submission?.name_or_company || '',
    businessNumber: '-',
    address: '-',
    contactNumber: submission?.contact || '',
    email: submission?.email || '',
    id: submission?.id,
  };

  if (!submission) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  }

  const importantFields = [
    'name_or_company',
    'contact',
    'email',
    'business_registration_file',
    'product_description',
    'thickness',
    'material',
    'product_size',
    'color',
    'quantity',
    'desired_delivery',
    'product_image',
    'product_drawing',
    'inquiry',
  ];

  return (
    <div className="container mx-auto p-4 bg-gray-50 min-h-screen">
      <div className="mb-6 flex justify-between items-center">
        <Link
          href="/"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-300 ease-in-out"
        >
          홈으로
        </Link>
        <h1 className="text-3xl font-bold text-center text-gray-800">
          상세 정보
        </h1>
        <div className="w-24"></div> {/* 오른쪽 여백을 위한 빈 div */}
      </div>
      <div className="flex flex-col lg:flex-row space-y-6 lg:space-y-0 lg:space-x-6">
        <div className="w-full lg:w-2/3">
          <div className="bg-white shadow-lg rounded-lg px-8 pt-6 pb-8 mb-4">
            {Object.entries(submission).map(([key, value]) => (
              <div
                key={key}
                className={`mb-4 ${
                  importantFields.includes(key)
                    ? 'border-l-4 border-blue-500 pl-3'
                    : ''
                }`}
              >
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  {labelMap[key] || key}
                </label>
                <div className="text-gray-700 bg-gray-100 p-2 rounded">
                  {typeof value === 'string' ? (
                    <LinkParser text={value} />
                  ) : (
                    value?.toString() || '-'
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="w-full lg:w-1/3">
          <div className="bg-white shadow-lg rounded-lg px-8 pt-6 pb-8 mb-4">
            <label
              htmlFor="consultationNotes"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              상담 내용
            </label>
            <div className="h-64 mb-4">
              <ReactQuill
                id="consultationNotes"
                theme="snow"
                value={consultationNotes}
                onChange={setConsultationNotes}
              />
            </div>
            <button
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full transition duration-300 ease-in-out"
              onClick={saveConsultationNotes}
            >
              저장
            </button>
          </div>
          <div className="mt-6">
            <button
              className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mb-4 w-full transition duration-300 ease-in-out"
              onClick={() => setShowQuoteModal(!showQuoteModal)}
            >
              {showQuoteModal ? '닫기' : '견적서,명세서 출력'}
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
    </div>
  );
};

export default DetailPage;
