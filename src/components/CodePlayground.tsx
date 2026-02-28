import React, { useState, useEffect, useRef, Component } from "react"
import type { ErrorInfo as ReactErrorInfo } from "react"
import Editor from "@monaco-editor/react"
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels"
import { SiHtml5, SiCss3, SiJavascript } from "react-icons/si"

// 错误边界组件
class ErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ReactErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full text-red-500">
          <p>Something went wrong. Please refresh the page.</p>
        </div>
      )
    }

    return this.props.children
  }
}

interface CodePlaygroundProps {
  initialHtml?: string
  initialCss?: string
  initialJs?: string
}

export default function CodePlayground({
  initialHtml = "",
  initialCss = "",
  initialJs = ""
}: CodePlaygroundProps) {
  const [html, setHtml] = useState(initialHtml)
  const [css, setCss] = useState(initialCss)
  const [js, setJs] = useState(initialJs)
  const [previewKey, setPreviewKey] = useState(0)
  const [theme, setTheme] = useState<"vs-dark" | "github-light">("vs-dark")
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // 检测主题变化
  useEffect(() => {
    const detectTheme = () => {
      const isDark = document.documentElement.classList.contains("dark")
      setTheme(isDark ? "vs-dark" : "github-light")
    }

    // 初始检测
    detectTheme()

    // 监听主题变化
    const observer = new MutationObserver(detectTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"]
    })

    // 监听 localStorage 变化（主题切换器可能会更新）
    const handleStorageChange = () => {
      detectTheme()
    }
    window.addEventListener("storage", handleStorageChange)

    // 定期检查（防止其他方式改变主题）
    const interval = setInterval(detectTheme, 1000)

    return () => {
      observer.disconnect()
      window.removeEventListener("storage", handleStorageChange)
      clearInterval(interval)
    }
  }, [])

  const defaultCode = {
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Hello World</title>
</head>
<body>
  <h1>Hello, World!</h1>
  <p>这是一个简单的示例。开始编辑代码，预览会实时更新。</p>
  <button id="clickBtn">点击我</button>
</body>
</html>`,
    css: `body {
  font-family: Arial, sans-serif;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  min-height: 100vh;
  margin: 0;
}

h1 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

p {
  font-size: 1.2rem;
  line-height: 1.6;
}

button {
  padding: 12px 24px;
  font-size: 1rem;
  background: white;
  color: #667eea;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  margin-top: 20px;
  transition: transform 0.2s;
}

button:hover {
  transform: scale(1.05);
}`,
    js: `document.getElementById('clickBtn').addEventListener('click', function() {
  alert('Hello from JavaScript!')
  this.textContent = '已点击！'
})`
  }

  useEffect(() => {
    if (!html && !css && !js) {
      setHtml(defaultCode.html)
      setCss(defaultCode.css)
      setJs(defaultCode.js)
    }
  }, [])

  // 更新预览
  const updatePreview = () => {
    if (!iframeRef.current) return

    const previewContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${css}</style>
</head>
<body>
  ${html}
  <script>${js}<\/script>
</body>
</html>`

    const iframe = iframeRef.current
    const doc = iframe.contentDocument || iframe.contentWindow?.document

    if (doc) {
      doc.open()
      doc.write(previewContent)
      doc.close()
    }
  }

  // 实时更新（防抖）
  useEffect(() => {
    const timer = setTimeout(() => {
      updatePreview()
    }, 300)

    return () => clearTimeout(timer)
  }, [html, css, js])

  // 初始化预览
  useEffect(() => {
    updatePreview()
  }, [])

  const handleClear = () => {
    if (confirm("确定要清空所有代码吗？")) {
      setHtml("")
      setCss("")
      setJs("")
    }
  }

  const handleSave = () => {
    const code = {
      html,
      css,
      js,
      timestamp: new Date().toISOString()
    }
    localStorage.setItem("playground-code", JSON.stringify(code))
    alert("代码已保存到本地存储！")
  }

  const handleLoad = () => {
    const saved = localStorage.getItem("playground-code")
    if (saved) {
      try {
        const code = JSON.parse(saved)
        setHtml(code.html || "")
        setCss(code.css || "")
        setJs(code.js || "")
        alert("代码已加载！")
      } catch (e) {
        alert("加载失败：" + (e as Error).message)
      }
    } else {
      alert("没有保存的代码")
    }
  }

  const handleRefresh = () => {
    setPreviewKey((prev) => prev + 1)
    updatePreview()
  }

  // 捕获拖拽时的错误
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (event.message?.includes("SES_UNCAUGHT_EXCEPTION")) {
        event.preventDefault()
        console.warn("Resize panel error caught and suppressed:", event.message)
        return false
      }
    }

    window.addEventListener("error", handleError)
    return () => {
      window.removeEventListener("error", handleError)
    }
  }, [])

  return (
    <ErrorBoundary>
      <div className="h-[calc(100vh-200px)] w-full bg-[#1e1e1e]">
        <PanelGroup direction="vertical" className="h-full" id="main-panel-group">
        {/* 编辑器区域 */}
        <Panel id="editor-panel" defaultSize={60} minSize={30}>
          <PanelGroup direction="horizontal" className="h-full" id="editor-panel-group">
            {/* HTML Editor */}
            <Panel id="html-panel" defaultSize={33.33} minSize={15}>
              <div className="h-full flex flex-col bg-[#1e1e1e]">
                <div className="flex items-center gap-2 px-4 py-2 bg-[#252526] border-b border-[#3e3e42]">
                  <SiHtml5 className="text-[#e34c26] text-lg" />
                  <span className="text-sm font-medium text-[#cccccc]">HTML</span>
                </div>
                <div className="flex-1">
                  <Editor
                    height="100%"
                    defaultLanguage="html"
                    value={html}
                    onChange={(value) => setHtml(value || "")}
                    theme={theme}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      wordWrap: "on",
                      automaticLayout: true,
                      tabSize: 2,
                      scrollBeyondLastLine: false
                    }}
                  />
                </div>
              </div>
            </Panel>

            <PanelResizeHandle className="w-1 bg-[#3e3e42] hover:bg-[#007acc] transition-colors" />

            {/* CSS Editor */}
            <Panel id="css-panel" defaultSize={33.33} minSize={15}>
              <div className="h-full flex flex-col bg-[#1e1e1e]">
                <div className="flex items-center gap-2 px-4 py-2 bg-[#252526] border-b border-[#3e3e42]">
                  <SiCss3 className="text-[#264de4] text-lg" />
                  <span className="text-sm font-medium text-[#cccccc]">CSS</span>
                </div>
                <div className="flex-1">
                  <Editor
                    height="100%"
                    defaultLanguage="css"
                    value={css}
                    onChange={(value) => setCss(value || "")}
                    theme={theme}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      wordWrap: "on",
                      automaticLayout: true,
                      tabSize: 2,
                      scrollBeyondLastLine: false
                    }}
                  />
                </div>
              </div>
            </Panel>

            <PanelResizeHandle className="w-1 bg-[#3e3e42] hover:bg-[#007acc] transition-colors" />

            {/* JavaScript Editor */}
            <Panel id="js-panel" defaultSize={33.34} minSize={15}>
              <div className="h-full flex flex-col bg-[#1e1e1e]">
                <div className="flex items-center gap-2 px-4 py-2 bg-[#252526] border-b border-[#3e3e42]">
                  <SiJavascript className="text-[#F7DF1E] text-lg" />
                  <span className="text-sm font-medium text-[#cccccc]">JavaScript</span>
                </div>
                <div className="flex-1">
                  <Editor
                    height="100%"
                    defaultLanguage="javascript"
                    value={js}
                    onChange={(value) => setJs(value || "")}
                    theme={theme}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      wordWrap: "on",
                      automaticLayout: true,
                      tabSize: 2,
                      scrollBeyondLastLine: false
                    }}
                  />
                </div>
              </div>
            </Panel>
          </PanelGroup>
        </Panel>

        <PanelResizeHandle className="h-1 bg-[#3e3e42] hover:bg-[#007acc] transition-colors" />

        {/* Preview Panel */}
        <Panel id="preview-panel" defaultSize={40} minSize={20}>
          <div className="h-full flex flex-col bg-white dark:bg-[#1e1e1e]">
            <div className="flex items-center justify-between px-4 py-2 bg-[#f3f3f3] dark:bg-[#252526] border-b border-[#e0e0e0] dark:border-[#3e3e42]">
              <span className="text-sm font-medium text-[#333] dark:text-[#cccccc]">Preview</span>
              <div className="flex gap-2">
                <button
                  onClick={handleRefresh}
                  className="px-2 py-1 text-xs text-[#333] dark:text-[#cccccc] hover:bg-[#e0e0e0] dark:hover:bg-[#2a2d2e] rounded"
                  title="刷新"
                >
                  Refresh
                </button>
                <button
                  onClick={handleClear}
                  className="px-2 py-1 text-xs text-[#333] dark:text-[#cccccc] hover:bg-[#e0e0e0] dark:hover:bg-[#2a2d2e] rounded"
                  title="清空"
                >
                  Clear
                </button>
                <button
                  onClick={handleSave}
                  className="px-2 py-1 text-xs text-[#333] dark:text-[#cccccc] hover:bg-[#e0e0e0] dark:hover:bg-[#2a2d2e] rounded"
                  title="保存"
                >
                  Save
                </button>
                <button
                  onClick={handleLoad}
                  className="px-2 py-1 text-xs text-[#333] dark:text-[#cccccc] hover:bg-[#e0e0e0] dark:hover:bg-[#2a2d2e] rounded"
                  title="加载"
                >
                  Load
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-white dark:bg-[#1e1e1e]">
              <iframe
                ref={iframeRef}
                key={previewKey}
                className="w-full h-full border-none bg-white"
                sandbox="allow-scripts allow-same-origin allow-modals"
                title="Preview"
              />
            </div>
          </div>
        </Panel>
        </PanelGroup>
      </div>
    </ErrorBoundary>
  )
}
