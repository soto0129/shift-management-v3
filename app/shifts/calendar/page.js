// app/shifts/calendar/page.js
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { ConfirmDialog } from '@/components/ConfirmDialog'

export default function CalendarPage() {
  const { user } = useAuth()
  
  const [currentDate, setCurrentDate] = useState(new Date())
  const [shifts, setShifts] = useState([])
  const [staffList, setStaffList] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [deleteDialog, setDeleteDialog] = useState({ open: false, shiftId: null })

  useEffect(() => {
    if (user) fetchData()
  }, [user, currentDate])

  // スタッフとシフトデータを取得
  async function fetchData() {
    try {
      setIsLoading(true)
      
      // 月の範囲を計算
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth()
      const startOfMonth = new Date(year, month, 1).toISOString().split('T')[0]
      const endOfMonth = new Date(year, month + 1, 0).toISOString().split('T')[0]
      
      // スタッフとシフトを並行取得
      const [staffResult, shiftsResult] = await Promise.all([
        supabase.from('staff').select('*').eq('user_id', user.id).order('name'),
        supabase.from('shifts').select('*').eq('user_id', user.id).gte('date', startOfMonth).lte('date', endOfMonth)
      ])
      
      if (staffResult.error) throw staffResult.error
      if (shiftsResult.error) throw shiftsResult.error
      
      setStaffList(staffResult.data || [])
      setShifts(shiftsResult.data || [])
    } catch (err) {
      console.error('データ取得失敗:', err)
      toast.error('データの取得に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  // 前月へ移動
  function prevMonth() {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  // 翌月へ移動
  function nextMonth() {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  // カレンダーの日付配列を生成
  function generateCalendarDays() {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const days = []
    
    // 月初の曜日分の空白を追加
    for (let i = 0; i < firstDay.getDay(); i++) days.push(null)
    // 日付を追加
    for (let i = 1; i <= lastDay.getDate(); i++) days.push(i)
    
    return days
  }

  // 指定日のシフトを取得
  function getShiftsForDay(day) {
    if (!day) return []
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return shifts.filter(s => s.date === dateStr)
  }

  // スタッフIDから名前を取得
  const getStaffName = (staffId) => staffList.find(s => s.id === staffId)?.name || '?'

  // 削除ダイアログを開く
  function handleDeleteClick(shiftId) {
    setDeleteDialog({ open: true, shiftId })
  }

  // シフトを削除
  async function confirmDelete() {
    try {
      const { error } = await supabase.from('shifts').delete().eq('id', deleteDialog.shiftId)
      if (error) throw error
      toast.success('削除しました')
      fetchData()
    } catch (err) {
      console.error('削除失敗:', err)
      toast.error('削除に失敗しました')
    }
  }

  const weekDays = ['日', '月', '火', '水', '木', '金', '土']
  const calendarDays = generateCalendarDays()

  return (
    <div className='min-h-screen p-8 bg-gray-50'>
      <div className='max-w-6xl mx-auto'>
        {/* ページヘッダー */}
        <div className='mb-6'>
          <Link href='/' className='text-blue-600 hover:text-blue-700 hover:underline mb-4 inline-block'>← ホームに戻る</Link>
          <h1 className='text-3xl font-bold'>シフトカレンダー</h1>
        </div>

        {isLoading ? (
          <div className='flex items-center justify-center py-12'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
          </div>
        ) : (
          <div className='bg-white p-6 rounded-lg shadow-sm border border-gray-200'>
            {/* 月の切り替え */}
            <div className='flex justify-between items-center mb-6'>
              <button onClick={prevMonth} className='px-4 py-2 border border-gray-300 rounded transition-all duration-200 hover:bg-gray-50 hover:shadow-sm'>← 前月</button>
              <h2 className='text-xl font-semibold'>{currentDate.getFullYear()}年{currentDate.getMonth() + 1}月</h2>
              <button onClick={nextMonth} className='px-4 py-2 border border-gray-300 rounded transition-all duration-200 hover:bg-gray-50 hover:shadow-sm'>翌月 →</button>
            </div>

            {/* カレンダーグリッド */}
            <div className='grid grid-cols-7 gap-1'>
              {/* 曜日ヘッダー */}
              {weekDays.map((day, index) => (
                <div key={day} className={`p-2 text-center font-semibold text-sm ${index === 0 ? 'text-red-500' : index === 6 ? 'text-blue-500' : ''}`}>
                  {day}
                </div>
              ))}
              
              {/* 日付セル */}
              {calendarDays.map((day, index) => {
                const dayShifts = getShiftsForDay(day)
                const isToday = day && new Date().getFullYear() === currentDate.getFullYear() && new Date().getMonth() === currentDate.getMonth() && new Date().getDate() === day
                
                return (
                  <div key={index} className={`min-h-24 p-1 border border-gray-200 rounded ${day ? 'bg-white' : 'bg-gray-50'} ${isToday ? 'ring-2 ring-blue-500' : ''}`}>
                    {day && (
                      <>
                        {/* 日付 */}
                        <div className={`text-sm font-medium mb-1 ${index % 7 === 0 ? 'text-red-500' : index % 7 === 6 ? 'text-blue-500' : ''}`}>{day}</div>
                        {/* シフト一覧 */}
                        <div className='space-y-1'>
                          {dayShifts.map((shift) => (
                            <div key={shift.id} className='text-xs bg-gray-100 text-gray-700 px-1 py-0.5 rounded truncate cursor-pointer transition-colors hover:bg-gray-200'
                              onClick={() => handleDeleteClick(shift.id)} title='クリックで削除'>
                              {getStaffName(shift.staff_id)} <span className='text-gray-500'>{shift.start_time.slice(0, 5)}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
            <div className='mt-4 text-sm text-gray-500'>シフトをクリックすると削除できます</div>
          </div>
        )}
      </div>

      {/* 削除確認ダイアログ */}
      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        onConfirm={confirmDelete}
        title='シフトの削除'
        description='このシフトを削除しますか？'
        confirmText='削除' cancelText='キャンセル' variant='danger'
      />
    </div>
  )
}
