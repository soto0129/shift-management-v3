// app/api/generate-shift/route.js
import { NextResponse } from 'next/server'

// シフトパターンの定義
const SHIFT_PATTERNS = [
  { name: '午前', start_time: '09:00', end_time: '13:00', hours: 4 },
  { name: '午後', start_time: '13:00', end_time: '17:00', hours: 4 },
  { name: 'フル', start_time: '09:00', end_time: '17:00', hours: 8 },
]

// 配列をランダムにシャッフル
function shuffleArray(array) {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// 連続勤務日数をカウント
function countConsecutiveDays(staffId, date, schedule) {
  let count = 0
  const currentDate = new Date(date)
  
  // 過去7日間をチェック
  for (let i = 1; i <= 7; i++) {
    const prevDate = new Date(currentDate)
    prevDate.setDate(currentDate.getDate() - i)
    const dateStr = prevDate.toISOString().split('T')[0]
    
    if (schedule[dateStr] && schedule[dateStr].some(s => s.staff_id === staffId)) {
      count++
    } else {
      break
    }
  }
  return count
}

// シフト最適化のメイン処理
function optimizeShift(inputData) {
  const { staff: staffList = [], dates = [], constraints = {} } = inputData

  // 入力チェック
  if (!staffList || staffList.length === 0) {
    return { success: false, error: 'スタッフがいません' }
  }
  if (!dates || dates.length === 0) {
    return { success: false, error: '日付を指定してください' }
  }

  // 制約条件の設定
  const minStaff = constraints.min_staff_per_day ?? 2
  const maxStaff = constraints.max_staff_per_day ?? 3
  const maxConsecutiveDays = constraints.max_consecutive_days ?? 3
  const maxDaysPerWeek = constraints.max_days_per_week ?? 5

  // スケジュールを初期化
  const schedule = {}
  dates.forEach(date => { schedule[date] = [] })
  
  // スタッフごとの勤務回数を管理
  const staffWorkCount = {}
  const staffInfo = {}

  staffList.forEach(staff => {
    const staffId = staff.id || staff.name
    staffInfo[staffId] = {
      name: staff.name,
      preferredDates: new Set(staff.preferred_dates || []),
      unavailableDates: new Set(staff.unavailable_dates || []),
    }
    staffWorkCount[staffId] = 0
  })

  // 日付ごとにスタッフを割り当て
  for (const date of dates) {
    const shuffledStaff = shuffleArray(Object.keys(staffInfo))
    const availableStaff = []

    // 利用可能なスタッフを抽出
    for (const staffId of shuffledStaff) {
      const info = staffInfo[staffId]
      
      // 出勤不可日はスキップ
      if (info.unavailableDates.has(date)) continue
      // 週の上限に達している場合はスキップ
      if (staffWorkCount[staffId] >= maxDaysPerWeek) continue
      
      // 連続勤務日数をチェック
      const consecutiveDays = countConsecutiveDays(staffId, date, schedule)
      if (consecutiveDays >= maxConsecutiveDays) continue

      // スコアを計算（勤務回数が少ない人を優先）
      let score = staffWorkCount[staffId] * 10
      score += Math.random() * 5
      if (info.preferredDates.has(date)) score -= 50

      availableStaff.push({ id: staffId, score })
    }

    // スコア順にソート
    availableStaff.sort((a, b) => a.score - b.score)
    
    // ランダムに人数を決定
    const targetCount = Math.floor(Math.random() * (maxStaff - minStaff + 1)) + minStaff
    
    // スタッフを割り当て
    let assignedCount = 0
    for (const { id: staffId } of availableStaff) {
      if (assignedCount >= targetCount) break
      
      // ランダムにパターンを選択
      const pattern = SHIFT_PATTERNS[Math.floor(Math.random() * SHIFT_PATTERNS.length)]
      
      schedule[date].push({
        staff_id: staffId,
        date: date,
        start_time: pattern.start_time,
        end_time: pattern.end_time,
        pattern_name: pattern.name,
      })
      
      staffWorkCount[staffId]++
      assignedCount++
    }
  }

  // 結果を配列に変換
  const shifts = []
  for (const date of dates) {
    for (const shift of schedule[date]) {
      shifts.push(shift)
    }
  }

  return { success: true, shifts: shifts, stats: { total_shifts: shifts.length } }
}

// POSTリクエストの処理
export async function POST(request) {
  try {
    const body = await request.json()
    const { staff, dates, constraints } = body
    
    // 入力チェック
    if (!staff || !Array.isArray(staff) || staff.length === 0) {
      return NextResponse.json({ success: false, error: 'スタッフ情報が不正です' }, { status: 400 })
    }
    
    if (!dates || !Array.isArray(dates) || dates.length === 0) {
      return NextResponse.json({ success: false, error: '日付が指定されていません' }, { status: 400 })
    }
    
    // シフト最適化を実行
    const result = optimizeShift({
      staff: staff.map(s => ({
        id: s.id,
        name: s.name,
        preferred_dates: s.preferred_dates || [],
        unavailable_dates: s.unavailable_dates || [],
      })),
      dates: dates,
      constraints: constraints || {}
    })
    
    if (result.success) {
      return NextResponse.json(result)
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }
  } catch (error) {
    console.error('シフト生成エラー:', error)
    return NextResponse.json({ success: false, error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
