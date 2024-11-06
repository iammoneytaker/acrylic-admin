'use client';

import React, { useState } from 'react';
import { SupabaseData } from '@/types';

interface ExcelUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFileUpload: (file: File) => Promise<void>;
  newData: SupabaseData[];
  isAnalyzing: boolean;
  onDataInsert: () => Promise<void>;
}

const ExcelUploadModal: React.FC<ExcelUploadModalProps> = ({
  isOpen,
  onClose,
  onFileUpload,
  newData,
  isAnalyzing,
  onDataInsert,
}) => {
  const [file, setFile] = useState<File | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleAnalyze = async () => {
    if (!file) {
      alert('파일을 선택해주세요.');
      return;
    }
    await onFileUpload(file);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">엑셀 파일 업로드</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="mb-6">
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center"
            onDrop={(e) => {
              e.preventDefault();
              const files = e.dataTransfer.files;
              if (files && files[0]) setFile(files[0]);
            }}
            onDragOver={(e) => e.preventDefault()}
          >
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileChange}
              className="hidden"
              id="fileInput"
            />
            <label
              htmlFor="fileInput"
              className="cursor-pointer text-blue-500 hover:text-blue-600"
            >
              파일을 선택하거나 여기에 드래그하세요
            </label>
            {file && <p className="mt-2 text-sm text-gray-600">{file.name}</p>}
          </div>
        </div>

        {isAnalyzing ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p>분석 중...</p>
          </div>
        ) : newData.length > 0 ? (
          <div className="mb-6">
            <h3 className="font-bold mb-2">분석 결과</h3>
            <div className="max-h-60 overflow-y-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2">응답일시</th>
                    <th className="px-4 py-2">업체명</th>
                    <th className="px-4 py-2">연락처</th>
                  </tr>
                </thead>
                <tbody>
                  {newData.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="px-4 py-2">{item.response_date}</td>
                      <td className="px-4 py-2">{item.name_or_company}</td>
                      <td className="px-4 py-2">{item.contact}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        <div className="flex justify-end gap-2">
          <button
            onClick={handleAnalyze}
            disabled={!file || isAnalyzing}
            className={`px-4 py-2 rounded ${
              !file || isAnalyzing
                ? 'bg-gray-300'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            파일 분석
          </button>
          {newData.length > 0 && (
            <button
              onClick={onDataInsert}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded"
            >
              서버에 업로드 ({newData.length}개)
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExcelUploadModal;
