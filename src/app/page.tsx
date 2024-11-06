'use client';
import ExcelParser from './components/ExcelParser';

export default function Home() {
  return (
    <>
      <h1 className="text-3xl font-extrabold text-center text-gray-900 mb-8">
        아크릴 맛집 관리 시스템
      </h1>
      <ExcelParser />
    </>
  );
}
