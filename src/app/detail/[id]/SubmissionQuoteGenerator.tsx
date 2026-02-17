import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import html2canvas from 'html2canvas';
import { supabase } from '../../../lib/supabaseClient';
import { debounce } from 'lodash';

interface SupplierData {
  companyName: string;
  representative: string;
  businessNumber: string;
  address: string;
  contactNumber: string;
  email: string;
  seal_url?: string | null;
  is_corporate?: boolean;
  corporate_name?: string | null;
}

interface OrdererData {
  id: number;
  companyName: string;
  representative: string;
  contactNumber: string;
  email: string;
}

interface QuoteItem {
  id?: number;
  product_name: string;
  quantity: number;
  price: number;
  total: number;
}

interface OnlineQuoteGeneratorProps {
  ordererData: OrdererData;
  onClose: () => void;
}

const formatNumber = (num: number, decimalPlaces: number = 0): string => {
  return num.toFixed(decimalPlaces).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

const formatDate = (date: Date): string => {
  return date
    .toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    .replace(/\. /g, '.');
};

const OnlineQuoteGenerator: React.FC<OnlineQuoteGeneratorProps> = ({
  ordererData,
  onClose,
}) => {
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
  const [newItem, setNewItem] = useState<Omit<QuoteItem, 'total'>>({
    product_name: '',
    quantity: 0,
    price: 0,
  });
  const [quoteDate, setQuoteDate] = useState<string>(formatDate(new Date()));
  const [businessNumber, setBusinessNumber] = useState<string>('');
  const [showBusinessNumber, setShowBusinessNumber] = useState<boolean>(false);
  const [savedQuoteUrl, setSavedQuoteUrl] = useState<string | null>(null);
  const [savedStatementUrl, setSavedStatementUrl] = useState<string | null>(
    null
  );
  
  // 여러 견적 관리를 위한 상태
  const [drafts, setDrafts] = useState<any[]>([]);
  const [quoteDraftId, setQuoteDraftId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const [remarks, setRemarks] = useState<string>('');
  const [editingRemarks, setEditingRemarks] = useState<boolean>(false);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<QuoteItem | null>(null);
  const [customCompanyName, setCustomCompanyName] = useState('');
  const [customRepresentative, setCustomRepresentative] = useState('');

  const [activeSupplier, setActiveSupplier] = useState<SupplierData | null>(null);

  useEffect(() => {
    fetchActiveSupplier();
    loadExistingDrafts();
  }, []);

  const fetchActiveSupplier = async () => {
    const { data, error } = await supabase
      .from('supplier_settings')
      .select('*')
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Error fetching active supplier:', error);
    } else if (data) {
      setActiveSupplier({
        companyName: data.company_name,
        representative: data.representative,
        businessNumber: data.business_number,
        address: data.address,
        contactNumber: data.contact_number,
        email: data.email,
        seal_url: data.seal_url,
        is_corporate: data.is_corporate,
        corporate_name: data.corporate_name,
      });
    }
  };

  const loadExistingDrafts = async () => {
    const { data, error } = await supabase
      .from('quote_drafts')
      .select('*')
      .or(`submission_id.eq.${ordererData.id},manual_entry_id.eq.${ordererData.id}`)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading existing drafts:', error);
      return;
    }

    if (data && data.length > 0) {
      setDrafts(data);
      // 첫 번째 견적을 기본값으로 선택
      const lastDraft = data[data.length - 1];
      selectDraft(lastDraft);
    } else {
      // 데이터가 없으면 초기 상태 유지
      setDrafts([]);
      setQuoteDraftId(null);
    }
  };

  const selectDraft = async (draft: any) => {
    setQuoteDraftId(draft.id);
    setEditingTitle(draft.title || '');
    setBusinessNumber(draft.business_number || '');
    setShowBusinessNumber(!!draft.business_number);
    setRemarks(draft.remarks || '');
    setQuoteDate(formatDate(new Date(draft.created_at)));
    await loadQuoteItems(draft.id);
  };

  const createNewDraft = async () => {
    const newTitle = `${formatDate(new Date())} 새 견적`;
    const { data, error } = await supabase
      .from('quote_drafts')
      .insert({
        submission_id: ordererData.id,
        business_number: '',
        remarks: '',
        title: newTitle
      })
      .select();

    if (error) {
      console.error('Error creating new draft:', error);
      return;
    }

    if (data) {
      setDrafts([...drafts, data[0]]);
      selectDraft(data[0]);
      setQuoteItems([]); // 새 견적은 아이템이 없음
    }
  };

  const handleTitleBlur = async () => {
    if (!quoteDraftId) return;
    
    const { error } = await supabase
      .from('quote_drafts')
      .update({ title: editingTitle })
      .eq('id', quoteDraftId);

    if (error) {
      console.error('Error updating title:', error);
    } else {
      setDrafts(drafts.map(d => d.id === quoteDraftId ? { ...d, title: editingTitle } : d));
    }
  };

  const loadQuoteItems = async (draftId: number) => {
    const { data, error } = await supabase
      .from('quote_draft_items')
      .select('*')
      .eq('quote_draft_id', draftId);

    if (error) {
      console.error('Error loading quote items:', error);
    } else if (data) {
      setQuoteItems(data);
    }
  };

  const createOrUpdateDraft = async () => {
    if (!quoteDraftId) {
      const { data, error } = await supabase
        .from('quote_drafts')
        .insert({
          submission_id: ordererData.id,
          business_number: businessNumber,
          remarks: remarks,
        })
        .select();

      if (error) {
        console.error('Error creating quote draft:', error);
        return null;
      }
      setQuoteDraftId(data[0].id);
      return data[0].id;
    } else {
      const { error } = await supabase
        .from('quote_drafts')
        .update({ business_number: businessNumber, remarks: remarks })
        .eq('id', quoteDraftId);

      if (error) {
        console.error('Error updating quote draft:', error);
        return null;
      }
      return quoteDraftId;
    }
  };

  const handleRemarksSave = async () => {
    if (quoteDraftId) {
      const { error } = await supabase
        .from('quote_drafts')
        .update({ remarks: remarks })
        .eq('id', quoteDraftId);

      if (error) {
        console.error('Error updating remarks:', error);
      } else {
        setEditingRemarks(false);
      }
    }
  };

  const addItem = useCallback(
    debounce(
      async () => {
        if (newItem.product_name && newItem.quantity > 0) {
          const draftId = await createOrUpdateDraft();
          if (!draftId) return;

          const total = newItem.quantity * newItem.price;
          const { data, error } = await supabase
            .from('quote_draft_items')
            .insert({
              quote_draft_id: draftId,
              product_name: newItem.product_name,
              quantity: newItem.quantity,
              price: newItem.price,
              total: total,
            })
            .select();

          if (error) {
            console.error('Error adding item:', error);
          } else if (data) {
            setQuoteItems((prevItems) => [...prevItems, data[0]]);
            setNewItem({ product_name: '', quantity: 0, price: 0 });
            setShowBusinessNumber(!!businessNumber);
          }
        }
      },
      2000,
      { leading: true, trailing: false }
    ),
    [newItem, businessNumber, quoteDraftId]
  );

  const removeItem = async (id: number) => {
    const { error } = await supabase
      .from('quote_draft_items')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error removing item:', error);
    } else {
      setQuoteItems(quoteItems.filter((item) => item.id !== id));
    }
  };

  const calculateTotal = (): number => {
    return quoteItems.reduce((sum, item) => sum + item.total, 0);
  };

  const generateQuote = async () => {
    const quoteElement = document.getElementById('quote-container');
    const statementElement = document.getElementById('transaction-statement');

    if (quoteElement && statementElement) {
      try {
        const quoteCanvas = await html2canvas(quoteElement, {
          scale: 2,
          useCORS: true,
          logging: false,
        });
        const statementCanvas = await html2canvas(statementElement, {
          scale: 2,
          useCORS: true,
          logging: false,
        });

        const quoteUrl = quoteCanvas.toDataURL('image/png');
        const statementUrl = statementCanvas.toDataURL('image/png');

        setSavedQuoteUrl(quoteUrl);
        setSavedStatementUrl(statementUrl);
      } catch (error) {
        console.error('Error generating images:', error);
        alert('이미지 생성 중 오류가 발생했습니다.');
      }
    }
  };

  const downloadImage = (dataUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadQuote = () => {
    if (savedQuoteUrl) {
      downloadImage(savedQuoteUrl, '견적서.png');
    }
  };

  const downloadStatement = () => {
    if (savedStatementUrl) {
      downloadImage(savedStatementUrl, '거래명세서.png');
    }
  };

  const startEditing = (item: QuoteItem) => {
    setEditingItemId(item.id ?? 0);
    setEditingItem({ ...item });
  };

  const cancelEditing = () => {
    setEditingItemId(null);
    setEditingItem(null);
  };

  const saveEditedItem = async () => {
    if (editingItem && editingItemId) {
      const { error } = await supabase
        .from('quote_draft_items')
        .update({
          product_name: editingItem.product_name,
          quantity: editingItem.quantity,
          price: editingItem.price,
          total: editingItem.quantity * editingItem.price,
        })
        .eq('id', editingItemId);

      if (error) {
        console.error('Error updating item:', error);
      } else {
        setQuoteItems(
          quoteItems.map((item) =>
            item.id === editingItemId
              ? {
                  ...editingItem,
                  total: editingItem.quantity * editingItem.price,
                }
              : item
          )
        );
        setEditingItemId(null);
        setEditingItem(null);
      }
    }
  };

  const effectiveCompanyName = customCompanyName || ordererData.companyName;
  const effectiveRepresentative = customRepresentative || ordererData.representative;

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = new Date(e.target.value);
    setQuoteDate(formatDate(selectedDate));
  };

  const modalContent = (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full md:w-11/12 lg:w-3/4 shadow-lg rounded-md bg-white">
        <div className="absolute top-0 right-0 mt-4 mr-4">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg
              className="h-6 w-6 md:h-8 md:w-8 lg:h-12 lg:w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="mt-3 text-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            온라인 견적서 생성
          </h3>
          
          {/* 견적서 탭 바 추가 */}
          <div className="mt-4 flex flex-wrap border-b border-gray-200">
            {drafts.map((draft) => (
              <button
                key={draft.id}
                onClick={() => selectDraft(draft)}
                className={`py-2 px-4 text-sm font-medium border-b-2 ${
                  quoteDraftId === draft.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {draft.title || '제목 없음'}
              </button>
            ))}
            <button
              onClick={createNewDraft}
              className="py-2 px-4 text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              + 새 견적 추가
            </button>
          </div>

          <div className="mt-2 px-7 py-3">
            <div className="mb-4 space-y-2">
              {quoteDraftId && (
                <div className="mb-4 text-left">
                  <label className="block text-sm font-medium text-gray-700">
                    현재 견적서 제목 수정
                  </label>
                  <input
                    type="text"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onBlur={handleTitleBlur}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm"
                    placeholder="견적서 제목을 입력하세요 (예: 1차 견적, 날짜 등)"
                  />
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label
                    htmlFor="customCompanyName"
                    className="block text-sm font-medium text-gray-700"
                  >
                    상호명 변경 (선택사항)
                  </label>
                  <input
                    type="text"
                    id="customCompanyName"
                    value={customCompanyName}
                    onChange={(e) => setCustomCompanyName(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    placeholder="변경할 상호명을 입력하세요"
                  />
                </div>
                <div>
                  <label
                    htmlFor="customRepresentative"
                    className="block text-sm font-medium text-gray-700"
                  >
                    대표자 이름 변경 (선택사항)
                  </label>
                  <input
                    type="text"
                    id="customRepresentative"
                    value={customRepresentative}
                    onChange={(e) => setCustomRepresentative(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    placeholder="변경할 대표자 이름을 입력하세요"
                  />
                </div>
              </div>
              {/* 견적일자 선택 필드 수정 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  견적일자
                </label>
                <div className="flex items-center">
                  <input
                    type="date"
                    value={quoteDate.split('.').reverse().join('-')}
                    onChange={handleDateChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                  <span className="ml-2 text-sm text-gray-600">
                    선택된 날짜: {quoteDate}
                  </span>
                </div>
              </div>
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
                  value={newItem.product_name}
                  onChange={(e) =>
                    setNewItem({ ...newItem, product_name: e.target.value })
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

            {/* 추가된 항목 목록 */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">추가된 항목</h3>
              <table className="min-w-full bg-white border">
                <thead>
                  <tr>
                    <th className="px-4 py-2 border">제품명</th>
                    <th className="px-4 py-2 border">수량</th>
                    <th className="px-4 py-2 border">단가</th>
                    <th className="px-4 py-2 border">합계</th>
                    <th className="px-4 py-2 border">작업</th>
                  </tr>
                </thead>
                <tbody>
                  {quoteItems.map((item, index) => (
                    <tr key={index}>
                      {editingItemId === item.id ? (
                        <>
                          <td className="px-4 py-2 border">
                            <input
                              type="text"
                              value={editingItem?.product_name}
                              onChange={(e) =>
                                setEditingItem({
                                  ...editingItem!,
                                  product_name: e.target.value,
                                })
                              }
                              className="w-full p-1 border rounded"
                            />
                          </td>
                          <td className="px-4 py-2 border">
                            <input
                              type="number"
                              value={editingItem?.quantity}
                              onChange={(e) =>
                                setEditingItem({
                                  ...editingItem!,
                                  quantity: parseInt(e.target.value) || 0,
                                })
                              }
                              className="w-full p-1 border rounded"
                            />
                          </td>
                          <td className="px-4 py-2 border">
                            <input
                              type="number"
                              value={editingItem?.price}
                              onChange={(e) =>
                                setEditingItem({
                                  ...editingItem!,
                                  price: parseInt(e.target.value) || 0,
                                })
                              }
                              className="w-full p-1 border rounded"
                            />
                          </td>
                          <td className="px-4 py-2 border text-right">
                            {formatNumber(
                              (editingItem?.quantity || 0) *
                                (editingItem?.price || 0)
                            )}
                            원
                          </td>
                          <td className="px-4 py-2 border text-center">
                            <button
                              onClick={saveEditedItem}
                              className="text-green-500 hover:text-green-700 mr-2"
                            >
                              저장
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="text-gray-500 hover:text-gray-700"
                            >
                              취소
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-2 border">
                            {item.product_name}
                          </td>
                          <td className="px-4 py-2 border text-right">
                            {formatNumber(item.quantity)}
                          </td>
                          <td className="px-4 py-2 border text-right">
                            {formatNumber(item.price)}원
                          </td>
                          <td className="px-4 py-2 border text-right">
                            {formatNumber(item.total)}원
                          </td>
                          <td className="px-4 py-2 border text-center">
                            <button
                              onClick={() => startEditing(item)}
                              className="text-blue-500 hover:text-blue-700 mr-2"
                            >
                              수정
                            </button>
                            <button
                              onClick={() => removeItem(item.id ?? 0)}
                              className="text-red-500 hover:text-red-700"
                            >
                              삭제
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 비고 */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">비고</h3>
              {editingRemarks ? (
                <div>
                  <textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="w-full p-2 border rounded"
                    rows={3}
                  />
                  <div className="mt-2">
                    <button
                      onClick={handleRemarksSave}
                      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2"
                    >
                      저장
                    </button>
                    <button
                      onClick={() => {
                        setEditingRemarks(false);
                        setRemarks(remarks); // 원래 값으로 되돌리기
                      }}
                      className="bg-gray-300 hover:bg-gray-400 text-black font-bold py-2 px-4 rounded"
                    >
                      취소
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="mb-2">{remarks || '비고가 없습니다.'}</p>
                  <button
                    onClick={() => setEditingRemarks(true)}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                  >
                    수정
                  </button>
                </div>
              )}
            </div>

            {/* 견적서 */}
            <div id="quote-container" className="bg-white p-8 shadow-lg">
              <div className="flex justify-between mb-6">
                <h1 className="text-3xl font-bold">온라인견적서</h1>
                <div>
                  <p>견적일자: {quoteDate}</p>
                  <p>
                    견적금액:{' '}
                    {formatNumber(
                      calculateTotal() + Math.round(calculateTotal() * 0.1)
                    )}
                    원 (부가세포함)
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="border">
                  <div className="bg-gray-100 px-4 py-2 font-bold">
                    공급자 정보
                  </div>
                  <div className="p-4">
                    {activeSupplier ? (
                      <div className="grid grid-cols-3 gap-2">
                        <div className="font-bold">상호명</div>
                        <div className="col-span-2">
                          {activeSupplier.is_corporate ? activeSupplier.corporate_name : activeSupplier.companyName}
                        </div>
                        <div className="font-bold">대표자</div>
                        <div className="col-span-2 flex items-center justify-center isolate">
                          <span className="relative">
                            {activeSupplier.representative}
                          </span>
                          <span className="relative ml-4 flex items-center justify-center w-12 h-12">
                            <span className="z-10">(인)</span>
                            {activeSupplier.seal_url && (
                              <img
                                src={activeSupplier.seal_url}
                                alt="인"
                                className="absolute inset-0 w-full h-full opacity-80 object-contain pointer-events-none z-0"
                              />
                            )}
                          </span>
                        </div>
                        <div className="font-bold">사업자번호</div>
                        <div className="col-span-2">
                          {activeSupplier.businessNumber}
                        </div>
                        <div className="font-bold">주소</div>
                        <div className="col-span-2">{activeSupplier.address}</div>
                        <div className="font-bold">대표전화</div>
                        <div className="col-span-2">
                          {activeSupplier.contactNumber}
                        </div>
                        <div className="font-bold">e-mail</div>
                        <div className="col-span-2">{activeSupplier.email}</div>
                      </div>
                    ) : (
                      <div>공급자 정보를 불러오는 중...</div>
                    )}
                  </div>
                </div>

                <div className="border">
                  <div className="bg-gray-100 px-4 py-2 font-bold">
                    주문자 정보
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="font-bold">상호명</div>
                      <div className="col-span-2">{effectiveCompanyName}</div>
                      <div className="font-bold">대표자</div>
                      <div className="col-span-2">
                        {effectiveRepresentative}
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
                    <th className="px-4 py-2 border">No</th>
                    <th className="px-4 py-2 border">품목</th>
                    <th className="px-4 py-2 border">수량</th>
                    <th className="px-4 py-2 border">단가</th>
                    <th className="px-4 py-2 border">공급가액</th>
                    <th className="px-4 py-2 border">세액</th>
                  </tr>
                </thead>
                <tbody>
                  {quoteItems.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 border text-center">
                        {index + 1}
                      </td>
                      <td className="px-4 py-2 border">{item.product_name}</td>
                      <td className="px-4 py-2 border text-right">
                        {formatNumber(item.quantity)}
                      </td>
                      <td className="px-4 py-2 border text-right">
                        {formatNumber(item.price)}원
                      </td>
                      <td className="px-4 py-2 border text-right">
                        {formatNumber(item.total)}원
                      </td>
                      <td className="px-4 py-2 border text-right">
                        {formatNumber(item.total * 0.1, 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {remarks && (
                <table className="min-w-full bg-white border mb-6">
                  <thead>
                    <tr>
                      <th className="bg-gray-100 px-4 py-2 border">비고</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="px-4 py-2 border text-justify">
                        {remarks}
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}

              <div className="text-right mb-6">
                <p>공급가액: {formatNumber(calculateTotal())}원</p>
                <p>부가세(10%): {formatNumber(calculateTotal() * 0.1, 0)}원</p>
                <p className="font-bold text-xl">
                  총 금액:{' '}
                  {formatNumber(
                    calculateTotal() + Math.round(calculateTotal() * 0.1)
                  )}
                  원
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
                <p>우리은행: 1006-701-532627</p>
              </div>
            </div>

            {/* 거래명세서 */}
            <div
              id="transaction-statement"
              className="bg-white p-8 shadow-lg mt-8"
            >
              <div className="border-2 border-red-500 p-4">
                <h1 className="text-2xl font-bold text-center text-red-500 mb-4">
                  거래명세표
                </h1>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p>{effectiveCompanyName} 귀하</p>
                    <p>거래일: {quoteDate}</p>
                    <p>공급가액: {formatNumber(calculateTotal())}</p>
                    <p>세액: {formatNumber(calculateTotal() * 0.1, 0)}</p>
                    <p>
                      합계금액:{' '}
                      {formatNumber(
                        calculateTotal() + Math.round(calculateTotal() * 0.1)
                      )}
                    </p>
                  </div>
                  <div>
                    {activeSupplier && (
                      <>
                        <p>등록번호: {activeSupplier.businessNumber}</p>
                        <p>상호: {activeSupplier.is_corporate ? activeSupplier.corporate_name : activeSupplier.companyName}</p>
                        <div className="flex items-center justify-start isolate">
                          <span>성명: {activeSupplier.representative}</span>
                          <span className="relative ml-4 flex items-center justify-center w-10 h-10">
                            <span className="z-10 text-sm">(인)</span>
                            {activeSupplier.seal_url && (
                              <img
                                src={activeSupplier.seal_url}
                                alt="인"
                                className="absolute inset-0 w-full h-full opacity-80 object-contain pointer-events-none z-0"
                              />
                            )}
                          </span>
                        </div>
                        <p>사업장: {activeSupplier.address}</p>
                        <p>업태: 제조업</p>
                        <p>종목: 아크릴</p>
                        <p>E-mail: {activeSupplier.email}</p>
                      </>
                    )}
                  </div>
                </div>
                <table className="w-full border-collapse border border-gray-500">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-500 p-2">No</th>
                      <th className="border border-gray-500 p-2">품목</th>
                      <th className="border border-gray-500 p-2">수량</th>
                      <th className="border border-gray-500 p-2">단가</th>
                      <th className="border border-gray-500 p-2">공급가액</th>
                      <th className="border border-gray-500 p-2">세액</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quoteItems.map((item, index) => (
                      <tr key={index}>
                        <td className="border border-gray-500 p-2 text-center">
                          {index + 1}
                        </td>
                        <td className="border border-gray-500 p-2">
                          {item.product_name}
                        </td>
                        <td className="border border-gray-500 p-2 text-right">
                          {formatNumber(item.quantity)}
                        </td>
                        <td className="border border-gray-500 p-2 text-right">
                          {formatNumber(item.price)}
                        </td>
                        <td className="border border-gray-500 p-2 text-right">
                          {formatNumber(item.total)}
                        </td>
                        <td className="border border-gray-500 p-2 text-right">
                          {formatNumber(item.total * 0.1, 0)}
                        </td>
                      </tr>
                    ))}
                    {quoteItems.length < 10 && [...Array(10 - quoteItems.length)].map((_, index) => (
                      <tr key={`empty-${index}`}>
                        <td className="border border-gray-500 p-2">&nbsp;</td>
                        <td className="border border-gray-500 p-2"></td>
                        <td className="border border-gray-500 p-2"></td>
                        <td className="border border-gray-500 p-2"></td>
                        <td className="border border-gray-500 p-2"></td>
                        <td className="border border-gray-500 p-2"></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {remarks && (
                  <table className="mt-8 min-w-full bg-white border mb-6">
                    <thead>
                      <tr>
                        <th className="bg-gray-100 px-4 py-2 border">비고</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="px-4 py-2 border text-justify">
                          {remarks}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                )}
                <div className="mt-4">
                  <p>
                    합계:{' '}
                    {formatNumber(
                      calculateTotal() + Math.round(calculateTotal() * 0.1)
                    )}
                    원
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-col sm:flex-row justify-between items-center">
              <button
                onClick={generateQuote}
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mb-2 sm:mb-0 w-full sm:w-auto"
              >
                견적서 및 거래명세서 이미지 생성
              </button>
              <div className="flex flex-col sm:flex-row w-full sm:w-auto">
                <button
                  onClick={downloadQuote}
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-2 sm:mb-0 sm:mr-2 w-full sm:w-auto"
                  disabled={!savedQuoteUrl}
                >
                  견적서 다운로드
                </button>
                <button
                  onClick={downloadStatement}
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full sm:w-auto"
                  disabled={!savedStatementUrl}
                >
                  거래명세서 다운로드
                </button>
              </div>
            </div>
            {savedQuoteUrl && (
              <div className="mt-4">
                <h3 className="font-bold">저장된 견적서</h3>
                <img
                  src={savedQuoteUrl}
                  alt="Saved Quote"
                  className="mt-2 w-full object-contain"
                />
              </div>
            )}
            {savedStatementUrl && (
              <div className="mt-4">
                <h3 className="font-bold">저장된 거래명세서</h3>
                <img
                  src={savedStatementUrl}
                  alt="Saved Statement"
                  className="mt-2 w-full object-contain"
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
