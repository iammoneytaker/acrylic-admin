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
  seal_size: number;
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
    seal_url: null,
    seal_size: 100,
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
        seal_url: null,
        seal_size: 100,
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
    const fileName = `seal_${Date.now()}.${fileExt}`;
    const filePath = `seals/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
    } else {
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      setCurrentSetting(prev => ({ ...prev, seal_url: publicUrl }));
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

  if (loading && settings.length === 0) return <div className="p-8 text-center">로딩 중...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8 border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">공급자 정보 설정</h1>
          <p className="text-gray-500 mt-1 text-sm">견적서에 표시될 우리 회사의 정보를 관리하고 도장 크기를 조절합니다.</p>
        </div>
        {!isEditing && (
          <button
            onClick={() => {
              setCurrentSetting({
                version_name: '새 버전',
                company_name: '아크릴맛집',
                representative: '윤우섭',
                business_number: '382-75-00268',
                address: '서울특별시 을지로33길 31 명신빌딩 1층 101호',
                contact_number: '010-2410-2474',
                email: 'official.uone@gmail.com',
                seal_url: null,
                seal_size: 100,
              });
              setIsEditing(true);
            }}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl shadow-lg hover:bg-blue-700 transition-all font-semibold flex items-center gap-2"
          >
            <span>+</span> 새 버전 추가
          </button>
        )}
      </div>

      {/* 목록 섹션 */}
      {!isEditing && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {settings.map((s) => (
            <div key={s.id} className={`group border p-6 rounded-2xl shadow-sm transition-all duration-200 ${s.is_active ? 'border-blue-500 ring-4 ring-blue-50 bg-blue-50' : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'}`}>
              <div className="flex justify-between items-start mb-4">
                <span className="font-bold text-xl text-gray-800">{s.version_name}</span>
                {s.is_active && <span className="bg-blue-600 text-white text-[10px] px-2.5 py-1 rounded-full font-black tracking-widest uppercase shadow-sm">ACTIVE</span>}
              </div>
              <div className="space-y-1 mb-6">
                <div className="text-sm font-semibold text-gray-700">{s.company_name}</div>
                <div className="text-xs text-gray-500">{s.representative} / {s.business_number}</div>
              </div>
              <div className="flex gap-2">
                {!s.is_active && (
                  <button onClick={() => handleActiveToggle(s.id)} className="flex-1 px-3 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition shadow-sm">사용하기</button>
                )}
                <button onClick={() => startEdit(s)} className={`flex-1 px-3 py-2 text-xs font-bold rounded-lg transition border ${s.is_active ? 'bg-white border-blue-200 text-blue-700 hover:bg-blue-100' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'}`}>수정</button>
                <button onClick={() => deleteSetting(s.id)} className="px-3 py-2 bg-white border border-red-100 text-red-500 text-xs font-bold rounded-lg hover:bg-red-50 transition">삭제</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 편집 및 미리보기 섹션 */}
      {isEditing && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 items-start">
          {/* 입력 폼 (Left) */}
          <div className="xl:col-span-7 bg-white p-8 rounded-3xl border border-gray-200 shadow-xl">
            <h2 className="text-2xl font-bold mb-8 text-gray-800 flex items-center gap-2">
              <span className="bg-blue-100 text-blue-600 p-2 rounded-lg text-sm">📝</span>
              {currentSetting.id ? '설정 수정' : '새 설정 만들기'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">설정 버전 이름</label>
                  <input required type="text" value={currentSetting.version_name} onChange={(e) => setCurrentSetting({...currentSetting, version_name: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all" placeholder="예: 기본, 법인용, 주식회사 등" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">상호명</label>
                    <input required type="text" value={currentSetting.company_name} onChange={(e) => setCurrentSetting({...currentSetting, company_name: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">대표자명</label>
                    <input required type="text" value={currentSetting.representative} onChange={(e) => setCurrentSetting({...currentSetting, representative: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">사업자 등록번호</label>
                    <input required type="text" value={currentSetting.business_number} onChange={(e) => setCurrentSetting({...currentSetting, business_number: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">대표전화</label>
                    <input required type="text" value={currentSetting.contact_number} onChange={(e) => setCurrentSetting({...currentSetting, contact_number: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">주소</label>
                  <input required type="text" value={currentSetting.address} onChange={(e) => setCurrentSetting({...currentSetting, address: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">이메일</label>
                  <input required type="email" value={currentSetting.email} onChange={(e) => setCurrentSetting({...currentSetting, email: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none" />
                </div>
              </div>

              <div className="pt-8 border-t border-dashed mt-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                   <span className="bg-orange-100 text-orange-600 p-2 rounded-lg text-sm">🎨</span>
                   도장 및 크기 설정
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">도장 이미지 업로드</label>
                    <div className="flex items-center justify-center w-full">
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-all">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <p className="mb-2 text-sm text-gray-500 font-semibold">클릭하여 이미지 업로드</p>
                                <p className="text-xs text-gray-400">PNG, JPG (배경 없는 이미지가 좋습니다)</p>
                            </div>
                            <input type="file" onChange={handleFileUpload} accept="image/*" className="hidden" />
                        </label>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                      <label className="block text-sm font-bold text-gray-700">도장 크기 비율</label>
                      <span className="bg-blue-600 text-white px-3 py-1 rounded-lg text-xs font-black">{currentSetting.seal_size}%</span>
                    </div>
                    <input type="range" min="50" max="300" step="5" value={currentSetting.seal_size || 100} onChange={(e) => setCurrentSetting({...currentSetting, seal_size: parseInt(e.target.value)})} className="w-full h-3 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                    <div className="flex justify-between mt-2 text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                        <span>Min (50%)</span>
                        <span>Standard (100%)</span>
                        <span>Max (300%)</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-10">
                <button type="button" onClick={() => setIsEditing(false)} className="px-8 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition">취소</button>
                <button type="submit" disabled={loading} className="px-10 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition shadow-xl hover:shadow-blue-200 active:scale-95">정보 저장하기</button>
              </div>
            </form>
          </div>

          {/* 미리보기 영역 (Right) */}
          <div className="xl:col-span-5 sticky top-8">
            <h2 className="text-2xl font-bold mb-8 text-gray-800 flex items-center gap-2">
               <span className="bg-green-100 text-green-600 p-2 rounded-lg text-sm">👀</span>
               실시간 미리보기
            </h2>
            <div className="bg-gray-100 p-10 rounded-[3rem] border-4 border-white shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 bg-white/50 backdrop-blur rounded-bl-2xl text-[10px] font-black text-gray-400">PREVIEW MODE</div>
              
              {/* 실제 견적서 공급자 정보 스타일 시뮬레이션 */}
              <div className="w-full border-[1.5px] border-black bg-white shadow-sm overflow-hidden scale-110 origin-top mt-4">
                <div className="bg-gray-100 px-4 py-2 font-bold border-b-[1.5px] border-black text-center text-sm">공급자 정보</div>
                <table className="w-full text-[11px] border-collapse leading-tight">
                  <tbody>
                    <tr>
                      <td className="border-b border-r border-black p-2 font-bold bg-gray-50 w-20 text-center">상호명</td>
                      <td className="border-b border-black p-2 text-center font-bold text-[13px]">{currentSetting.company_name}</td>
                    </tr>
                    <tr>
                      <td className="border-b border-r border-black p-2 font-bold bg-gray-50 text-center">대표자</td>
                      <td className="border-b border-black p-2 text-center">
                        <div className="flex items-center justify-center gap-4 min-h-[40px] isolate">
                          <span className="relative z-10 font-bold text-[13px]">{currentSetting.representative}</span>
                          <span className="relative flex items-center justify-center w-12 h-12">
                            <span className="z-10 font-bold text-[10px]">(인)</span>
                            {currentSetting.seal_url && (
                              <img 
                                src={currentSetting.seal_url} 
                                alt="도장" 
                                style={{ transform: `scale(${(currentSetting.seal_size || 100) / 100})` }}
                                className="absolute inset-0 w-full h-full object-contain pointer-events-none z-0 opacity-80" 
                              />
                            )}
                          </span>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className="border-b border-r border-black p-2 font-bold bg-gray-50 text-center">사업자번호</td>
                      <td className="border-b border-black p-2 text-center tabular-nums tracking-tighter text-[12px] font-medium">{currentSetting.business_number}</td>
                    </tr>
                    <tr>
                      <td className="border-b border-r border-black p-2 font-bold bg-gray-50 text-center">주소</td>
                      <td className="border-b border-black p-2 text-center text-[10px] leading-[1.1]">{currentSetting.address}</td>
                    </tr>
                    <tr>
                      <td className="border-b border-r border-black p-2 font-bold bg-gray-50 text-center">대표전화</td>
                      <td className="border-b border-black p-2 text-center tabular-nums text-[12px] font-medium">{currentSetting.contact_number}</td>
                    </tr>
                    <tr>
                      <td className="border border-black p-2 font-bold bg-gray-50 text-center">이메일</td>
                      <td className="border border-black p-2 text-center text-[10px] break-all">{currentSetting.email}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-12 space-y-2">
                <div className="h-2 w-full bg-gray-200 rounded-full"></div>
                <div className="h-2 w-3/4 bg-gray-200 rounded-full"></div>
                <div className="h-2 w-1/2 bg-gray-200 rounded-full opacity-50"></div>
              </div>
            </div>
            <div className="mt-6 bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
                <span className="text-xl">💡</span>
                <p className="text-xs text-blue-700 leading-relaxed font-medium">
                    슬라이더를 움직이면 도장이 <span className="font-bold underline">상호명을 가리지 않는지</span>, <span className="font-bold underline">대표자 성함과의 조화</span>가 어떤지 실시간으로 확인할 수 있습니다. 300%까지 크기 조절이 가능합니다.
                </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
