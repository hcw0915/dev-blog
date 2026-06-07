import React, { useState, useEffect, useRef, Component } from "react"
import type { ErrorInfo as ReactErrorInfo } from "react"
import Editor from "@monaco-editor/react"
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels"
import { SiReact } from "react-icons/si"
import { IoCodeSlash, IoOpenOutline } from "react-icons/io5"
import { getTranslations } from "@/i18n/translations"
import type { Locale } from "@/i18n/translations"

// 错误边界组件
class ErrorBoundary extends Component<
  { children: React.ReactNode; fallbackMessage: string },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallbackMessage: string }) {
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
          <p>{this.props.fallbackMessage}</p>
        </div>
      )
    }

    return this.props.children
  }
}

interface ReactCodePlaygroundProps {
  initialCode?: string
  locale?: Locale
}

// 解析并转换 import 语句为动态导入
function transformImports(code: string): { transformedCode: string; imports: string } {
  const importRegex = /import\s+((?:\{[^}]*\}|\*\s+as\s+\w+|\w+)(?:\s*,\s*(?:\{[^}]*\}|\*\s+as\s+\w+|\w+))*)?\s+from\s+['"]([^'"]+)['"]/g
  
  const imports: Array<{ importContent: string; pkg: string; varName: string; defaultVarName: string }> = []
  let transformedCode = code
  
  // 收集所有需要动态导入的包
  let match
  while ((match = importRegex.exec(code)) !== null) {
    const importContent = (match[1] || '').trim()
    const pkg = match[2]
    
    // 跳过相对路径和 React（已经全局提供）
    if (pkg.startsWith('.') || pkg.startsWith('/') || pkg === 'react' || pkg === 'react-dom') {
      continue
    }
    
    // 生成变量名（用于存储导入的模块）
    const varName = pkg.replace(/[@/-]/g, '_').replace(/^_+/, 'pkg_')
    
    // 替换 import 语句为变量声明（稍后会被动态导入填充）
    if (!importContent || importContent === '') {
      // 默认导入: import pkg from 'pkg'
      // 从包名生成变量名
      const defaultVarName = pkg.split('/').pop()?.replace(/[@-]/g, '_') || varName
      imports.push({ importContent: '', pkg, varName, defaultVarName })
      transformedCode = transformedCode.replace(match[0], `const ${defaultVarName} = window.__import_${varName}__.default || window.__import_${varName}__;`)
    } else if (importContent === '*') {
      // 全部导入: import * as pkg from 'pkg'
      const defaultVarName = pkg.split('/').pop()?.replace(/[@-]/g, '_') || varName
      imports.push({ importContent: '*', pkg, varName, defaultVarName })
      transformedCode = transformedCode.replace(match[0], `const ${defaultVarName} = window.__import_${varName}__;`)
    } else if (importContent.startsWith('* as ')) {
      // import * as name from 'pkg'
      const alias = importContent.replace('* as ', '').trim()
      imports.push({ importContent, pkg, varName, defaultVarName: alias })
      transformedCode = transformedCode.replace(match[0], `const ${alias} = window.__import_${varName}__;`)
    } else if (importContent.includes('{')) {
      // 命名导入: import { a, b } from 'pkg'
      imports.push({ importContent, pkg, varName, defaultVarName: '' })
      transformedCode = transformedCode.replace(match[0], `const ${importContent} = window.__import_${varName}__;`)
    } else {
      // 默认导入带别名: import name from 'pkg'
      imports.push({ importContent, pkg, varName, defaultVarName: importContent })
      transformedCode = transformedCode.replace(match[0], `const ${importContent} = window.__import_${varName}__.default || window.__import_${varName}__;`)
    }
  }
  
  // 生成动态导入代码
  const importCode = imports.map(({ pkg, varName }) => {
    return `window.__import_${varName}__ = await import('https://esm.sh/${pkg}');`
  }).join('\n      ')
  
  return {
    transformedCode,
    imports: importCode
  }
}

