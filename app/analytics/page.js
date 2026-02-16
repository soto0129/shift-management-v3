// app/analytics/page.js
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function AnalyticsPage() {
  const { user } = useAuth()
  
  const [staffList, setStaffList] = useState([])
  const [shifts, setShifts] = useState([])
  const [analytics, setAnalytics] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user) fetchData()
  }, [user])

  // スタッフとシフトデータを取得
  async function fetchData() {
    try {
      setIsLoading(true)
      
      const [staffResult, shiftsResult] = await Promise.all([
        supabase.from('staff').select('*').eq('user_id', user.id).order('name'),
        supabase.from('shifts').select('*').eq('user_id', user.id)
      ])
      
      if (staffResult.error) throw staffResult.error
      if (shiftsResult.error) throw shiftsResult.error
      
      const staff = staffResult.data || []
      const shiftsData = shiftsResult.data || []
      
      setStaffList(staff)
      setShifts(shiftsData)
      calculateAnalytics(staff, shiftsData)
    } catch (err) {
      console.error('データ取得失敗:', err)
      toast.error('データの取得に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  // 統計データを計算
  function calculateAnalytics(staff, shiftsData) {
    const analyticsData = staff.map(s => {
      const staffShifts = shiftsData.filter(shift => shift.staff_id === s.id)
      
      // 総労働時間を計算
      const totalHours = staffShifts.reduce((sum, shift) => {
        const start = parseTime(shift.start_time)
        const end = parseTime(shift.end_time)
        return sum + (end - start) / 60
      }, 0)
      
      return {
        staffId: s.id,
        staffName: s.name,
        totalHours: totalHours,
        totalCost: totalHours * s.hourly_wage,
        shiftCount: staffShifts.length
      }
    })
    
    setAnalytics(analyticsData)
  }

  // 時刻文字列を分に変換
  function parseTime(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number)
    return hours * 60 + minutes
  }

  // グラフ表示用の最大時間
  const maxHours = Math.max(...analytics.map(a => a.totalHours), 1)

  return (
    <div className='min-h-screen p-8 bg-gray-50'>
      <div className='max-w-6xl mx-auto'>
        {/* ページヘッダー */}
        <div className='mb-6'>
          <Link href='/' className='text-blue-600 hover:text-blue-700 hover:underline mb-4 inline-block'>← ホームに戻る</Link>
          <h1 className='text-3xl font-bold'>勤務統計</h1>
        </div>

        {isLoading ? (
          <div className='flex items-center justify-center py-12'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
          </div>
        ) : (
          <>
            {/* 棒グラフ */}
            <div className='bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8'>
              <h2 className='text-xl font-semibold mb-6'>スタッフ別労働時間</h2>
              {analytics.length === 0 ? (
                <p className='text-gray-500 text-center py-8'>シフトデータがありません</p>
              ) : (
                <div className='space-y-4'>
                  {analytics.map((data) => (
                    <div key={data.staffId} className='space-y-1'>
                      <div className='flex justify-between text-sm'>
                        <span className='font-medium'>{data.staffName}</span>
                        <span className='text-gray-600'>{data.totalHours.toFixed(1)}時間 / {data.shiftCount}日</span>
                      </div>
                      {/* 横棒グラフ */}
                      <div className='w-full bg-gray-100 rounded-full h-6 overflow-hidden'>
                        <div className='bg-blue-600 h-full flex items-center justify-end px-2 text-white text-xs font-semibold transition-all duration-300'
                          style={{ width: `${(data.totalHours / maxHours) * 100}%` }}>
                          {data.totalHours > 0 && `${data.totalHours.toFixed(1)}h`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 詳細テーブル */}
            <div className='bg-white p-6 rounded-lg shadow-sm border border-gray-200'>
              <h2 className='text-xl font-semibold mb-4'>詳細データ</h2>
              {analytics.length === 0 ? (
                <p className='text-gray-500 text-center py-8'>データがありません</p>
              ) : (
                <div className='overflow-x-auto'>
                  <table className='w-full'>
                    <thead className='bg-gray-50'>
                      <tr>
                        <th className='px-4 py-3 text-left font-semibold'>スタッフ名</th>
                        <th className='px-4 py-3 text-left font-semibold'>勤務日数</th>
                        <th className='px-4 py-3 text-left font-semibold'>総労働時間</th>
                        <th className='px-4 py-3 text-left font-semibold'>総人件費</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.map((data) => (
                        <tr key={data.staffId} className='border-t hover:bg-gray-50 transition-colors'>
                          <td className='px-4 py-3'>{data.staffName}</td>
                          <td className='px-4 py-3'>{data.shiftCount}日</td>
                          <td className='px-4 py-3'>{data.totalHours.toFixed(1)}時間</td>
                          <td className='px-4 py-3'>{data.totalCost.toLocaleString()}円</td>
                        </tr>
                      ))}
                    </tbody>
                    {/* 合計行 */}
                    <tfoot className='bg-gray-50 font-semibold'>
                      <tr className='border-t-2'>
                        <td className='px-4 py-3'>合計</td>
                        <td className='px-4 py-3'>{analytics.reduce((sum, a) => sum + a.shiftCount, 0)}日</td>
                        <td className='px-4 py-3'>{analytics.reduce((sum, a) => sum + a.totalHours, 0).toFixed(1)}時間</td>
                        <td className='px-4 py-3'>{analytics.reduce((sum, a) => sum + a.totalCost, 0).toLocaleString()}円</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
