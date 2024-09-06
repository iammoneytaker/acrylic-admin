'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Link from 'next/link';

interface ManualEntry {
  id: number;
  name_or_company: string;
  contact: string;
  product: string;
  created_at: string;
}

const ManualEntriesListPage: React.FC = () => {
  const [entries, setEntries] = useState<ManualEntry[]>([]);

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    const { data, error } = await supabase
      .from('manual_entries')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching entries:', error);
    } else {
      console.log(data);
      setEntries(data || []);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">수동 입력 목록</h1>
      <Link
        href="/manual-entry"
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4 inline-block"
      >
        새 항목 추가
      </Link>
      <table className="min-w-full bg-white">
        <thead>
          <tr>
            <th className="px-4 py-2 border">업체/이름</th>
            <th className="px-4 py-2 border">연락처</th>
            <th className="px-4 py-2 border">제품</th>
            <th className="px-4 py-2 border">생성일</th>
            <th className="px-4 py-2 border">actions</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id}>
              <td className="px-4 py-2 border">{entry.name_or_company}</td>
              <td className="px-4 py-2 border">{entry.contact}</td>
              <td className="px-4 py-2 border">{entry.product}</td>
              <td className="px-4 py-2 border">
                {new Date(entry.created_at).toLocaleDateString()}
              </td>
              <td className="px-4 py-2 border">
                <Link
                  href={`/manual-entry/${entry.id}`}
                  className="text-blue-500 hover:text-blue-700"
                >
                  상세보기
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ManualEntriesListPage;
