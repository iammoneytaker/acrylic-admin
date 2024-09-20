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
  });
  const [showSourceSelector, setShowSourceSelector] = useState(false);

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
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
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
          <div key={status} className="flex-shrink-0 w-80">
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
                    <Link
                      href={getItemLink(item)}
                      className="text-lg font-semibold text-blue-600 hover:underline"
                    >
                      {item.title}
                    </Link>
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
