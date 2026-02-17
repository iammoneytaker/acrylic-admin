'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface SupplierSetting {
  id: number;
  version_name: string;
  is_active: boolean;
  company_name: string;
  representative: string;
  business_number: string;
  address: string;
  contact_number: string;
  email: string;
  seal_url: string | null;
  is_corporate: boolean;
  corporate_name: string | null;
}

const SettingsPage = () => {
  const [settings, setSettings] = useState<SupplierSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentSetting, setCurrentSetting] = useState<Partial<SupplierSetting>>({
    version_name: '',
    company_name: '',
    representative: '',
    business_number: '',
    address: '',
    contact_number: '',
    email: '',
    is_corporate: false,
    corporate_name: '',
    seal_url: null,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('supplier_settings')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error('Error fetching settings:', error);
    } else {
      setSettings(data || []);
    }
    setLoading(false);
  };

  const handleActiveToggle = async (id: number) => {
    // 모든 설정을 비활성화하고 선택한 것만 활성화
    await supabase.from('supplier_settings').update({ is_active: false }).neq('id', id);
    const { error } = await supabase.from('supplier_settings').update({ is_active: true }).eq('id', id);

    if (error) {
      console.error('Error toggling active status:', error);
    } else {
      fetchSettings();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { id, ...dataToSave } = currentSetting;

    let error;
    if (id) {
      const { error: updateError } = await supabase
        .from('supplier_settings')
        .update(dataToSave)
        .eq('id', id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('supplier_settings')
        .insert([dataToSave]);
      error = insertError;
    }

    if (error) {
      console.error('Error saving setting:', error);
    } else {
      setIsEditing(false);
      setCurrentSetting({
        version_name: '',
        company_name: '',
        representative: '',
        business_number: '',
        address: '',
        contact_number: '',
        email: '',
        is_corporate: false,
        corporate_name: '',
        seal_url: null,
      });
      fetchSettings();
    }
    setLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `seal_${Math.random()}.${fileExt}`;
    const filePath = `seals/${fileName}`;

    const { error: uploadError, data } = await supabase.storage
      .from('product-images')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
    } else {
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      setCurrentSetting({ ...currentSetting, seal_url: publicUrl });
    }
    setLoading(false);
  };

  const startEdit = (setting: SupplierSetting) => {
    setCurrentSetting(setting);
    setIsEditing(true);
  };

  const deleteSetting = async (id: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    
    const { error } = await supabase
      .from('supplier_settings')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting setting:', error);
    } else {
      fetchSettings();
    }
  };

  if (loading && settings.length === 0) return <div className="p-8">로딩 중...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">공급자 정보 설정</h1>

      {/* 목록 섹션 */}
      <div className="mb-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">저장된 공급자 버전</h2>
          <button
            onClick={() => {
              setCurrentSetting({
                version_name: '',
                company_name: '아크릴맛집',
                representative: '윤우섭',
                business_number: '382-75-00268',
                address: '서울특별시 을지로33길 31 명신빌딩 1층 101호',
                contact_number: '010-2410-2474',
                email: 'official.uone@gmail.com',
                is_corporate: false,
                corporate_name: '',
                seal_url: null,
              });
              setIsEditing(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            + 새 버전 추가
          </button>
        </div>
        
        <div className="grid gap-4">
          {settings.map((s) => (
            <div key={s.id} className={`border p-4 rounded-lg shadow-sm flex justify-between items-center ${s.is_active ? 'border-blue-500 bg-blue-50' : 'bg-white'}`}>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg">{s.version_name}</span>
                  {s.is_active && <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">사용 중</span>}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {s.company_name} | {s.representative} | {s.business_number}
                </div>
              </div>
              <div className="flex gap-2">
                {!s.is_active && (
                  <button onClick={() => handleActiveToggle(s.id)} className="px-3 py-1 border border-blue-500 text-blue-500 rounded hover:bg-blue-50">활성화</button>
                )}
                <button onClick={() => startEdit(s)} className="px-3 py-1 border border-gray-400 text-gray-700 rounded hover:bg-gray-50">수정</button>
                <button onClick={() => deleteSetting(s.id)} className="px-3 py-1 border border-red-500 text-red-500 rounded hover:bg-red-50">삭제</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 편집/추가 섹션 */}
      {isEditing && (
        <div className="border-t pt-8">
          <h2 className="text-xl font-semibold mb-4">{currentSetting.id ? '정보 수정' : '새 정보 추가'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4 bg-gray-50 p-6 rounded-xl border">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">버전 이름</label>
                <input
                  required
                  type="text"
                  value={currentSetting.version_name}
                  onChange={(e) => setCurrentSetting({...currentSetting, version_name: e.target.value})}
                  className="w-full p-2 border rounded"
                  placeholder="예: 기본, 법인용, 이벤트용"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">상호명</label>
                <input
                  required
                  type="text"
                  value={currentSetting.company_name}
                  onChange={(e) => setCurrentSetting({...currentSetting, company_name: e.target.value})}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">대표자명</label>
                <input
                  required
                  type="text"
                  value={currentSetting.representative}
                  onChange={(e) => setCurrentSetting({...currentSetting, representative: e.target.value})}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">사업자 등록번호</label>
                <input
                  required
                  type="text"
                  value={currentSetting.business_number}
                  onChange={(e) => setCurrentSetting({...currentSetting, business_number: e.target.value})}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">대표전화</label>
                <input
                  required
                  type="text"
                  value={currentSetting.contact_number}
                  onChange={(e) => setCurrentSetting({...currentSetting, contact_number: e.target.value})}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">주소</label>
                <input
                  required
                  type="text"
                  value={currentSetting.address}
                  onChange={(e) => setCurrentSetting({...currentSetting, address: e.target.value})}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">이메일</label>
                <input
                  required
                  type="email"
                  value={currentSetting.email}
                  onChange={(e) => setCurrentSetting({...currentSetting, email: e.target.value})}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="flex items-center gap-4 mt-6">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={currentSetting.is_corporate}
                    onChange={(e) => setCurrentSetting({...currentSetting, is_corporate: e.target.checked})}
                    className="w-4 h-4"
                  />
                  <span>법인 여부</span>
                </label>
                {currentSetting.is_corporate && (
                  <input
                    type="text"
                    value={currentSetting.corporate_name || ''}
                    onChange={(e) => setCurrentSetting({...currentSetting, corporate_name: e.target.value})}
                    placeholder="법인명 입력"
                    className="p-1 border rounded"
                  />
                )}
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium mb-1">도장 이미지</label>
              <div className="flex items-center gap-4">
                <input type="file" onChange={handleFileUpload} accept="image/*" className="text-sm" />
                {currentSetting.seal_url && (
                  <img src={currentSetting.seal_url} alt="도장" className="w-16 h-16 object-contain border bg-white" />
                )}
              </div>
            </div>

            <div className="flex gap-2 justify-end mt-6">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-6 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? '저장 중...' : '설정 저장'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
