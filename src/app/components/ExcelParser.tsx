'use client';
import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '../../lib/supabaseClient';
import { SupabaseData } from '@/types';
import Link from 'next/link';

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
  return {
    response_date: formatDate(excelData['응답일시'] as string),
    participant_number: Number(excelData['참여자']),
    name_or_company: excelData['성함 혹은 업체명(*)'] as string,
    contact: excelData['연락처(*)'] as string,
    email: excelData['이메일 ( 세금계산서 하실 시 필수)'] as string,
    business_registration_file:
      hyperlinks['사업자 등록증 ( 세금계산서 하실 시 필수 )'] ||
      (excelData['사업자 등록증 ( 세금계산서 하실 시 필수 )'] as string),
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
    product_image:
      hyperlinks['제품을 설명할 수 있는 자료를 올려주세요.( 이미지 )'] ||
      (excelData[
        '제품을 설명할 수 있는 자료를 올려주세요.( 이미지 )'
      ] as string),
    product_drawing:
      hyperlinks['제품 도면을 올려주세요'] ||
      (excelData['제품 도면을 올려주세요'] as string),
    inquiry: excelData['문의사항을 적어주세요.(*)'] as string,
    referral_source: excelData[
      '아크릴 맛집을 어느 경로를 통해 오셨는지 알려주시면 감사하겠습니다!(*)'
    ] as string,
  };
};

const ExcelParser: React.FC = () => {
  const [parsedData, setParsedData] = useState<SupabaseData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [newData, setNewData] = useState<SupabaseData[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchDataFromSupabase();
  }, []);

  const fetchDataFromSupabase = async () => {
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .order('response_date', { ascending: true });

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

  const handleFileUpload = async () => {
    if (!file) {
      alert('파일을 선택해주세요.');
      return;
    }

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

      // Extract hyperlinks
      const hyperlinks: { [key: string]: string } = {};
      Object.keys(ws).forEach((cell) => {
        if (ws[cell].l) {
          const col = XLSX.utils.decode_col(cell.replace(/\d+$/, ''));
          const row = XLSX.utils.decode_row(cell.replace(/^[A-Z]+/, ''));
          const header = Object.keys(data[0])[col];
          hyperlinks[header] = ws[cell].l.Target;
        }
      });

      const mappedData = data.map((row) =>
        mapExcelDataToSupabase(row, hyperlinks)
      );

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
          newItem.product_description !== existingItem.product_description ||
          newItem.product_description !== existingItem.thickness ||
          newItem.product_description !== existingItem.product_size ||
          newItem.product_description !== existingItem.product_image ||
          newItem.product_description !==
            existingItem.business_registration_file;

        if (isUpdated) {
          console.log('Updated item:', newItem);
        }
        return isUpdated;
      });

      console.log('Total rows in Excel:', mappedData.length);
      console.log('Existing data in parsedData:', parsedData.length);
      console.log('Sample existing item:', parsedData[0]);
      console.log('Sample new item:', mappedData[0]);
      console.log('New and updated data:', newAndUpdatedData.length);

      setNewData(newAndUpdatedData);
    };
    reader.readAsBinaryString(file);
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
          .includes(searchTerm.toLowerCase())
    )
    .reverse();

  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="container mx-auto p-4">
      <div className="mb-4">
        <input
          type="file"
          accept=".xlsx, .xls"
          onChange={handleFileChange}
          className="p-2 border border-gray-300 rounded"
        />
        <button
          onClick={handleFileUpload}
          className="ml-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          파일 분석
        </button>
        <button
          onClick={handleDataInsert}
          className="ml-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          서버에 업로드
        </button>
      </div>

      <input
        type="text"
        placeholder="검색..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-4 p-2 border border-gray-300 rounded w-full"
      />

      <div className="mt-4 flex justify-center">
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
              Math.min(prev + 1, Math.ceil(filteredData.length / itemsPerPage))
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

      {filteredData.length > 0 && (
        <>
          <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-center w-1/5 ">응답일시</th>
                <th className="px-4 py-2 text-center w-1/5">
                  성함 혹은 업체명
                </th>
                <th className="px-4 py-2 text-center w-1/5">연락처</th>
                <th className="px-4 py-2 text-center w-1/5">이메일</th>
                <th className="px-4 py-2 text-center w-1/5">주문 상품</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((row, index) => (
                <tr
                  key={index}
                  className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}
                >
                  <td className="px-4 py-2 text-center">
                    {formatDate(row.response_date)}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <Link
                      href={`/detail/${row.id}`}
                      className="text-blue-500 hover:underline"
                    >
                      {row.name_or_company}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-center">{row.contact}</td>
                  <td className="px-4 py-2 text-center">{row.email}</td>
                  <td className="px-4 py-2">{row.product_description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};

export default ExcelParser;
