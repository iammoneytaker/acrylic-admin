import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import * as XLSX from 'xlsx';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(sheet);

    console.log('Parsed Excel Data:', jsonData);

    // 여기서 Supabase에 데이터를 저장하는 대신 로그만 출력합니다.
    console.log('Data to be inserted:', jsonData);

    return NextResponse.json({
      message: '데이터가 성공적으로 파싱되었습니다.',
      data: jsonData,
    });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// import { NextRequest, NextResponse } from 'next/server';
// import { supabase } from '@/lib/supabaseClient';
// import xlsx from 'xlsx';

// export async function POST(request: NextRequest) {
//   const data = await request.formData();
//   const file: File | null = data.get('file') as unknown as File;

//   if (!file) {
//     return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 });
//   }

//   const bytes = await file.arrayBuffer();
//   const buffer = Buffer.from(bytes);

//   // 엑셀 파일 파싱
//   const workbook = xlsx.read(buffer, { type: 'buffer' });
//   const sheetName = workbook.SheetNames[0];
//   const sheet = workbook.Sheets[sheetName];
//   const jsonData: any[] = xlsx.utils.sheet_to_json(sheet);

//   console.log(jsonData);

//   // 파싱된 데이터를 Supabase에 저장
//   const { data: insertedData, error } = await supabase
//     .from('submissions')
//     .insert(
//       jsonData.map((row) => ({
//         response_date: new Date(row['응답일시']).toISOString(),
//         participant_number: row['참여자'],
//         name_or_company: row['성함 혹은 업체명(*)'],
//         contact: row['연락처(*)'],
//         email: row['이메일 ( 세금계산서 하실 시 필수)'],
//         business_registration_file:
//           row['사업자 등록증 ( 세금계산서 하실 시 필수 )'],
//         privacy_agreement: row['개인정보 수집 동의(*)'] === 'Y',
//         first_time_buyer:
//           row['처음이신가요? 구매한 적 있으신가요?(*)'] === '처음입니다.',
//         product_description: row['주문하려는 상품에 대해 알려주세요:)(*)'],
//         product_size: row['제품의 사이즈를 알려주세요.(*)'],
//         thickness: row['두께를 알려주세요.(*)'],
//         material: row['재료를 알려주세요(*)'],
//         color: row['컬러를 알려주세요.(*)'],
//         quantity: parseInt(row['수량은 몇개인가요?(*)'], 10),
//         desired_delivery: row['납품은 언제쯤 원하시나요?(*)'],
//         product_image:
//           row['제품을 설명할 수 있는 자료를 올려주세요.( 이미지 )'],
//         product_drawing: row['제품 도면을 올려주세요'],
//         inquiry: row['문의사항을 적어주세요.(*)'],
//         referral_source:
//           row[
//             '아크릴 맛집을 어느 경로를 통해 오셨는지 알려주시면 감사하겠습니다!(*)'
//           ],
//       }))
//     );

//   if (error) {
//     console.error('Error inserting data:', error);
//     return NextResponse.json(
//       { error: '데이터 저장 중 오류가 발생했습니다.' },
//       { status: 500 }
//     );
//   }

//   return NextResponse.json({
//     message: '데이터가 성공적으로 업로드되었습니다.',
//     data: insertedData,
//   });
// }
