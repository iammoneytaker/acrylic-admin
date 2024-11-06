'use client';
import './globals.css';
import { Inter } from 'next/font/google';
import { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import Sidebar from '@/components/Sidebar';
import Auth from './components/Auth';
import { SidebarContext } from '@/components/Sidebar.context';

const inter = Inter({ subsets: ['latin'] });

function MainLayout({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <SidebarContext.Provider value={{ isOpen, setIsOpen }}>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main
          className={`flex-1 p-4 transition-all duration-300 ease-in-out
            ${isOpen ? 'ml-64' : 'ml-16'}`}
        >
          <div className="max-w-5xl mx-auto">{children}</div>
        </main>
      </div>
    </SidebarContext.Provider>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <html lang="ko">
        <body className={`${inter.className} bg-gray-100`}>
          <div className="flex min-h-screen items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </body>
      </html>
    );
  }

  return (
    <html lang="ko">
      <body className={`${inter.className} bg-gray-100`}>
        {!session ? <Auth /> : <MainLayout>{children}</MainLayout>}
      </body>
    </html>
  );
}
