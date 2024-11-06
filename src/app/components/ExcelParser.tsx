'use client';
import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '../../lib/supabaseClient';
import { SupabaseData } from '@/types';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import ExcelUploadModal from './ExcelUploadModal';

interface ParsedData {
  [key: string]: string | number | { text: string; hyperlink: string } | null;
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    console.error('Invalid date:', dateString);
    return dateString; // 유효하지 않은 날짜는 그대로 반환
  }
  return date.toISOString().split('T')[0]; // 'YYYY-MM-DD' 형식으로 반환
};

const mapExcelDataToSupabase = (
  excelData: ParsedData,
  hyperlinks: { [key: string]: string }
): SupabaseData => {
  const getFieldValue = (field: string): string | null => {
    const hyperlinkValue = hyperlinks[field];
    const cellValue = excelData[field] as string;

    console.log(`Field: ${field}`);
    console.log(`Hyperlink value: ${hyperlinkValue}`);
    console.log(`Cell value: ${cellValue}`);

    if (hyperlinkValue && isValidHttpUrl(hyperlinkValue)) {
      console.log(`Using hyperlink value for ${field}`);
      return hyperlinkValue;
    } else if (cellValue && isValidHttpUrl(cellValue)) {
      console.log(`Using cell value as URL for ${field}`);
      return cellValue;
    } else if (cellValue) {
      console.log(`Using cell value for ${field}`);
      return cellValue;
    } else {
      console.log(`No valid value found for ${field}`);
      return null;
    }
  };

  return {
    response_date: formatDate(excelData['응답일시'] as string),
    response_date_raw: excelData['응답일시'] as string,
    participant_number: Number(excelData['참여자']),
    name_or_company: excelData['성함 혹은 업체명(*)'] as string,
    contact: excelData['연락처(*)'] as string,
    email: (excelData['이메일 ( 세금계산서 하실 시 필수)'] as string) || null,
    business_registration_file: getFieldValue(
      '사업자 등록증 ( 세금계산서 하실 시 필수 )'
    ),
    privacy_agreement: excelData['개인정보 수집 동의(*)'] === 'Y',
    first_time_buyer:
      excelData['처음이신가요? 구매한 적 있으신가요?(*)'] === '처음입니다.',
    product_description: excelData[
      '주문하려는 상품에 대해 알려주세요:)(*)'
    ] as string,
    product_size: excelData['제품의 사이즈를 알려주세요.(*)'] as string,
    thickness: excelData['두께를 알려주세요.(*)'] as string,
    material: excelData['재료를 알려주세요(*)'] as string,
    color: excelData['컬러를 알려주세요.(*)'] as string,
    quantity: excelData['수량은 몇개인가요?(*)']?.toString() || null,
    desired_delivery: excelData['납품은 언제쯤 원하시나요?(*)'] as string,
    product_image: getFieldValue(
      '제품을 설명할 수 있는 자료를 올려주세요.( 이미지 )'
    ),
    product_drawing: getFieldValue('제품 도면을 올려주세요'),
    inquiry: excelData['문의사항을 적어주세요.(*)'] as string,
    referral_source:
      (excelData[
        '아크릴 맛집을 어느 경로를 통해 오셨는지 알려주시면 감사하겠습니다!(*)'
      ] as string) || null,
    checked: false,
  };
};

function isValidHttpUrl(string: string) {
  const regex = /(http|https):\/\//;
  return regex.test(string);
}

