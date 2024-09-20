'use client';
import React, { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

const statuses = [
  '시작 전',
  '견적완료/도면작업',
  '이번주 작업',
  '다음주 작업',
  '제작완료',
];

interface TodoItem {
  id: number;
  source_type: string;
  source_id: number;
  status: string;
  assigned_to: string;
  due_date: string;
  name_or_company: string;
}

const KanbanBoard: React.FC = () => {
  const [todoItems, setTodoItems] = useState<TodoItem[]>([]);

  useEffect(() => {
    fetchTodoItems();
  }, []);

  const fetchTodoItems = async () => {
    const { data, error } = await supabase
      .from('todolist')
      .select(
        `
        *,
        submissions(name_or_company),
        manual_entries(name_or_company)
      `
      )
      .order('created_at', { ascending: false });
    if (data) {
      const items = data.map((item) => ({
        ...item,
        name_or_company:
          item.source_type === '엑셀 리스트'
            ? item.submissions?.name_or_company
            : item.manual_entries?.name_or_company,
      }));
      setTodoItems(items);
    }
    if (error) console.error('Error fetching todo items:', error);
  };

  const onDragEnd = async (result: any) => {
    if (!result.destination) return;

    const { source, destination } = result;

    if (source.droppableId !== destination.droppableId) {
      const newStatus = destination.droppableId;
      const itemId = parseInt(result.draggableId);

      await updateStatus(itemId, newStatus);
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

  const handleStatusClick = (itemId: number) => {
    const item = todoItems.find((item) => item.id === itemId);
    if (item) {
      const currentIndex = statuses.indexOf(item.status);
      const nextIndex = (currentIndex + 1) % statuses.length;
      const newStatus = statuses[nextIndex];
      updateStatus(itemId, newStatus);
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex overflow-x-auto p-4">
        {statuses.map((status) => (
          <Droppable key={status} droppableId={status}>
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="flex-shrink-0 w-72 bg-gray-100 m-2 p-2 rounded"
              >
                <h2 className="font-bold mb-2">{status}</h2>
                {todoItems
                  .filter((item) => item.status === status)
                  .map((item, index) => (
                    <Draggable
                      key={item.id}
                      draggableId={item.id.toString()}
                      index={index}
                    >
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="bg-white p-2 mb-2 rounded shadow"
                        >
                          <Link
                            href={getItemLink(item)}
                            className="text-blue-500 hover:underline"
                          >
                            ({item.source_type} - {item.source_id}){' '}
                            {item.name_or_company}
                          </Link>
                          <p className="text-sm text-gray-600">
                            담당자: {item.assigned_to}
                          </p>
                          <p className="text-xs text-gray-500">
                            마감일: {item.due_date}
                          </p>
                          <button
                            onClick={() => handleStatusClick(item.id)}
                            className="mt-2 w-full p-1 text-sm border rounded bg-blue-500 text-white hover:bg-blue-600"
                          >
                            {item.status}
                          </button>
                        </div>
                      )}
                    </Draggable>
                  ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  );
};

export default KanbanBoard;
