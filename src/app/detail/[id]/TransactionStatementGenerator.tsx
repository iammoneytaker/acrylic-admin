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

interface TransactionItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  tax: number;
}

interface TransactionStatementGeneratorProps {
  supplierData: SupplierData;
  ordererData: OrdererData;
  onClose: () => void;
}

const formatNumber = (num: number): string => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

const TransactionStatementGenerator: React.FC<
  TransactionStatementGeneratorProps
> = ({ supplierData, ordererData, onClose }) => {
  const [transactionItems, setTransactionItems] = useState<TransactionItem[]>(
    []
  );
  const [newItem, setNewItem] = useState<
    Omit<TransactionItem, 'amount' | 'tax'>
  >({
    productName: '',
    quantity: 0,
    unitPrice: 0,
  });
  const [transactionDate, setTransactionDate] = useState<string>(
    new Date()
      .toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
      .replace(/\. /g, '.')
  );
  const [savedStatementUrl, setSavedStatementUrl] = useState<string | null>(
    null
  );

  const addItem = () => {
    if (newItem.productName && newItem.quantity > 0 && newItem.unitPrice > 0) {
      const amount = newItem.quantity * newItem.unitPrice;
      const tax = Math.round(amount * 0.1);
      setTransactionItems([...transactionItems, { ...newItem, amount, tax }]);
      setNewItem({ productName: '', quantity: 0, unitPrice: 0 });
    }
  };

  const calculateTotal = () => {
    return transactionItems.reduce(
      (sum, item) => sum + item.amount + item.tax,
      0
    );
  };

  const generateStatement = async () => {
    const statementElement = document.getElementById(
      'transaction-statement-container'
    );
    if (statementElement) {
      const canvas = await html2canvas(statementElement);
      const imgData = canvas.toDataURL('image/png');

      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(
          `<img src="${imgData}" alt="Transaction Statement" />`
        );
        const downloadLink = newWindow.document.createElement('a');
        downloadLink.href = imgData;
        downloadLink.download = 'transaction_statement.png';
        downloadLink.textContent = '거래명세표 다운로드';
        newWindow.document.body.appendChild(downloadLink);
      }
    }
  };

  const modalContent = (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 shadow-lg rounded-md bg-white">
        <div className="mt-3 text-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            거래명세표 생성
          </h3>
          <div className="mt-2 px-7 py-3">
            <div className="mb-4 space-y-2">
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
                  단가
                </label>
                <input
                  type="number"
                  value={newItem.unitPrice || ''}
                  onChange={(e) =>
                    setNewItem({
                      ...newItem,
                      unitPrice: parseInt(e.target.value) || 0,
                    })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  placeholder="단가를 입력하세요"
                />
              </div>
              <button
                onClick={addItem}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                항목 추가
              </button>
            </div>
            <div
              id="transaction-statement-container"
              className="bg-white p-8 shadow-lg"
            >
              <h1 className="text-3xl font-bold mb-6 text-center">
                거래명세표
              </h1>
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="border p-4">
                  <h2 className="font-bold mb-2">공급자</h2>
                  <p>상호: {supplierData.companyName}</p>
                  <p>성명: {supplierData.representative}</p>
                  <p>사업자등록번호: {supplierData.businessNumber}</p>
                  <p>주소: {supplierData.address}</p>
                  <p>업태: </p>
                  <p>종목: </p>
                  <p>전화: {supplierData.contactNumber}</p>
                  <p>이메일: {supplierData.email}</p>
                </div>
                <div className="border p-4">
                  <h2 className="font-bold mb-2">공급받는자</h2>
                  <p>상호: {ordererData.companyName}</p>
                  <p>성명: {ordererData.representative}</p>
                  <p>사업자등록번호: </p>
                  <p>주소: </p>
                  <p>업태: </p>
                  <p>종목: </p>
                  <p>전화: {ordererData.contactNumber}</p>
                  <p>이메일: {ordererData.email}</p>
                </div>
              </div>
              <div className="mb-6">
                <p>거래일자: {transactionDate}</p>
                <p>
                  공급가액:{' '}
                  {formatNumber(
                    calculateTotal() -
                      transactionItems.reduce((sum, item) => sum + item.tax, 0)
                  )}
                  원
                </p>
                <p>
                  세액:{' '}
                  {formatNumber(
                    transactionItems.reduce((sum, item) => sum + item.tax, 0)
                  )}
                  원
                </p>
                <p>합계금액: {formatNumber(calculateTotal())}원</p>
              </div>
              <table className="w-full border-collapse border">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border p-2">No</th>
                    <th className="border p-2">품목</th>
                    <th className="border p-2">규격</th>
                    <th className="border p-2">수량</th>
                    <th className="border p-2">단가</th>
                    <th className="border p-2">공급가액</th>
                    <th className="border p-2">세액</th>
                  </tr>
                </thead>
                <tbody>
                  {transactionItems.map((item, index) => (
                    <tr key={index}>
                      <td className="border p-2 text-center">{index + 1}</td>
                      <td className="border p-2">{item.productName}</td>
                      <td className="border p-2"></td>
                      <td className="border p-2 text-right">
                        {formatNumber(item.quantity)}
                      </td>
                      <td className="border p-2 text-right">
                        {formatNumber(item.unitPrice)}
                      </td>
                      <td className="border p-2 text-right">
                        {formatNumber(item.amount)}
                      </td>
                      <td className="border p-2 text-right">
                        {formatNumber(item.tax)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-6">
                <p>합계: {formatNumber(calculateTotal())}원</p>
              </div>
            </div>
            <button
              onClick={generateStatement}
              className="mt-4 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            >
              거래명세표 이미지 생성 및 저장
            </button>
            {savedStatementUrl && (
              <div className="mt-4">
                <h3 className="font-bold">저장된 거래명세표</h3>
                <img
                  src={savedStatementUrl}
                  alt="Saved Transaction Statement"
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

export default TransactionStatementGenerator;
