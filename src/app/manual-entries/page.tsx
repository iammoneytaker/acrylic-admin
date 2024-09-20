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
      setEntries(data || []);
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
                제품
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
            {entries.map((entry) => (
              <tr key={entry.id} className="hover:bg-gray-50">
                <td className="px-4 py-4 whitespace-nowrap">
                  {entry.name_or_company}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">{entry.contact}</td>
                <td className="px-4 py-4 whitespace-nowrap">{entry.product}</td>
                <td className="px-4 py-4 whitespace-nowrap">
                  {new Date(entry.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <Link
                    href={`/manual-entry/${entry.id}`}
                    className="text-blue-600 hover:text-blue-900 transition duration-300 ease-in-out"
                  >
                    상세보기
                  </Link>
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
