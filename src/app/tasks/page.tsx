'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import SourceSelector from './SourceSelector';

interface TodoItem {
  id: number;
  source_type: string;
  source_id: string;
  status: string;
  assigned_to: string;
  due_date: string | null;
  title: string;
  memo: string;
  consultation_completed: boolean;
  quotation_completed: boolean;
  payment_completed: boolean;
  in_progress: boolean;
  tax_invoice_needed: boolean;
  tax_invoice_completed: boolean;
  cash_receipt_needed: boolean;
  cash_receipt_completed: boolean;
}

const statuses = [
  '시작 전',
  '견적완료/도면작업',
  '이번주 작업',
  '다음주 작업',
  '제작완료',
] as const;

type Status = (typeof statuses)[number];

const statusColors: Record<
  Status,
  { border: string; bg: string; text: string }
> = {
  '시작 전': {
    border: 'border-gray-300',
    bg: 'bg-gray-100',
    text: 'text-gray-600',
  },
  '견적완료/도면작업': {
    border: 'border-yellow-300',
    bg: 'bg-yellow-100',
    text: 'text-yellow-600',
  },
  '이번주 작업': {
    border: 'border-blue-300',
    bg: 'bg-blue-100',
    text: 'text-blue-600',
  },
  '다음주 작업': {
    border: 'border-purple-300',
    bg: 'bg-purple-100',
    text: 'text-purple-600',
  },
  제작완료: {
    border: 'border-green-300',
    bg: 'bg-green-100',
    text: 'text-green-600',
  },
};

