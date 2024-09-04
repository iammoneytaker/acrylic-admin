'use client';
import { useEffect, useState } from 'react';
import Auth from './components/Auth';
import ExcelParser from './components/ExcelParser';
import { Session, createClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';

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
      <h1 className="text-3xl font-bold mb-6 text-center">
        아크릴맛집 관리 시스템
      </h1>
      {!session ? <Auth /> : <ExcelParser />}
    </div>
  );
}

//TODO: Detail 화면 구성하기.
// TODO: 이미지, 문서 다운로드 받을 수 있는지 확인하기
// TODO: 거래명세서, 견적서, 상담서 작성 구현

// 'use client';

// import { useState, useEffect } from 'react';
// import { useForm, SubmitHandler } from 'react-hook-form';
// import { Submission } from '../types/index';
// import { supabase } from '../lib/supabaseClient';

// type Inputs = {
//   file: FileList;
// };

// export default function Home() {
//   const [submissions, setSubmissions] = useState<Submission[]>([]);
//   const { register, handleSubmit } = useForm<Inputs>();

//   useEffect(() => {
//     fetchSubmissions();
//   }, []);

//   const fetchSubmissions = async () => {
//     const { data, error } = await supabase
//       .from('submissions')
//       .select('*')
//       .order('created_at', { ascending: false });

//     if (error) {
//       console.error('Error fetching submissions:', error);
//     } else {
//       setSubmissions(data || []);
//     }
//   };

//   const onSubmit: SubmitHandler<Inputs> = async (data) => {
//     const formData = new FormData();
//     formData.append('file', data.file[0]);

//     try {
//       const response = await fetch('/api/upload', {
//         method: 'POST',
//         body: formData,
//       });

//       const result = await response.json();

//       if (response.ok) {
//         console.log('Server response:', result);
//         await fetchSubmissions();
//       } else {
//         console.error('Error response:', response.status, result.error);
//       }
//     } catch (error) {
//       console.error('Fetch error:', error);
//     }
//   };
//   // const onSubmit: SubmitHandler<Inputs> = async (data) => {
//   //   const formData = new FormData();
//   //   formData.append('file', data.file[0]);

//   //   const response = await fetch('/api/upload', {
//   //     method: 'POST',
//   //     body: formData,
//   //   });

//   //   if (response.ok) {
//   //     await fetchSubmissions();
//   //   }
//   // };

//   return (
//     <div className="container mx-auto p-4">
//       <h1 className="text-3xl font-bold mb-6 text-center">
//         아크릴맛집 관리 시스템
//       </h1>

//       <form onSubmit={handleSubmit(onSubmit)} className="mb-8 text-center">
//         <input
//           type="file"
//           {...register('file')}
//           accept=".xlsx,.xls"
//           className="mb-4 p-2 border border-gray-300 rounded"
//         />
//         <button
//           type="submit"
//           className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition duration-300"
//         >
//           최신 정보 불러오기
//         </button>
//       </form>

//       <h2 className="text-2xl font-semibold mb-4">제출 목록</h2>
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//         {submissions.map((submission, index) => (
//           <div
//             key={index}
//             className="bg-white shadow-md rounded-lg overflow-hidden"
//           >
//             <div className="p-4">
//               <h3 className="font-bold text-lg mb-2">
//                 {submission.name_or_company}
//               </h3>
//               <p className="text-gray-600 mb-2">
//                 <strong>연락처:</strong> {submission.contact}
//               </p>
//               <p className="text-gray-600 mb-2">
//                 <strong>제품:</strong> {submission.product_description}
//               </p>
//               <p className="text-gray-600 mb-2">
//                 <strong>수량:</strong> {submission.quantity}
//               </p>
//               <p className="text-gray-600">
//                 <strong>희망 납기일:</strong> {submission.desired_delivery}
//               </p>
//             </div>
//             {submission.product_image && (
//               <img
//                 src={submission.product_image}
//                 alt="제품 이미지"
//                 className="w-full h-48 object-cover"
//               />
//             )}
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }
