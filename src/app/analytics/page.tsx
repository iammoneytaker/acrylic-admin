'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from 'chart.js';
import Link from 'next/link';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
);

const AnalyticsPage = () => {
  const [referralData, setReferralData] = useState<{ [key: string]: number }>(
    {}
  );
  const [monthlyData, setMonthlyData] = useState<{
    [key: string]: { [key: string]: number };
  }>({});
  const [weeklyData, setWeeklyData] = useState<{
    [key: string]: { [key: string]: number };
  }>({});
  const [monthlyTotalData, setMonthlyTotalData] = useState<{
    [key: string]: number;
  }>({});
  const [colorData, setColorData] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    fetchReferralData();
  }, []);

  const fetchReferralData = async () => {
    const { data, error } = await supabase
      .from('submissions')
      .select('referral_source, response_date, color');

    if (error) {
      console.error('Error fetching referral data:', error);
    } else {
      const referralCounts: { [key: string]: number } = {};
      const monthlyReferralCounts: {
        [key: string]: { [key: string]: number };
      } = {};
      const weeklyReferralCounts: { [key: string]: { [key: string]: number } } =
        {};
      const monthlyTotalData: { [key: string]: number } = {};
      const colorCounts: { [key: string]: number } = {};

      data.forEach((item) => {
        if (item.referral_source && item.response_date) {
          const source = item.referral_source.trim();
          referralCounts[source] = (referralCounts[source] || 0) + 1;

          const date = new Date(item.response_date);
          const monthKey = `${date.getFullYear()}-${String(
            date.getMonth() + 1
          ).padStart(2, '0')}`;
          const weekKey = getWeekNumber(date);

          if (!monthlyReferralCounts[monthKey])
            monthlyReferralCounts[monthKey] = {};
          if (!weeklyReferralCounts[weekKey])
            weeklyReferralCounts[weekKey] = {};

          monthlyReferralCounts[monthKey][source] =
            (monthlyReferralCounts[monthKey][source] || 0) + 1;
          weeklyReferralCounts[weekKey][source] =
            (weeklyReferralCounts[weekKey][source] || 0) + 1;

          monthlyTotalData[monthKey] = (monthlyTotalData[monthKey] || 0) + 1;
        }

        if (item.color) {
          const colors = item.color.split(',').map((c: string) => c.trim());
          colors.forEach((color: string) => {
            colorCounts[color] = (colorCounts[color] || 0) + 1;
          });
        }
      });

      setReferralData(referralCounts);
      setMonthlyData(monthlyReferralCounts);
      setWeeklyData(weeklyReferralCounts);
      setMonthlyTotalData(monthlyTotalData);
      setColorData(colorCounts);
    }
  };

  const getWeekNumber = (d: Date) => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(
      ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
    );
    return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
  };

  const pieChartData = {
    labels: Object.keys(referralData),
    datasets: [
      {
        data: Object.values(referralData),
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40',
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
        ],
        hoverBackgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40',
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
        ],
      },
    ],
  };

  const createTimeSeriesData = (data: {
    [key: string]: { [key: string]: number };
  }) => {
    const labels = Object.keys(data).sort();
    const datasets = Object.keys(referralData).map((source, index) => ({
      label: source,
      data: labels.map((label) => data[label][source] || 0),
      backgroundColor: pieChartData.datasets[0].backgroundColor[index],
    }));

    return { labels, datasets };
  };

  const monthlyChartData = createTimeSeriesData(monthlyData);
  const weeklyChartData = createTimeSeriesData(weeklyData);

  const monthlyTotalChartData = {
    labels: Object.keys(monthlyTotalData).sort(),
    datasets: [
      {
        label: '월별 총 유입량',
        data: Object.values(monthlyTotalData),
        backgroundColor: '#4BC0C0',
        borderColor: '#36A2EB',
        borderWidth: 1,
      },
    ],
  };

  const colorChartData = {
    labels: Object.keys(colorData),
    datasets: [
      {
        label: '색상별 선호도',
        data: Object.values(colorData),
        backgroundColor: '#36A2EB',
        borderColor: '#36A2EB',
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">유입 경로 분석</h1>
        <Link
          href="/"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-300 ease-in-out"
        >
          메인 페이지로 돌아가기
        </Link>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">전체 유입 경로 분포</h2>
        <div className="w-full md:w-2/3 lg:w-1/2 mx-auto">
          <Pie data={pieChartData} />
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">월별 유입 경로 추이</h2>
        <Bar
          data={monthlyChartData}
          options={{
            responsive: true,
            scales: { x: { stacked: true }, y: { stacked: true } },
          }}
        />
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">주별 유입 경로 추이</h2>
        <Bar
          data={weeklyChartData}
          options={{
            responsive: true,
            scales: { x: { stacked: true }, y: { stacked: true } },
          }}
        />
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">월별 총 유입량 추이</h2>
        <Bar
          data={monthlyTotalChartData}
          options={{
            responsive: true,
            scales: { y: { beginAtZero: true } },
          }}
        />
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">색상별 선호도</h2>
        <Bar
          data={colorChartData}
          options={{
            responsive: true,
            scales: { y: { beginAtZero: true } },
          }}
        />
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-2">경로별 고객 수</h2>
        <ul className="space-y-2">
          {Object.entries(referralData)
            .sort(([, a], [, b]) => b - a)
            .map(([source, count]) => (
              <li
                key={source}
                className="flex justify-between items-center bg-gray-100 p-2 rounded"
              >
                <span>{source}</span>
                <span className="font-bold">{count}명</span>
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
};

export default AnalyticsPage;
