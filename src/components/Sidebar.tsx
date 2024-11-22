'use client';
import { useContext } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { SidebarContext } from '@/components/Sidebar.context';
import { supabase } from '@/lib/supabaseClient';

const Sidebar = () => {
  const { isOpen, setIsOpen } = useContext(SidebarContext);
  const pathname = usePathname();
  const router = useRouter();

  const menuItems = [
    { href: '/', label: '홈', icon: '🏠' },
    { href: '/tasks', label: '할일 목록', icon: '📋' },
    { href: '/manual-entries', label: '수동 입력 목록', icon: '📝' },
    { href: '/manual-entry', label: '새 수동 입력', icon: '➕' },
    { href: '/analytics', label: '데이터 분석', icon: '📊' },
    { href: '/contracts', label: '계약서 만들기', icon: '📄' },
  ];

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.refresh(); // 페이지 새로고침하여 세션 상태 업데이트
    } catch (error) {
      console.error('로그아웃 중 오류 발생:', error);
    }
  };

  return (
    <>
      {/* 모바일 오버레이 */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* 사이드바 */}
      <div
        className={`fixed top-0 left-0 h-full bg-white shadow-xl z-30 transition-all duration-300 ease-in-out
          ${isOpen ? 'w-64' : 'w-16'}`}
      >
        <div className="flex flex-col h-full">
          {/* 로고/제목 영역 */}
          <div className="p-4 border-b flex items-center justify-between">
            {isOpen ? (
              <>
                <h1 className="text-xl font-bold text-gray-800">아크릴 맛집</h1>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  ◀
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsOpen(true)}
                className="w-full flex items-center justify-between"
              >
                <span>📂</span>
                <span>▶</span>
              </button>
            )}
          </div>

          {/* 메뉴 항목들 */}
          <nav className="flex-1 overflow-y-auto">
            <ul className="p-2">
              {menuItems.map((item) => (
                <li key={item.href} className="mb-2">
                  <Link
                    href={item.href}
                    className={`flex items-center p-2 rounded-lg transition-colors duration-200
                      ${
                        pathname === item.href
                          ? 'bg-blue-100 text-blue-700'
                          : 'hover:bg-gray-100'
                      }
                    `}
                  >
                    <span className="text-xl">{item.icon}</span>
                    {isOpen && (
                      <span className="ml-3 whitespace-nowrap">
                        {item.label}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* 로그아웃 버튼 */}
          <div className="mt-auto p-4 border-t">
            <button
              onClick={handleLogout}
              className={`flex items-center p-2 rounded-lg text-red-600 hover:bg-red-50 w-full
                ${isOpen ? 'justify-start' : 'justify-center'}`}
            >
              <span className="text-xl">🚪</span>
              {isOpen && <span className="ml-3">로그아웃</span>}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
