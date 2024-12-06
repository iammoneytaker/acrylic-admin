'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Link from 'next/link';

interface ManualEntry {
  id: number;
  name_or_company: string;
  contact: string;
  business_number: string;
  memo: string;
  created_at: string;
}

const ManualEntriesListPage: React.FC = () => {
  const [entries, setEntries] = useState<ManualEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredEntries, setFilteredEntries] = useState<ManualEntry[]>([]);

  useEffect(() => {
    fetchEntries();
  }, []);

  useEffect(() => {
    const filtered = entries.filter((entry) =>
      Object.values(entry)
        .join(' ')
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
    setFilteredEntries(filtered);
  }, [searchTerm, entries]);

  const fetchEntries = async () => {
    const { data, error } = await supabase
      .from('manual_entries')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching entries:', error);
    } else {
      setEntries(data || []);
    }
  };

  const deleteEntry = async (id: number) => {
    if (
      window.confirm(
        '이 항목을 삭제하시겠습니까? 관련된 모든 상담 내용, 견적서 초안 및 견적서 항목도 함께 삭제됩니다.'
      )
    ) {
      // 먼저 관련된 manual_entry_notes 삭제
      const { error: notesError } = await supabase
        .from('manual_entry_notes')
        .delete()
        .eq('entry_id', id);

      if (notesError) {
        console.error('Error deleting related notes:', notesError);
        alert('관련 상담 내용 삭제 중 오류가 발생했습니다.');
        return;
      }

      // 관련된 quote_drafts의 ID들을 가져옵니다.
      const { data: quoteDrafts, error: fetchError } = await supabase
        .from('quote_drafts')
        .select('id')
        .eq('manual_entry_id', id);

      if (fetchError) {
        console.error('Error fetching quote drafts:', fetchError);
        alert('견적서 초안 정보를 가져오는 중 오류가 발생했습니다.');
        return;
      }

      // 각 quote_draft에 대해 관련된 quote_draft_items를 삭제합니다.
      for (const draft of quoteDrafts) {
        const { error: itemsError } = await supabase
          .from('quote_draft_items')
          .delete()
          .eq('quote_draft_id', draft.id);

        if (itemsError) {
          console.error('Error deleting quote draft items:', itemsError);
          alert('견적서 항목 삭제 중 오류가 발생했습니다.');
          return;
        }
      }

      // 이제 quote_drafts를 삭제합니다.
      const { error: quoteDraftsError } = await supabase
        .from('quote_drafts')
        .delete()
        .eq('manual_entry_id', id);

      if (quoteDraftsError) {
        console.error('Error deleting quote drafts:', quoteDraftsError);
        alert('견적서 초안 삭제 중 오류가 발생했습니다.');
        return;
      }

      // 마지막으로 manual_entries 항목 삭제
      const { error } = await supabase
        .from('manual_entries')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting entry:', error);
        alert('항목 삭제 중 오류가 발생했습니다.');
      } else {
        setEntries(entries.filter((entry) => entry.id !== id));
        alert('항목이 성공적으로 삭제되었습니다.');
      }
    }
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
          수동 입력 목록
        </h1>
        <Link
          href="/manual-entry"
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition duration-300 ease-in-out"
        >
          새 항목 추가
        </Link>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="검색어를 입력하세요..."
          className="w-full p-2 border border-gray-300 rounded"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto bg-white shadow-md rounded-lg">
        <table className="min-w-full">
          <thead className="bg-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                업체/이름
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                연락처
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                생성일
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredEntries.map((entry) => (
              <tr key={entry.id} className="hover:bg-gray-50">
                <td className="px-4 py-4 whitespace-nowrap">
                  {entry.name_or_company}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">{entry.contact}</td>
                <td className="px-4 py-4 whitespace-nowrap">
                  {new Date(entry.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <Link
                    href={`/manual-entry/${entry.id}`}
                    className="text-blue-600 hover:text-blue-900 transition duration-300 ease-in-out mr-2"
                  >
                    상세보기
                  </Link>
                  <button
                    onClick={() => deleteEntry(entry.id)}
                    className="text-red-600 hover:text-red-900 transition duration-300 ease-in-out"
                  >
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManualEntriesListPage;
