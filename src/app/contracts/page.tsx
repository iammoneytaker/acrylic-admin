'use client';
import React, { useState, useRef } from 'react';
import Link from 'next/link';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import Image from 'next/image';

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

      <div className="flex flex-col md:flex-row gap-6">
        {/* 입력 폼 섹션 */}
        <div className="w-full md:w-1/2">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-4">계약 정보 입력</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  발주자 성명
                </label>
                <input
                  type="text"
                  value={contractData.clientName}
                  onChange={(e) => handleInputChange(e, 'clientName')}
                  className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                  placeholder="발주자 성명을 입력하세요"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  샘플 제작 비용
                </label>
                <input
                  type="text"
                  value={contractData.sampleCost}
                  onChange={(e) => handleInputChange(e, 'sampleCost')}
                  className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                  placeholder="비용을 입력하세요"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  발주자 서명
                </label>
                <input
                  type="text"
                  value={contractData.signature.client}
                  onChange={(e) => handleInputChange(e, 'signature', 'client')}
                  className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                  placeholder="서명을 입력하세요"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  날짜
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={contractData.signature.date.year}
                    onChange={(e) => handleInputChange(e, 'signature', 'date', 'year')}
                    className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                    placeholder="년"
                  />
                  <input
                    type="text"
                    value={contractData.signature.date.month}
                    onChange={(e) => handleInputChange(e, 'signature', 'date', 'month')}
                    className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                    placeholder="월"
                  />
                  <input
                    type="text"
                    value={contractData.signature.date.day}
                    onChange={(e) => handleInputChange(e, 'signature', 'date', 'day')}
                    className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                    placeholder="일"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 미리보기 섹션 */}
        <div className="w-full md:w-1/2">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">미리보기</h2>
              <div className="space-x-2">
                <button
                  onClick={exportToPDF}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition duration-300 ease-in-out"
                >
                  PDF 저장
                </button>
                <button
                  onClick={exportToJPG}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition duration-300 ease-in-out"
                >
                  이미지 저장
                </button>
              </div>
            </div>
            <div
              ref={contractRef}
              className="bg-white border p-8 rounded-lg shadow min-h-[297mm] w-[210mm] mx-auto relative"
              style={{ fontSize: '10pt' }}
            >
              {/* 워터마크 로고 */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative w-[80%] h-[80%]">
                  <Image
                    src="/logo.png"
                    alt="Watermark"
                    fill
                    style={{ 
                      objectFit: 'contain',
                      opacity: 0.1,
                      filter: 'grayscale(100%)'
                    }}
                  />
                </div>
              </div>

              {/* 계약서 내용 */}
              <h1 className="text-center text-2xl font-bold mb-8">아크릴맛집 샘플 제작 및 추후 제작 안내 및 계약서</h1>
              
              <div className="mb-8">
                <h2 className="text-xl font-bold mb-4">계약 당사자</h2>
                <p className="mb-2">1. 발주자: {contractData.clientName || '_______'}</p>
                <p>2. 제작자: 아크릴맛집 (사업자등록번호: 382-75-00268 / 대표자: 윤우섭)</p>
              </div>

              <div className="mb-6">
                <h2 className="text-lg font-bold mb-2">제1조 목적</h2>
                <p>
                  본 계약서는 아크릴 샘플 제작 및 추후 제작과 관련된 조건 및 비용, 환불 및 반품 정책 등에 대해 
                  명확히 안내하고자 작성되었습니다.
                </p>
              </div>

              <div className="mb-6">
                <h2 className="text-lg font-bold mb-2">제2조 샘플 제작 및 비용</h2>
                <p className="mb-2">1. 샘플 제작 비용은 {contractData.sampleCost || '_________________'}원입니다.</p>
                <p className="ml-4 mb-2">- 해당 금액은 초기 세팅 비용 및 제작 공정에 필요한 재료비를 포함합니다.</p>
                <p>2. 샘플 제작은 1개 기준으로 진행되며, 발주자는 샘플을 확인 후 추후 제작 여부를 결정할 수 있습니다.</p>
              </div>

              <div className="mb-6">
                <h2 className="text-lg font-bold mb-2">제3조 추후 제작 시 샘플 비용 공제</h2>
                <p className="mb-2">1. 샘플 제작 후, 협의된 개수로 추후 제작 계약이 체결될 경우, 추후 제작 총비용에서 샘플 제작 비용 중 일부 금액을 공제합니다.</p>
                <p className="ml-4 mb-2">- 공제 금액은 추후 제작 규모 및 협의 내용에 따라 결정됩니다.</p>
                <p>2. 추후 공제되는 금액은 사전에 양측 합의하에 결정됩니다.</p>
              </div>

              <div className="mb-6">
                <h2 className="text-lg font-bold mb-2">제4조 환불 및 반품 정책</h2>
                <p className="mb-2">1. 샘플 제작은 주문 제작 특성상 환불이 불가합니다.</p>
                <p className="mb-2">2. 제작된 샘플에 하자가 있을 경우, 제작일로부터 7일 이내에 하자를 증빙할 수 있는 자료를 제공하면 검토 후 재제작 또는 일부 환불을 진행합니다.</p>
                <p className="mb-2">3. 제작 후 발생하는 반품은 아래 조건을 따릅니다:</p>
                <p className="ml-4 mb-2">- 단순 변심에 의한 반품은 불가.</p>
                <p className="ml-4">- 제품 하자가 있을 경우, 수령일로부터 14일 이내에 증빙 자료를 제출해야 합니다.</p>
              </div>

              <div className="mb-6">
                <h2 className="text-lg font-bold mb-2">제5조 배송 안내</h2>
                <p className="mb-2">1. 배송은 착불로 진행됩니다.</p>
                <p>2. 제작 완료 후 배송 관련 사항은 협의하여 진행됩니다.</p>
              </div>

              <div className="mb-6">
                <h2 className="text-lg font-bold mb-2">제6조 기타 사항</h2>
                <p className="mb-2">1. 본 계약 내용에 동의하지 않을 경우, 샘플 제작이 진행되기 어렵습니다.</p>
                <p className="mb-2">2. 기타 문의사항은 아래 연락처를 통해 문의 바랍니다.</p>
                <p className="ml-4">- 연락처: 010-2410-2474</p>
              </div>

              <div className="mt-12">
                <p className="text-center mb-8">계약 체결</p>
                <p className="mb-4">본 계약 내용에 동의하며, 계약을 체결합니다.</p>
                
                <div className="space-y-4 mb-8">
                  <p>- 발주자: {contractData.signature.client || '_________________________'} (서명/도장)</p>
                  <p>- 제작자: {contractData.signature.producer} (서명/도장)</p>
                </div>

                <p className="text-center">
                  작성일: {contractData.signature.date.year || '_______'}년 {' '}
                  {contractData.signature.date.month || '_______'}월 {' '}
                  {contractData.signature.date.day || '_______'}일
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractsPage;
