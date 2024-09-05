import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import html2canvas from 'html2canvas';
import { supabase } from '../../../lib/supabaseClient';

interface SupplierData {
  companyName: string;
  representative: string;
  businessNumber: string;
  address: string;
  contactNumber: string;
  email: string;
}

interface OrdererData {
  companyName: string;
  representative: string;
  contactNumber: string;
  email: string;
}

interface QuoteItem {
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

interface OnlineQuoteGeneratorProps {
  supplierData: SupplierData;
  ordererData: OrdererData;
  onClose: () => void;
}

const formatNumber = (num: number): string => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

const OnlineQuoteGenerator: React.FC<OnlineQuoteGeneratorProps> = ({
  supplierData,
  ordererData,
  onClose,
}) => {
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
  const [newItem, setNewItem] = useState<Omit<QuoteItem, 'total'>>({
    productName: '',
    quantity: 0,
    price: 0,
  });
  const [quoteDate, setQuoteDate] = useState<string>(
    new Date()
      .toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
      .replace(/\. /g, '.')
  );
  const [businessNumber, setBusinessNumber] = useState<string>('');
  const [showBusinessNumber, setShowBusinessNumber] = useState<boolean>(false);
  const [savedQuoteUrl, setSavedQuoteUrl] = useState<string | null>(null);

  const addItem = () => {
    if (newItem.productName && newItem.quantity > 0 && newItem.price > 0) {
      setQuoteItems([
        ...quoteItems,
        { ...newItem, total: newItem.quantity * newItem.price },
      ]);
      setNewItem({ productName: '', quantity: 0, price: 0 });
    }
  };

  const calculateTotal = (): number => {
    return quoteItems.reduce((sum, item) => sum + item.total, 0);
  };

  const generateQuote = async () => {
    const quoteElement = document.getElementById('quote-container');
    if (quoteElement) {
      const canvas = await html2canvas(quoteElement);
      const imgData = canvas.toDataURL('image/png');

      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(`<img src="${imgData}" alt="Quote" />`);
        const downloadLink = newWindow.document.createElement('a');
        downloadLink.href = imgData;
        downloadLink.download = 'online_quote.png';
        downloadLink.textContent = '견적서 다운로드';
        newWindow.document.body.appendChild(downloadLink);
      }
    }
  };

