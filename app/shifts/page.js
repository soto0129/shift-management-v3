// app/shifts/page.js
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function ShiftsPage() {
  const { user } = useAuth()
  
  const [staffList, setStaffList] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedShifts, setGeneratedShifts] = useState([])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [minStaff, setMinStaff] = useState('2')
  const [maxStaff, setMaxStaff] = useState('3')

  useEffect(() => {
    if (user) {
      fetchStaffList()
      // 初期値として今月の範囲を設定
      const now = new Date()
      setStartDate(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0])
      setEndDate(new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0])
    }
  }, [user])

  // スタッフ一覧を取得
  async function fetchStaffList() {
    try {
      setIsLoading(true)
      const { data, error } = await supabase.from('staff').select('*').eq('user_id', user.id).order('name')
      if (error) throw error
      setStaffList(data || [])
    } catch (err) {
      console.error('スタッフ取得失敗:', err)
      toast.error('スタッフの取得に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  // 日付の範囲から日付配列を生成
  function generateDateRange(start, end) {
    const dates = []
    const current = new Date(start)
    const endD = new Date(end)
    while (current <= endD) {
      dates.push(current.toISOString().split('T')[0])
      current.setDate(current.getDate() + 1)
    }
    return dates
  }

  // シフトを自動生成
  async function handleGenerate() {
    if (!startDate || !endDate) { toast.error('期間を指定してください'); return }
    if (staffList.length === 0) { toast.error('先にスタッフを登録してください'); return }
    
    setIsGenerating(true)
    try {
      // APIにリクエストを送信
      const response = await fetch('/api/generate-shift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staff: staffList,
          dates: generateDateRange(startDate, endDate),
          constraints: { min_staff_per_day: parseInt(minStaff), max_staff_per_day: parseInt(maxStaff) }
        })
      })
      const result = await response.json()
      if (result.success) {
        setGeneratedShifts(result.shifts)
        toast.success(`${result.shifts.length}件のシフトを生成しました`)
      } else {
        toast.error(result.error || '生成に失敗しました')
      }
    } catch (err) {
      console.error('シフト生成エラー:', err)
      toast.error('エラーが発生しました')
    } finally {
      setIsGenerating(false)
    }
  }

  // 生成したシフトをDBに保存
  async function handleSave() {
    if (generatedShifts.length === 0) { toast.error('保存するシフトがありません'); return }
    try {
      const { error } = await supabase.from('shifts').insert(
        generatedShifts.map(s => ({ ...s, user_id: user.id }))
      )
      if (error) throw error
      toast.success('保存しました')
      setGeneratedShifts([])
    } catch (err) {
      console.error('保存失敗:', err)
      toast.error('保存に失敗しました')
    }
  }

  // スタッフIDから名前を取得
  const getStaffName = (staffId) => staffList.find(s => s.id === staffId)?.name || '不明'

  return (
    <div className='min-h-screen p-8 bg-gray-50'>
      <div className='max-w-6xl mx-auto'>
        {/* ページヘッダー */}
        <div className='mb-6'>
          <Link href='/' className='text-blue-600 hover:text-blue-700 hover:underline mb-4 inline-block'>← ホームに戻る</Link>
          <h1 className='text-3xl font-bold'>シフト自動生成</h1>
        </div>

        {isLoading ? (
          <div className='flex items-center justify-center py-12'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
          </div>
        ) : (
          <>
            {/* 生成条件フォーム */}
            <div className='bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8'>
              <h2 className='text-xl font-semibold mb-4'>生成条件</h2>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-6'>
                <div>
                  <label className='block text-sm font-medium mb-1'>開始日</label>
                  <input type='date' value={startDate} onChange={(e) => setStartDate(e.target.value)} className='w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow' />
                </div>
                <div>
                  <label className='block text-sm font-medium mb-1'>終了日</label>
                  <input type='date' value={endDate} onChange={(e) => setEndDate(e.target.value)} className='w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow' />
                </div>
                <div>
                  <label className='block text-sm font-medium mb-1'>1日の最低人数</label>
                  <input type='number' value={minStaff} onChange={(e) => setMinStaff(e.target.value)} className='w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow' min='1' />
                </div>
                <div>
                  <label className='block text-sm font-medium mb-1'>1日の最大人数</label>
                  <input type='number' value={maxStaff} onChange={(e) => setMaxStaff(e.target.value)} className='w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow' min='1' />
                </div>
              </div>
              <div className='text-sm text-gray-600 mb-4'>
                登録スタッフ: {staffList.length}名
                {staffList.length === 0 && <span className='text-red-500 ml-2'>（<Link href='/staff' className='underline'>スタッフを登録</Link>してください）</span>}
              </div>
              <button onClick={handleGenerate} disabled={isGenerating || staffList.length === 0}
                className='bg-blue-600 text-white px-6 py-2 rounded font-semibold transition-all duration-200 hover:bg-blue-700 hover:shadow-md disabled:opacity-50'>
                {isGenerating ? '生成中...' : 'シフトを生成'}
              </button>
            </div>

            {/* 生成結果テーブル */}
            {generatedShifts.length > 0 && (
              <div className='bg-white p-6 rounded-lg shadow-sm border border-gray-200'>
                <div className='flex justify-between items-center mb-4'>
                  <h2 className='text-xl font-semibold'>生成結果（{generatedShifts.length}件）</h2>
                  <button onClick={handleSave} className='bg-gray-800 text-white px-4 py-2 rounded font-semibold transition-all duration-200 hover:bg-gray-900 hover:shadow-md'>保存する</button>
                </div>
                <div className='overflow-x-auto'>
                  <table className='w-full'>
                    <thead className='bg-gray-50'>
                      <tr>
                        <th className='px-4 py-3 text-left font-semibold'>日付</th>
                        <th className='px-4 py-3 text-left font-semibold'>スタッフ</th>
                        <th className='px-4 py-3 text-left font-semibold'>時間</th>
                        <th className='px-4 py-3 text-left font-semibold'>パターン</th>
                      </tr>
                    </thead>
                    <tbody>
                      {generatedShifts.map((shift, i) => (
                        <tr key={i} className='border-t hover:bg-gray-50 transition-colors'>
                          <td className='px-4 py-3'>{shift.date}</td>
                          <td className='px-4 py-3'>{getStaffName(shift.staff_id)}</td>
                          <td className='px-4 py-3'>{shift.start_time} - {shift.end_time}</td>
                          <td className='px-4 py-3'>{shift.pattern_name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
