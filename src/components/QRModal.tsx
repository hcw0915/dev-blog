import React, { useEffect, useState, useRef } from 'react'
import { getTranslations } from '@/i18n/translations'
import type { Locale } from '@/i18n/translations'

interface QRModalState {
  isOpen: boolean
  label: string
  url: string
}

// 圖標映射
const iconMap: Record<string, { color: string }> = {
  Telegram: { color: '#0088cc' },
  Email: { color: '#6366f1' },
  GitHub: { color: '#181717' },
  Instagram: { color: '#E4405F' },
  WhatsApp: { color: '#25D366' }
}

export default function QRModal() {
  const [state, setState] = useState<QRModalState>({
    isOpen: false,
    label: '',
    url: ''
  })
  const [locale, setLocale] = useState<Locale>('zh')
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const contentRef = useRef<HTMLDivElement>(null)

  // 獲取當前語言
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname
      const isEn = currentPath.startsWith('/en/')
      setLocale(isEn ? 'en' : 'zh')
    }
  }, [])

  // 設置全局函數
  useEffect(() => {
    const showQRModal = async (label: string, url: string) => {
      // 先關閉（如果已打開）
      setState((prev) => {
        if (prev.isOpen) {
          return { isOpen: false, label: '', url: '' }
        }
        return prev
      })
      await new Promise((resolve) => setTimeout(resolve, 150))

      // 生成 QR code - 使用 API
      setQrCodeUrl(
        `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(url)}`
      )

      // 顯示彈窗
      setState({ isOpen: true, label, url })

      // 重置並觸發動畫
      await new Promise((resolve) => requestAnimationFrame(resolve))
      if (contentRef.current) {
        contentRef.current.style.animation = 'none'
        void contentRef.current.offsetHeight
        requestAnimationFrame(() => {
          if (contentRef.current) {
            contentRef.current.style.animation =
              'slide-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }
        })
      }
    }

    const closeQRModal = () => {
      setState({ isOpen: false, label: '', url: '' })
    }

    // 設置到 window
    if (typeof window !== 'undefined') {
      ;(window as any).showQRModal = showQRModal
      ;(window as any).closeQRModal = closeQRModal
    }

    // 清理函數
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).showQRModal
        delete (window as any).closeQRModal
      }
    }
  }, [])

  const translations = getTranslations(locale)
  const iconInfo = iconMap[state.label]

  if (!state.isOpen) {
    return null
  }

  return (
    <>
      <div
        className="qr-modal-overlay fixed inset-0 bg-black/50 backdrop-blur-sm z-50 items-center justify-center p-4 flex"
        onClick={() => setState({ isOpen: false, label: '', url: '' })}
      >
        <div
          ref={contentRef}
          className="qr-modal-content bg-white dark:bg-zinc-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="absolute top-4 right-4 text-2xl text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
            onClick={() => setState({ isOpen: false, label: '', url: '' })}
            aria-label={translations.aria.closeModal}
          >
            ✕
          </button>
          <div className="flex flex-col items-center gap-4">
            <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
         
              {state.label}
            </h3>
            <div className="relative">
              <div className="w-64 h-64 bg-white p-4 rounded-xl border-2 border-zinc-200 dark:border-zinc-700 flex items-center justify-center">
                {qrCodeUrl ? (
                  <img
                    src={qrCodeUrl}
                    alt={`${state.label} QR Code`}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-zinc-400 dark:text-zinc-600">{translations.qr.loading}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        .qr-modal-overlay:not(.hidden) {
          display: flex;
        }

        .qr-modal-content {
          animation: slide-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes slide-in {
          from {
            transform: translateY(20px) scale(0.9);
            opacity: 0;
          }
          to {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </>
  )
}
