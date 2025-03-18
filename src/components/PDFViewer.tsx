import { useEffect, useRef, type FC } from 'react'
import * as pdfjsLib from 'pdfjs-dist'

// 使用本地 worker 文件
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.mjs'

interface PDFCanvasProps {
  pdfUrl: string
}

const PDFCanvas: FC<PDFCanvasProps> = ({ pdfUrl }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const loadPDF = async () => {
      if (!canvasRef.current) return

      try {
        const loadingTask = pdfjsLib.getDocument(pdfUrl)
        const pdf = await loadingTask.promise
        const page = await pdf.getPage(1)

        const viewport = page.getViewport({ scale: 1.5 })
        const canvas = canvasRef.current
        const context = canvas.getContext('2d')

        if (!context) {
          console.error('Canvas context not available')
          return
        }

        canvas.height = viewport.height
        canvas.width = viewport.width

        const renderContext = {
          canvasContext: context,
          viewport: viewport
        }

        await page.render(renderContext).promise
      } catch (error) {
        console.error('Error loading PDF:', error)
      }
    }

    loadPDF()
  }, [pdfUrl])

  return <canvas ref={canvasRef}></canvas>
}

export default PDFCanvas
