// components/ConfirmDialog.js
'use client'

import { useEffect, useRef } from 'react'

// 削除などの確認ダイアログ
export function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title = '確認',
  description = '本当に実行しますか？',
  confirmText = '確認',
  cancelText = 'キャンセル',
  variant = 'default'
}) {
  const dialogRef = useRef(null)

  // ESCキーで閉じる
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && open) {
        onOpenChange(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onOpenChange])

  // 背景クリックで閉じる
  const handleBackdropClick = (e) => {
    if (e.target === dialogRef.current) {
      onOpenChange(false)
    }
  }

  if (!open) return null

  // ボタンの色を設定
  const confirmButtonClass = variant === 'danger'
    ? 'bg-red-600 text-white hover:bg-red-700'
    : 'bg-blue-600 text-white hover:bg-blue-700'

  return (
    <div
      ref={dialogRef}
      onClick={handleBackdropClick}
      className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
    >
      <div className='bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl border border-gray-200'>
        <h3 className='text-lg font-semibold mb-2'>{title}</h3>
        <p className='text-gray-600 mb-6'>{description}</p>
        
        <div className='flex justify-end gap-3'>
          <button
            onClick={() => onOpenChange(false)}
            className='px-4 py-2 border border-gray-300 rounded transition-all duration-200 hover:bg-gray-50 hover:shadow-sm'
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm()
              onOpenChange(false)
            }}
            className={`px-4 py-2 rounded transition-all duration-200 hover:shadow-md ${confirmButtonClass}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
