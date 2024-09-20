import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface SourceSelectorProps {
  onSelect: (type: string, id: number, title: string) => void;
  onClose: () => void;
}

const SourceSelector: React.FC<SourceSelectorProps> = ({
  onSelect,
  onClose,
}) => {
  const [sourceType, setSourceType] = useState<
    '엑셀 리스트' | '직접 입력 리스트'
  >('엑셀 리스트');
  const [sources, setSources] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const observer = useRef<IntersectionObserver | null>(null);

  const lastSourceElementRef = useCallback(
    (node: HTMLLIElement | null) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prevPage) => prevPage + 1);
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, hasMore]
  );

  useEffect(() => {
    setSources([]);
    setPage(0);
    setHasMore(true);
  }, [sourceType, searchTerm]);

  useEffect(() => {
    fetchSources();
  }, [sourceType, page, searchTerm]);

  const fetchSources = async () => {
    setLoading(true);
    const limit = 20;
    let query = supabase
      .from(sourceType === '엑셀 리스트' ? 'submissions' : 'manual_entries')
      .select('id, name_or_company')
      .order('id', { ascending: false }) // 여기를 수정했습니다
      .range(page * limit, (page + 1) * limit - 1);

    if (searchTerm) {
      query = query.ilike('name_or_company', `%${searchTerm}%`);
    }

    let { data, error } = await query;

    if (error) console.error('Error fetching sources:', error);
    else {
      setSources((prevSources) => [...prevSources, ...(data || [])]);
      setHasMore(data?.length === limit);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3 text-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            소스 선택
          </h3>
          <div className="mt-2 px-7 py-3">
            <select
              value={sourceType}
              onChange={(e) =>
                setSourceType(
                  e.target.value as '엑셀 리스트' | '직접 입력 리스트'
                )
              }
              className="w-full p-2 border rounded mb-2"
            >
              <option value="엑셀 리스트">엑셀 리스트</option>
              <option value="직접 입력 리스트">직접 입력 리스트</option>
            </select>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="이름으로 검색..."
              className="w-full p-2 border rounded mb-2"
            />
            <ul className="mt-4 max-h-60 overflow-y-auto">
              {sources.map((source, index) => (
                <li
                  key={source.id}
                  ref={
                    index === sources.length - 1 ? lastSourceElementRef : null
                  }
                  className="cursor-pointer hover:bg-gray-100 p-2"
                  onClick={() =>
                    onSelect(sourceType, source.id, source.name_or_company)
                  }
                >
                  {source.name_or_company} (ID: {source.id})
                </li>
              ))}
              {loading && <li className="text-center">로딩 중...</li>}
            </ul>
          </div>
          <div className="items-center px-4 py-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SourceSelector;