const ExcelParser: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [parsedData, setParsedData] = useState<SupabaseData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [newData, setNewData] = useState<SupabaseData[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const itemsPerPage = 10;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    fetchDataFromSupabase();
    const storedPage = localStorage.getItem('currentPage');
    const storedSearch = localStorage.getItem('searchTerm');
    const urlPage = searchParams.get('page');
    const urlSearch = searchParams.get('search');

    if (urlPage) {
      setCurrentPage(parseInt(urlPage));
    } else if (storedPage) {
      setCurrentPage(parseInt(storedPage));
    }

    if (urlSearch) {
      setSearchTerm(urlSearch);
    } else if (storedSearch) {
      setSearchTerm(storedSearch);
    }
  }, [searchParams]);

  useEffect(() => {
    localStorage.setItem('currentPage', currentPage.toString());
    localStorage.setItem('searchTerm', searchTerm);
    router.push(
      `?page=${currentPage}&search=${encodeURIComponent(searchTerm)}`,
      { scroll: false }
    );
  }, [currentPage, searchTerm, router]);

  // 체크 리스트 변경
  const handleCheckChange = async (id: number, checked: boolean) => {
    const updatedData = parsedData.map((item) =>
      item.id === id ? { ...item, checked } : item
    );
    setParsedData(updatedData);

    const { data, error } = await supabase
      .from('submissions')
      .update({ checked })
      .eq('id', id);

    if (error) {
      console.error('Error updating checked status:', error);
    }
  };

  const fetchDataFromSupabase = async () => {
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .order('response_date_raw', { ascending: true });

    if (error) {
      console.error('Error fetching data from Supabase:', error);
    } else {
      console.log('Fetched data from Supabase:', data);
      setParsedData(data || []);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    setIsAnalyzing(true);
    try {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json<ParsedData>(ws, {
          raw: false,
          defval: null,
        });

        // console.log('Raw Excel data:', data);

        const mappedData = data.map((row, index) => {
          // 각 행에 대한 하이퍼링크 추출
          const rowHyperlinks: { [key: string]: string } = {};
          Object.keys(ws).forEach((cell) => {
            if (ws[cell].l) {
              const cellAddress = XLSX.utils.decode_cell(cell);
              if (cellAddress.r === index + 1) {
                const header = Object.keys(row)[cellAddress.c];
                rowHyperlinks[header] = ws[cell].l.Target;
              }
            }
          });

          // console.log(`Row ${index + 1} hyperlinks:`, rowHyperlinks);
          // console.log(`Row ${index + 1} data:`, row);

          const mappedRow = mapExcelDataToSupabase(row, rowHyperlinks);
          console.log(`Mapped row ${index + 1}:`, mappedRow);

          return mappedRow;
        });

        console.log(mappedData);

        const existingDataMap = new Map(
          parsedData.map((item) => [
            `${formatDate(item.response_date)}-${item.participant_number}`,
            item,
          ])
        );
        console.log(existingDataMap);

        const newAndUpdatedData = mappedData.filter((newItem) => {
          const key = `${formatDate(newItem.response_date)}-${
            newItem.participant_number
          }`;
          const existingItem = existingDataMap.get(key);

          if (!existingItem) {
            console.log('New item:', newItem);
            return true; // 새로운 데이터
          }

          const isUpdated =
            newItem.response_date_raw !== existingItem.response_date_raw;

          if (isUpdated) {
            console.log(
              newItem.product_image?.toLowerCase() !==
                existingItem.product_image?.toLowerCase()
            );
            console.log('Updated item:', newItem);
            console.log('exist item:', existingItem);
          }
          return isUpdated;
        });

        console.log('Total rows in Excel:', mappedData.length);
        console.log('Existing data in parsedData:', parsedData.length);
        console.log('Sample existing item:', parsedData[0]);
        console.log('Sample new item:', mappedData[0]);
        console.log('New and updated data:', newAndUpdatedData.length);
        alert('새로운 파일에서 새로운 고객 수: ' + newAndUpdatedData.length);
        setNewData(newAndUpdatedData);
      };
      reader.readAsBinaryString(file);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDataInsert = async () => {
    if (newData.length === 0) {
      alert('새로운 데이터가 없습니다.');
      return;
    }

    const { data, error } = await supabase.from('submissions').upsert(newData, {
      onConflict: 'response_date,participant_number',
      ignoreDuplicates: false,
    });

    if (error) {
      console.error('Error inserting data to Supabase:', error);
      alert('데이터 삽입 중 오류가 발생했습니다.');
    } else {
      alert(`${newData.length}개의 데이터가 성공적으로 업로드되었습니다.`);
      fetchDataFromSupabase(); // 데이터 새로고침
      setNewData([]); // 새 데이터 초기화
    }
  };

  const filteredData = parsedData
    .filter(
      (item) =>
        item.name_or_company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.product_description
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        item.contact.includes(searchTerm)
    )
    .reverse();
  console.log(searchTerm);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = e.target.value;
    setSearchTerm(newSearchTerm);
    setCurrentPage(1); // 검색할 때마다 페이지를 1로 재설정
    router.push(`?page=1&search=${encodeURIComponent(newSearchTerm)}`, {
      scroll: false,
    });
  };

  return (
    <div className="container mx-auto p-4">
      <input
        type="text"
        placeholder="검색..."
        value={searchTerm}
        onChange={handleSearch}
        className="mb-4 p-2 border border-gray-300 rounded w-full"
      />

      <div className="mb-4 flex flex-col sm:flex-row items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="mx-1 px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
          >
            이전
          </button>
          <span className="mx-4 py-2">
            {currentPage} / {Math.ceil(filteredData.length / itemsPerPage)}
          </span>
          <button
            onClick={() =>
              setCurrentPage((prev) =>
                Math.min(
                  prev + 1,
                  Math.ceil(filteredData.length / itemsPerPage)
                )
              )
            }
            disabled={
              currentPage === Math.ceil(filteredData.length / itemsPerPage)
            }
            className="mx-1 px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
          >
            다음
          </button>
        </div>
      </div>

      {/* PC 테이블 뷰 */}
      <div className="hidden sm:block">
        {filteredData.length > 0 && (
          <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left">체크</th>
                <th className="px-4 py-2 text-left">응답일시</th>
                <th className="px-4 py-2 text-left w-1/4 whitespace-nowrap overflow-hidden text-ellipsis">
                  성함 혹은 업체명
                </th>
                <th className="px-4 py-2 text-left">연락처</th>
                <th className="px-4 py-2 text-left">이메일</th>
                <th className="px-4 py-2 text-left">주문 상품</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((row, index) => (
                <tr
                  key={index}
                  className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}
                >
                  <td className="px-4 py-2">
                    <input
                      type="checkbox"
                      checked={row.checked || false}
                      onChange={(e) =>
                        handleCheckChange(row.id!, e.target.checked)
                      }
                      className="form-checkbox h-5 w-5 text-blue-600"
                    />
                  </td>
                  <td className="px-4 py-2">{formatDate(row.response_date)}</td>
                  <td className="px-4 py-2">
                    <Link
                      href={`/detail/${row.id}`}
                      className="text-blue-500 hover:underline"
                    >
                      {row.name_or_company}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{row.contact}</td>
                  <td className="px-4 py-2">{row.email}</td>
                  <td className="px-4 py-2">{row.product_description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 모바일 카드 뷰 */}
      <div className="sm:hidden">
        <div className="grid grid-cols-1 gap-4">
          {paginatedData.map((row, index) => (
            <div key={index} className="bg-white shadow-md rounded-lg p-4">
              <h3 className="font-bold text-lg mb-2">{row.name_or_company}</h3>
              <input
                type="checkbox"
                checked={row.checked || false}
                onChange={(e) => handleCheckChange(row.id!, e.target.checked)}
                className="form-checkbox h-5 w-5 text-blue-600"
              />
              <p className="text-sm text-gray-600 mb-1">
                응답일시: {formatDate(row.response_date)}
              </p>
              <p className="text-sm text-gray-600 mb-1">
                연락처: {row.contact}
              </p>
              <p className="text-sm text-gray-600 mb-1">
                이메일: {row.email || 'N/A'}
              </p>
              <p className="text-sm text-gray-600 mb-3">
                주문 상품: {row.product_description}
              </p>
              <Link
                href={`/detail/${row.id}`}
                className="text-blue-500 hover:underline text-sm"
              >
                상세보기
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* 파일 업로드 버튼 */}
      <div className="fixed bottom-4 right-4">
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-4 shadow-lg"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>
      </div>

      {/* 업로드 모달 */}
      <ExcelUploadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onFileUpload={handleFileUpload}
        newData={newData}
        isAnalyzing={isAnalyzing}
        onDataInsert={handleDataInsert}
      />
    </div>
  );
};

export default ExcelParser;
