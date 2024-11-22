'use client';
import React, { useState, useRef } from 'react';
import Link from 'next/link';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface SignatureDate {
  year: string;
  month: string;
  day: string;
}

interface Signature {
  client: string;
  producer: string;
  date: SignatureDate;
}

interface ContractData {
  clientName: string;
  sampleCost: string;
  signature: Signature;
}

const ContractsPage: React.FC = () => {
  const [contractData, setContractData] = useState<ContractData>({
    clientName: '',
    sampleCost: '',
    signature: {
      client: '',
      producer: '윤우섭',
      date: {
        year: new Date().getFullYear().toString(),
        month: (new Date().getMonth() + 1).toString(),
        day: new Date().getDate().toString(),
      },
    },
  });

  const contractRef = useRef<HTMLDivElement>(null);
  const [previewMode, setPreviewMode] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof ContractData,
    subField?: keyof Signature,
    subSubField?: keyof SignatureDate
  ) => {
    const value = e.target.value;
    
    setContractData((prev) => {
      if (subField && subSubField) {
        return {
          ...prev,
          signature: {
            ...prev.signature,
            date: {
              ...prev.signature.date,
              [subSubField]: value,
            },
          },
        };
      }
      if (subField) {
        return {
          ...prev,
          signature: {
            ...prev.signature,
            [subField]: value,
          },
        };
      }
      return {
        ...prev,
        [field]: value,
      };
    });
  };

  const exportToPDF = async () => {
    if (!contractRef.current) return;

    const canvas = await html2canvas(contractRef.current, {
      scale: 2,
      useCORS: true,
      logging: false,
    });

    const imgData = canvas.toDataURL('image/jpeg', 1.0);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    pdf.save('contract.pdf');
  };

  const exportToJPG = async () => {
    if (!contractRef.current) return;

    const canvas = await html2canvas(contractRef.current, {
      scale: 2,
      useCORS: true,
      logging: false,
    });

    const link = document.createElement('a');
    link.download = 'contract.jpg';
    link.href = canvas.toDataURL('image/jpeg', 1.0);
    link.click();
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
          계약서 만들기
        </h1>
        <div className="w-24"></div>
      </div>

      <div className="flex space-x-4 mb-4">
        <button
          onClick={() => setPreviewMode(false)}
          className={`px-4 py-2 rounded ${
            !previewMode
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          편집
        </button>
        <button
          onClick={() => setPreviewMode(true)}
          className={`px-4 py-2 rounded ${
            previewMode
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          미리보기
        </button>
      </div>

      {!previewMode ? (
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                발주자 (이름/상호)
              </label>
              <input
                type="text"
                value={contractData.clientName}
                onChange={(e) => handleInputChange(e, 'clientName')}
                className="w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                샘플 제작 비용
              </label>
              <input
                type="text"
                value={contractData.sampleCost}
                onChange={(e) => handleInputChange(e, 'sampleCost')}
                className="w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">서명 정보</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    발주자 서명
                  </label>
                  <input
                    type="text"
                    value={contractData.signature.client}
                    onChange={(e) =>
                      handleInputChange(e, 'signature', 'client')
                    }
                    className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    제작자 서명
                  </label>
                  <input
                    type="text"
                    value={contractData.signature.producer}
                    onChange={(e) =>
                      handleInputChange(e, 'signature', 'producer')
                    }
                    className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    년
                  </label>
                  <input
                    type="text"
                    value={contractData.signature.date.year}
                    onChange={(e) =>
                      handleInputChange(e, 'signature', undefined, 'year')
                    }
                    className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    월
                  </label>
                  <input
                    type="text"
                    value={contractData.signature.date.month}
                    onChange={(e) =>
                      handleInputChange(e, 'signature', undefined, 'month')
                    }
                    className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    일
                  </label>
                  <input
                    type="text"
                    value={contractData.signature.date.day}
                    onChange={(e) =>
                      handleInputChange(e, 'signature', undefined, 'day')
                    }
                    className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg p-6">
          <div
            ref={contractRef}
            className="w-[210mm] h-[297mm] mx-auto bg-white p-[20mm] border border-gray-200"
          >
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold mb-4">
                아크릴맛집 샘플 제작 및 추후 제작 계약서
              </h1>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4">계약 당사자</h2>
              <p>1. 발주자: {contractData.clientName}</p>
              <p>
                2. 제작자: 아크릴맛집 (사업자등록번호: 382-75-00268 / 대표자:
                윤우섭)
              </p>
            </div>

            <div className="mb-6">
              <h2 className="text-lg font-bold mb-2">제1조 목적</h2>
              <p>
                본 계약서는 아크릴 샘플 제작 및 추후 제작의 조건, 비용, 환불 및
                반품 정책을 명확히 하기 위해 작성되었습니다.
              </p>
            </div>

            <div className="mb-6">
              <h2 className="text-lg font-bold mb-2">제2조 샘플 제작 및 비용</h2>
              <p>1. 샘플 제작 비용: {contractData.sampleCost} 원 (세팅 및 재료비 포함).</p>
              <p>2. 샘플 1개 제작 후, 발주자는 추후 제작 여부를 결정합니다.</p>
            </div>

            <div className="mb-6">
              <h2 className="text-lg font-bold mb-2">
                제3조 추후 제작 시 샘플 비용 공제
              </h2>
              <p>1. 추후 제작 계약 체결 시, 일부 샘플 비용을 공제합니다.</p>
              <p>2. 공제 금액은 추후 제작 규모 및 협의 내용에 따라 결정됩니다.</p>
            </div>

            <div className="mb-6">
              <h2 className="text-lg font-bold mb-2">제4조 환불 및 반품 정책</h2>
              <p>1. 샘플 제작은 환불 불가.</p>
              <p>
                2. 하자는 제작일로부터 7일 이내, 반품은 수령일로부터 14일 이내 증빙
                자료 제출 시 처리합니다.
              </p>
            </div>

            <div className="mb-6">
              <h2 className="text-lg font-bold mb-2">제5조 배송 안내</h2>
              <p>배송은 착불로 진행하며, 상담과정에서 협의합니다.</p>
            </div>

            <div className="mb-6">
              <h2 className="text-lg font-bold mb-2">제6조 기타 사항</h2>
              <p>1. 계약 미동의 시 샘플 제작 불가.</p>
              <p>2. 문의: 010-2410-2474</p>
            </div>

            <div className="mt-12">
              <p className="text-center mb-4">
                본 계약 내용에 동의하며, 계약을 체결합니다.
              </p>
              <div className="space-y-4">
                <p>- 발주자: {contractData.signature.client} (서명/도장)</p>
                <p>- 제작자: {contractData.signature.producer} (서명/도장)</p>
                <p className="mt-4">
                  작성일: {contractData.signature.date.year}년{' '}
                  {contractData.signature.date.month}월 {contractData.signature.date.day}
                  일
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-4 mt-4">
            <button
              onClick={exportToPDF}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              PDF 다운로드
            </button>
            <button
              onClick={exportToJPG}
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            >
              JPG 다운로드
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractsPage;