const TasksPage = () => {
  const [todoItems, setTodoItems] = useState<TodoItem[]>([]);
  const [newItem, setNewItem] = useState<Omit<TodoItem, 'id' | 'status'>>({
    source_type: '',
    source_id: '',
    assigned_to: '',
    due_date: '',
    title: '',
    memo: '',
    consultation_completed: false,
    quotation_completed: false,
    payment_completed: false,
    in_progress: false,
    tax_invoice_needed: false,
    tax_invoice_completed: false,
    cash_receipt_needed: false,
    cash_receipt_completed: false,
  });
  const [showSourceSelector, setShowSourceSelector] = useState(false);
  const [editingMemo, setEditingMemo] = useState<number | null>(null);

  useEffect(() => {
    fetchTodoItems();
  }, []);

  const fetchTodoItems = async () => {
    const { data, error } = await supabase
      .from('todolist')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) {
      setTodoItems(data);
    }
    if (error) console.error('Error fetching todo items:', error);
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setNewItem({ ...newItem, [e.target.name]: e.target.value });
  };

  const addTodoItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const itemToInsert = {
      ...newItem,
      status: '시작 전',
      due_date: newItem.due_date || null,
    };

    const { data, error } = await supabase
      .from('todolist')
      .insert(itemToInsert);

    if (error) console.error('Error adding todo item:', error);
    else {
      fetchTodoItems();
      setNewItem({
        source_type: '',
        source_id: '',
        assigned_to: '',
        due_date: '',
        title: '',
        memo: '',
        consultation_completed: false,
        quotation_completed: false,
        payment_completed: false,
        in_progress: false,
        tax_invoice_needed: false,
        tax_invoice_completed: false,
        cash_receipt_needed: false,
        cash_receipt_completed: false,
      });
    }
  };

  const getItemLink = (item: TodoItem) => {
    if (item.source_type === '직접 입력 리스트') {
      return `/manual-entry/${item.source_id}`;
    } else if (item.source_type === '엑셀 리스트') {
      return `/detail/${item.source_id}`;
    }
    return '#';
  };

  const handleSourceSelect = (type: string, id: number, title: string) => {
    setNewItem({
      ...newItem,
      source_type: type,
      source_id: id.toString(),
      title,
    });
    setShowSourceSelector(false);
  };

  const updateStatus = async (itemId: number, newStatus: string) => {
    const { data, error } = await supabase
      .from('todolist')
      .update({ status: newStatus })
      .eq('id', itemId);

    if (error) {
      console.error('Error updating todo item:', error);
    } else {
      setTodoItems((prevItems) =>
        prevItems.map((item) =>
          item.id === itemId ? { ...item, status: newStatus } : item
        )
      );
    }
  };

  const updateDueDate = async (itemId: number, newDueDate: string | null) => {
    const { data, error } = await supabase
      .from('todolist')
      .update({ due_date: newDueDate })
      .eq('id', itemId);

    if (error) {
      console.error('Error updating due date:', error);
    } else {
      setTodoItems((prevItems) =>
        prevItems.map((item) =>
          item.id === itemId ? { ...item, due_date: newDueDate } : item
        )
      );
    }
  };

  const deleteTodoItem = async (itemId: number) => {
    if (window.confirm('정말로 이 항목을 삭제하시겠습니까?')) {
      const { error } = await supabase
        .from('todolist')
        .delete()
        .eq('id', itemId);

      if (error) {
        console.error('Error deleting todo item:', error);
      } else {
        setTodoItems((prevItems) =>
          prevItems.filter((item) => item.id !== itemId)
        );
      }
    }
  };

  const updateMemo = async (itemId: number, newMemo: string) => {
    const { data, error } = await supabase
      .from('todolist')
      .update({ memo: newMemo })
      .eq('id', itemId);

    if (error) {
      console.error('Error updating memo:', error);
    } else {
      setTodoItems((prevItems) =>
        prevItems.map((item) =>
          item.id === itemId ? { ...item, memo: newMemo } : item
        )
      );
      setEditingMemo(null);
    }
  };

  const updateCheckbox = async (
    itemId: number,
    field: string,
    value: boolean
  ) => {
    const { data, error } = await supabase
      .from('todolist')
      .update({ [field]: value })
      .eq('id', itemId);

    if (error) {
      console.error(`Error updating ${field}:`, error);
    } else {
      setTodoItems((prevItems) =>
        prevItems.map((item) =>
          item.id === itemId ? { ...item, [field]: value } : item
        )
      );
    }
  };

  return (
    <div className="container mx-auto p-4 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">할일 목록</h1>
      <Link
        href="/"
        className="mb-6 inline-block bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition duration-300 ease-in-out"
      >
        메인 페이지로 돌아가기
      </Link>

      <form
        onSubmit={addTodoItem}
        className="mb-8 bg-white p-6 rounded-lg shadow-md"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <button
              type="button"
              onClick={() => setShowSourceSelector(true)}
              className="w-full p-2 border rounded bg-blue-500 text-white hover:bg-blue-600 transition duration-300 ease-in-out"
            >
              소스 선택
            </button>
          </div>
          <div>
            <input
              type="text"
              name="title"
              value={newItem.title}
              onChange={handleInputChange}
              placeholder="제목"
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
          <div>
            <input
              type="text"
              name="assigned_to"
              value={newItem.assigned_to}
              onChange={handleInputChange}
              placeholder="담당자"
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
          <div>
            <input
              type="date"
              name="due_date"
              value={newItem.due_date || ''}
              onChange={handleInputChange}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
          <div>
            <textarea
              name="memo"
              value={newItem.memo}
              onChange={handleInputChange}
              placeholder="메모"
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
              rows={3}
            />
          </div>
        </div>
        <button
          type="submit"
          className="mt-4 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition duration-300 ease-in-out"
        >
          할일 추가
        </button>
      </form>

      {showSourceSelector && (
        <SourceSelector
          onSelect={handleSourceSelect}
          onClose={() => setShowSourceSelector(false)}
        />
      )}

      <div className="flex overflow-x-auto pb-4 space-x-4">
        {statuses.map((status) => (
          <div key={status} className="flex-shrink-0 w-96">
            <h2
              className={`font-bold mb-4 p-2 rounded ${
                statusColors[status as Status].bg
              } ${statusColors[status as Status].text}`}
            >
              {status}
            </h2>
            <div className="space-y-4">
              {todoItems
                .filter((item) => item.status === status)
                .map((item) => (
                  <div
                    key={item.id}
                    className={`bg-white p-4 rounded-lg shadow-md border-l-4 ${
                      statusColors[item.status as Status].border
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <Link
                        href={getItemLink(item)}
                        className="text-lg font-semibold text-blue-600 hover:underline"
                      >
                        {item.title}
                      </Link>
                      <button
                        onClick={() => deleteTodoItem(item.id)}
                        className="text-red-500 hover:text-red-700 transition duration-300"
                      >
                        삭제
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      담당자: {item.assigned_to}
                    </p>
                    <div className="flex items-center mt-2">
                      <input
                        type="date"
                        value={item.due_date || ''}
                        onChange={(e) =>
                          updateDueDate(item.id, e.target.value || null)
                        }
                        className="text-sm text-gray-500 border rounded p-1 mr-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
                      />
                      <span className="text-sm text-gray-500">
                        {item.due_date
                          ? new Date(item.due_date).toLocaleDateString()
                          : '마감일 없음'}
                      </span>
                    </div>
                    <select
                      value={item.status}
                      onChange={(e) => updateStatus(item.id, e.target.value)}
                      className={`mt-3 w-full p-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-300 ${
                        statusColors[item.status as Status].text
                      } ${statusColors[item.status as Status].bg}`}
                    >
                      {statuses.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <div className="mt-2">
                      {editingMemo === item.id ? (
                        <div>
                          <textarea
                            value={item.memo}
                            onChange={(e) => {
                              setTodoItems((prevItems) =>
                                prevItems.map((prevItem) =>
                                  prevItem.id === item.id
                                    ? { ...prevItem, memo: e.target.value }
                                    : prevItem
                                )
                              );
                            }}
                            className="w-full p-2 border rounded text-sm"
                            rows={3}
                          />
                          <div className="mt-2 flex justify-end space-x-2">
                            <button
                              onClick={() => updateMemo(item.id, item.memo)}
                              className="bg-blue-500 text-white px-2 py-1 rounded text-sm"
                            >
                              저장
                            </button>
                            <button
                              onClick={() => setEditingMemo(null)}
                              className="bg-gray-300 text-gray-700 px-2 py-1 rounded text-sm"
                            >
                              취소
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm text-gray-600 truncate">
                            메모: {item.memo || '(메모 없음)'}
                          </p>
                          <button
                            onClick={() => setEditingMemo(item.id)}
                            className="mt-1 text-blue-500 text-sm"
                          >
                            메모 편집
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 space-y-4">
                      {/* 진행 상태 세트 */}
                      <div className="bg-blue-50 p-3 rounded-md">
                        <h4 className="font-semibold text-blue-700 mb-2">
                          진행 상태
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={item.consultation_completed}
                              onChange={(e) =>
                                updateCheckbox(
                                  item.id,
                                  'consultation_completed',
                                  e.target.checked
                                )
                              }
                              className="mr-2"
                            />
                            <span className="text-sm">상담완료</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={item.quotation_completed}
                              onChange={(e) =>
                                updateCheckbox(
                                  item.id,
                                  'quotation_completed',
                                  e.target.checked
                                )
                              }
                              className="mr-2"
                            />
                            <span className="text-sm">견적완료</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={item.payment_completed}
                              onChange={(e) =>
                                updateCheckbox(
                                  item.id,
                                  'payment_completed',
                                  e.target.checked
                                )
                              }
                              className="mr-2"
                            />
                            <span className="text-sm">입금완료</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={item.in_progress}
                              onChange={(e) =>
                                updateCheckbox(
                                  item.id,
                                  'in_progress',
                                  e.target.checked
                                )
                              }
                              className="mr-2"
                            />
                            <span className="text-sm">진행</span>
                          </label>
                        </div>
                      </div>

                      {/* 세금계산서 세트 */}
                      <div className="bg-green-50 p-3 rounded-md">
                        <h4 className="font-semibold text-green-700 mb-2">
                          세금계산서
                        </h4>
                        <div className="space-y-2">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={item.tax_invoice_needed}
                              onChange={(e) =>
                                updateCheckbox(
                                  item.id,
                                  'tax_invoice_needed',
                                  e.target.checked
                                )
                              }
                              className="mr-2"
                            />
                            <span className="text-sm">세금계산서 필요</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={item.tax_invoice_completed}
                              onChange={(e) =>
                                updateCheckbox(
                                  item.id,
                                  'tax_invoice_completed',
                                  e.target.checked
                                )
                              }
                              className="mr-2"
                            />
                            <span className="text-sm">세금계산서 완료</span>
                          </label>
                        </div>
                      </div>

                      {/* 현금영수증 세트 */}
                      <div className="bg-yellow-50 p-3 rounded-md">
                        <h4 className="font-semibold text-yellow-700 mb-2">
                          현금영수증
                        </h4>
                        <div className="space-y-2">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={item.cash_receipt_needed}
                              onChange={(e) =>
                                updateCheckbox(
                                  item.id,
                                  'cash_receipt_needed',
                                  e.target.checked
                                )
                              }
                              className="mr-2"
                            />
                            <span className="text-sm">현금영수증 필요</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={item.cash_receipt_completed}
                              onChange={(e) =>
                                updateCheckbox(
                                  item.id,
                                  'cash_receipt_completed',
                                  e.target.checked
                                )
                              }
                              className="mr-2"
                            />
                            <span className="text-sm">현금영수증 완료</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TasksPage;
