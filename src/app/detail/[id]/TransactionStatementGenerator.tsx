import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import html2canvas from 'html2canvas';
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
  description: string;
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
> = ({ onClose, ordererData }) => {
  const [items, setItems] = useState<TransactionItem[]>([]);
  const [newItem, setNewItem] = useState<
    Omit<TransactionItem, 'amount' | 'tax'>
  >({
    description: '',
    quantity: 0,
    unitPrice: 0,
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

  const addItem = () => {
    if (newItem.description && newItem.quantity > 0 && newItem.unitPrice > 0) {
      const amount =
        parseInt(newItem.quantity.toString().replace(/,/g, '')) *
        parseInt(newItem.unitPrice.toString().replace(/,/g, ''));
      const tax = Math.round(amount * 0.1);
      setItems([
        ...items,
        {
          ...newItem,
          amount,
          tax,
          quantity: parseInt(newItem.quantity.toString().replace(/,/g, '')),
          unitPrice: parseInt(newItem.unitPrice.toString().replace(/,/g, '')),
        },
      ]);
      setNewItem({ description: '', quantity: 0, unitPrice: 0 });
    }
  };

  const calculateSupplyAmount = () => {
    return items.reduce((sum, item) => sum + item.amount, 0);
  };

  const calculateTaxAmount = () => {
    return items.reduce((sum, item) => sum + item.tax, 0);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.amount + item.tax, 0);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof Omit<TransactionItem, 'amount' | 'tax'>
  ) => {
    let value: string | number = e.target.value;
    if (field === 'quantity' || field === 'unitPrice') {
      value = value.replace(/[^0-9]/g, '');
    }
    setNewItem({ ...newItem, [field]: value });
  };

  const generateStatement = async () => {
    const statementElement = document.getElementById('transaction-statement');
    if (statementElement) {
      const canvas = await html2canvas(statementElement);
      const imgData = canvas.toDataURL('image/png');
      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(
          `<img src="${imgData}" alt="Transaction Statement" />`
        );
      }
    }
  };

  const modalContent = (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="mt-2 px-7 py-3">
            <div className="mb-4 space-y-2">
              <label
                htmlFor="description"
                className="block text-gray-700 font-bold mb-2"
              >
                품목
              </label>
              <input
                id="description"
                type="text"
                value={newItem.description}
                onChange={(e) => handleInputChange(e, 'description')}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
              <label
                htmlFor="quantity"
                className="block text-gray-700 font-bold mb-2"
              >
                수량
              </label>
              <input
                id="quantity"
                type="text"
                value={newItem.quantity.toLocaleString()}
                onChange={(e) => handleInputChange(e, 'quantity')}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
              <label
                htmlFor="unitPrice"
                className="block text-gray-700 font-bold mb-2"
              >
                단가
              </label>
              <input
                id="unitPrice"
                type="text"
                value={newItem.unitPrice.toLocaleString()}
                onChange={(e) => handleInputChange(e, 'unitPrice')}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
              <button
                onClick={addItem}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                항목 추가
              </button>
            </div>
            <div
              id="transaction-statement"
              className="border border-gray-300 p-4"
            >
              <div className="border-2 border-red-500 p-4">
                <h1 className="text-2xl font-bold text-center text-red-500 mb-4">
                  거래명세표
                </h1>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p>{ordererData.companyName} 귀하</p>
                    <p>거래일: {quoteDate}</p>
                    <p>공급가액: {formatNumber(calculateSupplyAmount())}</p>
                    <p>세액: {formatNumber(calculateTaxAmount())}</p>
                    <p>합계금액: {formatNumber(calculateTotal())}</p>
                  </div>
                  <div>
                    <p>등록번호: </p>
                    <p>상호: 아크릴맛집</p>
                    <p>성명: 윤우섭</p>
                    <p>사업장: 서울특별시 중구 을지로33길 33, 청자빌딩 201호</p>
                    <p>업태: 제조업</p>
                    <p>종목: 아크릴</p>
                    <p>E-mail: official.uone@gmail.com</p>
                  </div>
                </div>
                <table className="w-full border-collapse border border-gray-500">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-500 p-2">No</th>
                      <th className="border border-gray-500 p-2">품목</th>
                      <th className="border border-gray-500 p-2">규격</th>
                      <th className="border border-gray-500 p-2">수량</th>
                      <th className="border border-gray-500 p-2">단가</th>
                      <th className="border border-gray-500 p-2">공급가액</th>
                      <th className="border border-gray-500 p-2">세액</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={index}>
                        <td className="border border-gray-500 p-2 text-center">
                          {index + 1}
                        </td>
                        <td className="border border-gray-500 p-2">
                          {item.description}
                        </td>
                        <td className="border border-gray-500 p-2"></td>
                        <td className="border border-gray-500 p-2 text-right">
                          {formatNumber(item.quantity)}
                        </td>
                        <td className="border border-gray-500 p-2 text-right">
                          {formatNumber(item.unitPrice)}
                        </td>
                        <td className="border border-gray-500 p-2 text-right">
                          {formatNumber(item.amount)}
                        </td>
                        <td className="border border-gray-500 p-2 text-right">
                          {formatNumber(item.tax)}
                        </td>
                      </tr>
                    ))}
                    {[...Array(10 - items.length)].map((_, index) => (
                      <tr key={`empty-${index}`}>
                        <td className="border border-gray-500 p-2">&nbsp;</td>
                        <td className="border border-gray-500 p-2"></td>
                        <td className="border border-gray-500 p-2"></td>
                        <td className="border border-gray-500 p-2"></td>
                        <td className="border border-gray-500 p-2"></td>
                        <td className="border border-gray-500 p-2"></td>
                        <td className="border border-gray-500 p-2"></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-4">
                  <p>합계: {formatNumber(calculateTotal())}원</p>
                </div>
              </div>
            </div>
            <button
              onClick={generateStatement}
              className="mt-4 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            >
              거래명세표 이미지 생성
            </button>
          </div>
        </div>
        <div className="items-center px-4 py-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
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