  const modalContent = (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 shadow-lg rounded-md bg-white">
        <div className="mt-3 text-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            온라인 견적서 생성
          </h3>
          <div className="mt-2 px-7 py-3">
            <div className="mb-4 space-y-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  사업자 등록번호 (선택사항)
                </label>
                <input
                  type="text"
                  value={businessNumber}
                  onChange={(e) => setBusinessNumber(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  placeholder="사업자 등록번호를 입력하세요"
                />
                <button
                  onClick={() => setShowBusinessNumber(true)}
                  className="mt-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  사업자등록번호 추가
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  제품명
                </label>
                <input
                  type="text"
                  value={newItem.productName}
                  onChange={(e) =>
                    setNewItem({ ...newItem, productName: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  placeholder="제품명을 입력하세요"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  수량
                </label>
                <input
                  type="number"
                  value={newItem.quantity || ''}
                  onChange={(e) =>
                    setNewItem({
                      ...newItem,
                      quantity: parseInt(e.target.value) || 0,
                    })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  placeholder="수량을 입력하세요"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  공급가격
                </label>
                <input
                  type="number"
                  value={newItem.price || ''}
                  onChange={(e) =>
                    setNewItem({
                      ...newItem,
                      price: parseInt(e.target.value) || 0,
                    })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  placeholder="공급가격을 입력하세요"
                />
              </div>
              <button
                onClick={addItem}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                항목 추가
              </button>
            </div>
            <div id="quote-container" className="bg-white p-8 shadow-lg">
              <div className="flex justify-between mb-6">
                <h1 className="text-3xl font-bold">온라인견적서</h1>
                <div>
                  <p>견적일자: {quoteDate}</p>
                  <p>
                    견적금액: {formatNumber(calculateTotal() * 1.1)}원
                    (부가세포함)
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="border">
                  <div className="bg-gray-100 px-4 py-2 font-bold">
                    공급자 정보
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="font-bold">상호명</div>
                      <div className="col-span-2">
                        {supplierData.companyName}
                      </div>
                      <div className="font-bold">대표자</div>
                      <div className="col-span-2">
                        {supplierData.representative}
                      </div>
                      <div className="font-bold">사업자번호</div>
                      <div className="col-span-2">
                        {supplierData.businessNumber}
                      </div>
                      <div className="font-bold">주소</div>
                      <div className="col-span-2">{supplierData.address}</div>
                      <div className="font-bold">대표전화</div>
                      <div className="col-span-2">
                        {supplierData.contactNumber}
                      </div>
                      <div className="font-bold">e-mail</div>
                      <div className="col-span-2">{supplierData.email}</div>
                    </div>
                  </div>
                </div>

                <div className="border">
                  <div className="bg-gray-100 px-4 py-2 font-bold">
                    주문자 정보
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="font-bold">상호명</div>
                      <div className="col-span-2">
                        {ordererData.companyName}
                      </div>
                      <div className="font-bold">대표자</div>
                      <div className="col-span-2">
                        {ordererData.representative}
                      </div>
                      {showBusinessNumber && (
                        <>
                          <div className="font-bold">사업자번호</div>
                          <div className="col-span-2">{businessNumber}</div>
                        </>
                      )}
                      <div className="font-bold">연락처</div>
                      <div className="col-span-2">
                        {ordererData.contactNumber}
                      </div>
                      <div className="font-bold">이메일</div>
                      <div className="col-span-2">{ordererData.email}</div>
                    </div>
                  </div>
                </div>
              </div>

              <table className="min-w-full bg-white border mb-6">
                <thead>
                  <tr>
                    <th className="px-4 py-2 border">번호</th>
                    <th className="px-4 py-2 border">제품명</th>
                    <th className="px-4 py-2 border">수량</th>
                    <th className="px-4 py-2 border">단가</th>
                    <th className="px-4 py-2 border">합계</th>
                  </tr>
                </thead>
                <tbody>
                  {quoteItems.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 border text-center">
                        {index + 1}
                      </td>
                      <td className="px-4 py-2 border">{item.productName}</td>
                      <td className="px-4 py-2 border text-right">
                        {formatNumber(item.quantity)}
                      </td>
                      <td className="px-4 py-2 border text-right">
                        {formatNumber(item.price)}원
                      </td>
                      <td className="px-4 py-2 border text-right">
                        {formatNumber(item.total)}원
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="text-right mb-6">
                <p>공급가액: {formatNumber(calculateTotal())}원</p>
                <p>부가세(10%): {formatNumber(calculateTotal() * 0.1)}원</p>
                <p className="font-bold text-xl">
                  총 금액: {formatNumber(calculateTotal() * 1.1)}원
                </p>
              </div>

              <div className="mb-6">
                <p>© 견적유효 : 발행일로부터 7일간</p>
                <p>
                  © 납기조건 : 통상적으로 입금 후 2주일의 제작기간을 잡고
                  있습니다.
                </p>
                <p>© 특이사항 : 배송비 별도입니다.</p>
              </div>

              <div>
                <h4 className="font-bold mb-2">아크릴맛집 입금계좌안내</h4>
                <p>예금주 - 윤우섭</p>
                <p>국민은행 : 015-25-0043-448</p>
              </div>
            </div>
            <button
              onClick={generateQuote}
              className="mt-4 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            >
              견적서 이미지 생성 및 저장
            </button>
            {savedQuoteUrl && (
              <div className="mt-4">
                <h3 className="font-bold">저장된 견적서</h3>
                <img
                  src={savedQuoteUrl}
                  alt="Saved Quote"
                  className="mt-2 max-w-full"
                />
              </div>
            )}
          </div>
        </div>
        <div className="items-center px-4 py-3">
          <button
            id="ok-btn"
            className="px-4 py-2 bg-blue-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
            onClick={onClose}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default OnlineQuoteGenerator;