export default function ReactCodePlayground({
  initialCode = "",
  locale = "zh"
}: ReactCodePlaygroundProps) {
  const t = getTranslations(locale).playground
  const shouldUseDefault = !initialCode
  const [useCodeSandbox, setUseCodeSandbox] = useState(false)

  const defaultCode = `import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div style={{
      padding: '20px',
      textAlign: 'center',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <h1>Hello React!</h1>
      <p>${t.demoText}</p>
      <button
        onClick={() => setCount(count + 1)}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          marginTop: '10px'
        }}
      >
        ${t.clickCount}: {count}
      </button>
    </div>
  )
}

export default App`

  const [code, setCode] = useState(shouldUseDefault ? defaultCode : initialCode)
  const [previewKey, setPreviewKey] = useState(0)
  const [theme, setTheme] = useState<"vs-dark" | "github-light">("vs-dark")
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // 生成 CodeSandbox URL
  const getCodeSandboxUrl = () => {
    // 解析代码中的 import 语句，提取依赖
    const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g
    const dependencies: Record<string, string> = {
      "react": "^18.2.0",
      "react-dom": "^18.2.0"
    }
    
    let match
    while ((match = importRegex.exec(code)) !== null) {
      const pkg = match[1]
      // 跳过相对路径和 React（已经包含）
      if (!pkg.startsWith('.') && !pkg.startsWith('/') && 
          pkg !== 'react' && pkg !== 'react-dom') {
        dependencies[pkg] = "latest"
      }
    }

    // 将代码转换为 CodeSandbox 格式
    const files = {
      "package.json": {
        content: JSON.stringify({
          dependencies
        }, null, 2)
      },
      "src/index.js": {
        content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);`
      },
      "src/App.js": {
        content: code || defaultCode
      },
      "public/index.html": {
        content: `<!DOCTYPE html>
<html lang="zh-TW">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>React App</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`
      }
    }

    // 使用 CodeSandbox 的 define API
    const parameters = encodeURIComponent(JSON.stringify({ files }))
    return `https://codesandbox.io/api/v1/sandboxes/define?json=1&parameters=${parameters}`
  }

  // 檢測主題變化
  useEffect(() => {
    const detectTheme = () => {
      const isDark = document.documentElement.classList.contains("dark")
      setTheme(isDark ? "vs-dark" : "github-light")
    }

    detectTheme()

    const observer = new MutationObserver(detectTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"]
    })

    return () => observer.disconnect()
  }, [])

  // 更新預覽
  const updatePreview = async () => {
    if (!iframeRef.current) return

    const iframe = iframeRef.current
    const doc = iframe.contentDocument || iframe.contentWindow?.document
    if (!doc) return

    // 转换 import 语句为动态导入
    const { transformedCode, imports: importCode } = transformImports(code)

    // 創建完整的 HTML 文檔
    const htmlContent = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>React Preview</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; }
  </style>
</head>
<body>
  <div id="root"></div>
  
  <!-- React and ReactDOM (UMD for global access) -->
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  
  <!-- Babel Standalone for JSX transformation -->
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  
  <!-- Main React Component -->
  <script type="text/babel">
    (async () => {
      const { useState, useEffect, useRef, useMemo, useCallback, useContext, useReducer, createContext } = React;
      
      // 动态加载外部包
      ${importCode}
      
      // 组件代码
      ${transformedCode}
      
      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(<App />);
    })();
  </script>
</body>
</html>`

    doc.open()
    doc.write(htmlContent)
    doc.close()
  }

  // 當代碼改變時更新預覽
  useEffect(() => {
    const timer = setTimeout(() => {
      updatePreview()
    }, 500) // 防抖：500ms 後更新

    return () => clearTimeout(timer)
  }, [code])

  // 初始載入時更新預覽
  useEffect(() => {
    updatePreview()
  }, [])

  const handleRefresh = () => {
    setPreviewKey((prev) => prev + 1)
    updatePreview()
  }

  // 捕獲拖拽時的錯誤
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
    <ErrorBoundary fallbackMessage={t.errorMessage}>
      <div className="h-full w-full bg-white dark:bg-[#1e1e1e]">
        <PanelGroup direction="horizontal" className="h-full" id="main-panel-group">
          {/* 編輯器區域 */}
          <Panel id="editor-panel" defaultSize={50} minSize={30}>
            <div className="h-full flex flex-col bg-white dark:bg-[#1e1e1e]">
              <div className="flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-[#252526] border-b border-gray-200 dark:border-[#3e3e42]">
                <div className="flex items-center gap-2">
                  <SiReact className="text-[#61dafb] text-lg" />
                  <span className="text-sm font-medium text-gray-700 dark:text-[#cccccc]">JSX</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {t.importHint}
                  </span>
                </div>
              </div>
              <div className="flex-1">
                <Editor
                  height="100%"
                  defaultLanguage="javascript"
                  value={code}
                  onChange={(value) => setCode(value || "")}
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

          <PanelResizeHandle className="w-1 bg-gray-300 dark:bg-[#3e3e42] hover:bg-gray-400 dark:hover:bg-[#4e4e52] transition-colors" />

          {/* 預覽區域 */}
          <Panel id="preview-panel" defaultSize={50} minSize={30}>
            <div className="h-full flex flex-col bg-white dark:bg-zinc-900">
              <div className="flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-[#252526] border-b border-gray-200 dark:border-[#3e3e42]">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-[#cccccc]">{t.preview}</span>
                  <button
                    onClick={() => setUseCodeSandbox(!useCodeSandbox)}
                    className={`px-2 py-1 text-xs rounded transition-colors flex items-center gap-1 ${
                      useCodeSandbox
                        ? 'bg-green-500 hover:bg-green-600 text-white'
                        : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300'
                    }`}
                    title={useCodeSandbox ? t.switchToLocal : t.switchToCodeSandbox}
                  >
                    <IoCodeSlash />
                    {useCodeSandbox ? 'CodeSandbox' : t.local}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  {useCodeSandbox && (
                    <a
                      href={getCodeSandboxUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors flex items-center gap-1"
                    >
                      <IoOpenOutline />
                      {t.openInNewWindow}
                    </a>
                  )}
                  {!useCodeSandbox && (
                    <button
                      onClick={handleRefresh}
                      className="px-3 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
                    >
                      {t.refresh}
                    </button>
                  )}
                </div>
              </div>
              <div className="flex-1 relative">
                {useCodeSandbox ? (
                  <iframe
                    key={`codesandbox-${previewKey}`}
                    src={getCodeSandboxUrl()}
                    className="w-full h-full border-0"
                    title="CodeSandbox Preview"
                    allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
                    sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
                  />
                ) : (
                  <iframe
                    key={previewKey}
                    ref={iframeRef}
                    className="w-full h-full border-0"
                    sandbox="allow-scripts allow-same-origin"
                    title="React Preview"
                  />
                )}
              </div>
            </div>
          </Panel>
        </PanelGroup>
      </div>
    </ErrorBoundary>
  )
}
