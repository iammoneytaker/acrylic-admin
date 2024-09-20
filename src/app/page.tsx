'use client';
import { useEffect, useState } from 'react';
import Auth from './components/Auth';
import ExcelParser from './components/ExcelParser';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <div className="max-w-5xl w-full mx-auto p-4">
        {/* 제목 */}
        <h1 className="text-3xl font-extrabold text-center text-gray-900 mb-8">
          아크릴 맛집 관리 시스템
        </h1>
      </div>

      <div className="mb-4 flex justify-end">
        <Link
          href="/tasks"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-300"
        >
          할일 목록
        </Link>
      </div>
      {!session ? <Auth /> : <ExcelParser />}
      {/* 내비게이션 */}
      <nav className="bg-white shadow-md rounded-md mb-4">
        <ul className="flex flex-col gap-4 p-6">
          <li>
            <Link
              href="/manual-entries"
              className="text-lg text-blue-600 hover:text-blue-700 font-medium transition duration-300"
            >
              수동 입력 목록
            </Link>
          </li>
          <li>
            <Link
              href="/manual-entry"
              className="text-lg text-blue-600 hover:text-blue-700 font-medium transition duration-300"
            >
              새 수동 입력
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}
