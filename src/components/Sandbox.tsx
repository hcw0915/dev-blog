import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  Component
} from "react"
import type { ErrorInfo } from "react"
import Editor from "@monaco-editor/react"
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels"
import { buildPreview, languageOf, type FileMap } from "@/lib/sandbox/bundle"
import { getTranslations } from "@/i18n/translations"
import type { Locale } from "@/i18n/translations"

/**
 * CodeSandbox 式的多檔案編輯器：檔案樹 / 分頁 + Monaco / 預覽 + console。
 * vanilla 與 React 共用 —— 差別只在 files 裡有什麼，預覽一律從 index.html 進。
 */

interface Props {
  id: string
  files: FileMap
  entry?: string
  locale?: Locale
}

type Level = "log" | "info" | "warn" | "error" | "debug"
interface LogEntry {
  id: number
  level: Level
  args: string[]
}

interface TreeNode {
  name: string
  path: string
  children?: TreeNode[]
}

const DRAFT_KEY = (id: string) => `sandbox:draft:${id}`

// ── 檔案樹 ──────────────────────────────────────────────────────────────
const buildTree = (paths: string[]): TreeNode[] => {
  const root: TreeNode[] = []
  for (const path of paths.sort()) {
    const parts = path.split("/")
    let level = root
    let acc = ""
    parts.forEach((part, i) => {
      acc = acc ? `${acc}/${part}` : part
      const isFile = i === parts.length - 1
      let node = level.find(n => n.name === part && !!n.children === !isFile)
      if (!node) {
        node = isFile ? { name: part, path: acc } : { name: part, path: acc, children: [] }
        level.push(node)
      }
      if (!isFile) level = node.children!
    })
  }
  const sortNodes = (nodes: TreeNode[]) => {
    nodes.sort((a, b) =>
      !!a.children === !!b.children ? a.name.localeCompare(b.name) : a.children ? -1 : 1
    )
    nodes.forEach(n => n.children && sortNodes(n.children))
  }
  sortNodes(root)
  return root
}

const EXT_COLOR: Record<string, string> = {
  html: "#e34c26",
  css: "#563d7c",
  js: "#f1e05a",
  jsx: "#61dafb",
  ts: "#3178c6",
  tsx: "#3178c6",
  json: "#a1a1aa",
  md: "#a1a1aa"
}
const extOf = (p: string) => p.split(".").pop()?.toLowerCase() ?? ""

function FileIcon({ path }: { path: string }) {
  const ext = extOf(path)
  return (
    <span
      className="inline-block h-2 w-2 shrink-0 rounded-[2px]"
      style={{ background: EXT_COLOR[ext] ?? "#71717a" }}
      aria-hidden="true"
    />
  )
}

function Tree({
  nodes,
  active,
  dirty,
  collapsed,
  onToggle,
  onOpen,
  depth = 0
}: {
  nodes: TreeNode[]
  active: string
  dirty: Set<string>
  collapsed: Set<string>
  onToggle: (p: string) => void
  onOpen: (p: string) => void
  depth?: number
}) {
  return (
    <ul className="text-[13px] leading-6">
      {nodes.map(n =>
        n.children ? (
          <li key={n.path}>
            <button
              type="button"
              onClick={() => onToggle(n.path)}
              className="flex w-full items-center gap-1.5 text-left text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100"
              style={{ paddingLeft: 8 + depth * 12 }}
            >
              <span
                className={`inline-block text-[9px] transition-transform ${
                  collapsed.has(n.path) ? "" : "rotate-90"
                }`}
              >
                ▶
              </span>
              <span className="font-medium">{n.name}</span>
            </button>
            {!collapsed.has(n.path) && (
              <Tree
                nodes={n.children}
                active={active}
                dirty={dirty}
                collapsed={collapsed}
                onToggle={onToggle}
                onOpen={onOpen}
                depth={depth + 1}
              />
            )}
          </li>
        ) : (
          <li key={n.path}>
            <button
              type="button"
              onClick={() => onOpen(n.path)}
              className={`flex w-full items-center gap-2 text-left transition-colors ${
                active === n.path
                  ? "bg-violet-500/10 text-zinc-900 dark:bg-white/[0.07] dark:text-zinc-50"
                  : "text-zinc-600 hover:bg-zinc-900/[0.04] dark:text-zinc-400 dark:hover:bg-white/[0.04]"
              }`}
              style={{ paddingLeft: 8 + depth * 12 + 14 }}
            >
              <FileIcon path={n.path} />
              <span className="truncate">{n.name}</span>
              {dirty.has(n.path) && (
                <span className="ml-auto mr-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
              )}
            </button>
          </li>
        )
      )}
    </ul>
  )
}

// ── 錯誤邊界 ────────────────────────────────────────────────────────────
class Boundary extends Component<{ children: React.ReactNode; msg: string }, { err: boolean }> {
  state = { err: false }
  static getDerivedStateFromError() {
    return { err: true }
  }
  componentDidCatch(e: Error, i: ErrorInfo) {
    console.error(e, i)
  }
  render() {
    return this.state.err ? (
      <div className="flex h-full items-center justify-center text-sm text-red-500">{this.props.msg}</div>
    ) : (
      this.props.children
    )
  }
}

const Handle = ({ dir }: { dir: "h" | "v" }) => (
  <PanelResizeHandle
    className={`${
      dir === "h" ? "w-px" : "h-px"
    } bg-zinc-200 transition-colors hover:bg-violet-400 data-[resize-handle-active]:bg-violet-500 dark:bg-white/10 dark:hover:bg-violet-400`}
  />
)

// ── 主元件 ──────────────────────────────────────────────────────────────
export default function Sandbox({ id, files: original, entry = "index.html", locale = "zh" }: Props) {
  const t = getTranslations(locale).playground

  const [files, setFiles] = useState<FileMap>(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY(id))
      if (raw) {
        const draft = JSON.parse(raw)
        if (draft && typeof draft === "object") return { ...original, ...draft }
      }
    } catch {}
    return original
  })
  const firstFile = files[entry] !== undefined ? entry : Object.keys(files)[0] ?? ""
  const [tabs, setTabs] = useState<string[]>([firstFile])
  const [active, setActive] = useState<string>(firstFile)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [srcdoc, setSrcdoc] = useState<string>("")
  const [previewKey, setPreviewKey] = useState(0)
  const [dark, setDark] = useState(false)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [flash, setFlash] = useState(false)
  const logSeq = useRef(0)
  const consoleRef = useRef<HTMLDivElement>(null)
  const filesRef = useRef(files)
  filesRef.current = files

  // 跟隨站台主題
  useEffect(() => {
    const detect = () => setDark(document.documentElement.classList.contains("dark"))
    detect()
    const ob = new MutationObserver(detect)
    ob.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    return () => ob.disconnect()
  }, [])

  const dirty = useMemo(() => {
    const s = new Set<string>()
    for (const p of Object.keys(files)) if (files[p] !== original[p]) s.add(p)
    return s
  }, [files, original])

  // 草稿存在瀏覽器 localStorage：靜態站寫不回原始檔，跟 CodeSandbox 未登入時一樣
  const persist = useCallback(
    (next: FileMap) => {
      let changed = false
      for (const p of Object.keys(next)) if (next[p] !== original[p]) changed = true
      try {
        if (changed) localStorage.setItem(DRAFT_KEY(id), JSON.stringify(next))
        else localStorage.removeItem(DRAFT_KEY(id))
        setSavedAt(Date.now())
      } catch {}
    },
    [id, original]
  )

  // 編輯 → 400ms 後重建預覽 + 存草稿
  useEffect(() => {
    const timer = setTimeout(() => {
      setLogs([])
      setSrcdoc(buildPreview(files, { entry }))
      persist(files)
    }, 400)
    return () => clearTimeout(timer)
  }, [files, entry, persist])

  // console 橋接
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      const d = e.data
      if (!d || !d.__sandbox) return
      setLogs(prev => [...prev.slice(-299), { id: logSeq.current++, level: d.level, args: d.args }])
    }
    window.addEventListener("message", onMsg)
    return () => window.removeEventListener("message", onMsg)
  }, [])
  useEffect(() => {
    consoleRef.current?.scrollTo({ top: consoleRef.current.scrollHeight })
  }, [logs])

  // ⌘S / Ctrl+S：立即存草稿 + 重整預覽，並給看得見的回饋；別讓瀏覽器跳「另存網頁」
  const saveNow = useCallback(() => {
    persist(filesRef.current)
    setSrcdoc(buildPreview(filesRef.current, { entry }))
    setPreviewKey(k => k + 1)
    setFlash(true)
    setTimeout(() => setFlash(false), 1400)
  }, [persist, entry])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault()
        saveNow()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [saveNow])

  const tree = useMemo(() => buildTree(Object.keys(files)), [files])

  const open = useCallback((p: string) => {
    setTabs(ts => (ts.includes(p) ? ts : [...ts, p]))
    setActive(p)
  }, [])
  // 先算好下一個狀態再各自 set；把 setActive 巢在 setTabs 的 updater 裡會讓關閉分頁失效
  const close = useCallback(
    (p: string) => {
      const idx = tabs.indexOf(p)
      const next = tabs.filter(x => x !== p)
      setTabs(next)
      if (active === p) setActive(next[Math.max(0, idx - 1)] ?? next[0] ?? "")
    },
    [tabs, active]
  )
  const toggleFolder = (p: string) =>
    setCollapsed(s => {
      const n = new Set(s)
      n.has(p) ? n.delete(p) : n.add(p)
      return n
    })

  const reset = () => {
    if (!dirty.size || confirm(t.resetConfirm)) {
      setFiles(original)
      try {
        localStorage.removeItem(DRAFT_KEY(id))
      } catch {}
    }
  }
  const refresh = () => {
    setLogs([])
    setPreviewKey(k => k + 1)
  }
  const openExternal = () => {
    const blob = new Blob([srcdoc], { type: "text/html" })
    window.open(URL.createObjectURL(blob), "_blank", "noopener")
  }

  const LEVEL_CLS: Record<Level, string> = {
    log: "text-zinc-700 dark:text-zinc-300",
    info: "text-sky-600 dark:text-sky-300",
    debug: "text-zinc-500",
    warn: "text-amber-600 dark:text-amber-300 bg-amber-500/5",
    error: "text-red-600 dark:text-red-300 bg-red-500/5"
  }

  const chrome =
    "flex h-9 shrink-0 items-center border-b border-zinc-200 bg-zinc-50 px-3 text-xs dark:border-white/10 dark:bg-white/[0.03]"

  return (
    <Boundary msg={t.errorMessage}>
      <div className="flex h-full w-full flex-col overflow-hidden bg-white text-zinc-800 dark:bg-[#0e0e12] dark:text-zinc-200">
        <PanelGroup direction="horizontal" autoSaveId={`sandbox-h-${id}`}>
          {/* ── 檔案樹 ── */}
          <Panel defaultSize={16} minSize={10} maxSize={30} className="flex flex-col">
            <div className={`${chrome} justify-between`}>
              <span className="font-bold tracking-[0.15em] text-zinc-400 dark:text-zinc-500">
                {t.files}
              </span>
              <button
                type="button"
                onClick={reset}
                disabled={!dirty.size}
                title={t.reset}
                className="rounded px-1.5 py-0.5 text-[11px] text-zinc-500 hover:bg-zinc-900/[0.05] hover:text-zinc-900 disabled:opacity-30 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-zinc-50"
              >
                {t.reset}
              </button>
            </div>
            <div className="flex-1 overflow-auto py-1.5">
              <Tree
                nodes={tree}
                active={active}
                dirty={dirty}
                collapsed={collapsed}
                onToggle={toggleFolder}
                onOpen={open}
              />
            </div>
          </Panel>
          <Handle dir="h" />

          {/* ── 分頁 + 編輯器 ── */}
          <Panel defaultSize={44} minSize={25} className="flex flex-col">
            <div className="flex h-9 shrink-0 items-stretch border-b border-zinc-200 bg-zinc-50 dark:border-white/10 dark:bg-white/[0.03]">
              <div className="flex min-w-0 flex-1 items-stretch overflow-x-auto">
              {tabs.map(p => (
                <div
                  key={p}
                  role="tab"
                  aria-selected={active === p}
                  onClick={() => setActive(p)}
                  className={`group flex cursor-pointer items-center gap-2 border-r border-zinc-200 px-3 text-xs dark:border-white/10 ${
                    active === p
                      ? "bg-white text-zinc-900 dark:bg-[#0e0e12] dark:text-zinc-50"
                      : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                  }`}
                >
                  <FileIcon path={p} />
                  <span className="whitespace-nowrap">{p.split("/").pop()}</span>
                  {dirty.has(p) && <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />}
                  <button
                    type="button"
                    aria-label={`close ${p}`}
                    onClick={e => {
                      e.stopPropagation()
                      close(p)
                    }}
                    className="ml-1 rounded px-1 text-zinc-400 opacity-0 hover:bg-zinc-900/10 hover:text-zinc-900 group-hover:opacity-100 dark:hover:bg-white/10 dark:hover:text-zinc-50"
                  >
                    ×
                  </button>
                </div>
              ))}
              </div>
              <div
                className="flex shrink-0 items-center gap-2 border-l border-zinc-200 px-3 text-[11px] dark:border-white/10"
                title={t.draftHint}
              >
                <span
                  className={`whitespace-nowrap transition-colors ${
                    flash
                      ? "text-emerald-600 dark:text-emerald-300"
                      : dirty.size
                        ? "text-zinc-500 dark:text-zinc-400"
                        : "text-zinc-400 dark:text-zinc-600"
                  }`}
                >
                  {flash ? t.draftSaved : dirty.size ? `${t.draftSaved} · ${dirty.size}` : t.draftClean}
                </span>
                <button
                  type="button"
                  onClick={saveNow}
                  className="rounded border border-zinc-300 px-2 py-0.5 font-medium text-zinc-600 hover:border-violet-400 hover:text-violet-600 dark:border-white/15 dark:text-zinc-300 dark:hover:border-violet-400 dark:hover:text-violet-300"
                >
                  {t.save} <kbd className="ml-0.5 font-mono text-[10px] opacity-60">⌘S</kbd>
                </button>
              </div>
            </div>
            <div className="min-h-0 flex-1">
              {active ? (
                <Editor
                  height="100%"
                  path={active}
                  language={languageOf(active)}
                  value={files[active] ?? ""}
                  onChange={v => setFiles(f => ({ ...f, [active]: v ?? "" }))}
                  theme={dark ? "vs-dark" : "light"}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 13,
                    lineHeight: 20,
                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                    wordWrap: "on",
                    automaticLayout: true,
                    tabSize: 2,
                    scrollBeyondLastLine: false,
                    padding: { top: 10 },
                    renderLineHighlight: "gutter",
                    smoothScrolling: true
                  }}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-zinc-400">
                  {t.noFileOpen}
                </div>
              )}
            </div>
          </Panel>
          <Handle dir="h" />

          {/* ── 預覽 + console ── */}
          <Panel defaultSize={40} minSize={20}>
            <PanelGroup direction="vertical" autoSaveId={`sandbox-v-${id}`}>
              <Panel defaultSize={70} minSize={30} className="flex flex-col">
                <div className={`${chrome} gap-2`}>
                  <button
                    type="button"
                    onClick={refresh}
                    title={t.refresh}
                    className="rounded px-1.5 py-0.5 text-zinc-500 hover:bg-zinc-900/[0.05] hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-zinc-50"
                  >
                    ⟳
                  </button>
                  <div className="flex h-6 flex-1 items-center rounded-md bg-white px-2.5 font-mono text-[11px] text-zinc-400 ring-1 ring-zinc-200 dark:bg-black/30 dark:text-zinc-500 dark:ring-white/10">
                    localhost/{entry === "index.html" ? "" : entry}
                  </div>
                  <button
                    type="button"
                    onClick={openExternal}
                    title={t.openInNewWindow}
                    className="rounded px-1.5 py-0.5 text-zinc-500 hover:bg-zinc-900/[0.05] hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-zinc-50"
                  >
                    ⧉
                  </button>
                </div>
                <iframe
                  key={previewKey}
                  srcDoc={srcdoc}
                  title="Preview"
                  sandbox="allow-scripts allow-same-origin allow-modals allow-forms allow-popups"
                  className="min-h-0 flex-1 w-full border-0 bg-white"
                />
              </Panel>
              <Handle dir="v" />
              <Panel defaultSize={30} minSize={8} className="flex flex-col">
                <div className={`${chrome} justify-between`}>
                  <span className="font-bold tracking-[0.15em] text-zinc-400 dark:text-zinc-500">
                    CONSOLE
                    {logs.length > 0 && (
                      <span className="ml-2 rounded-full bg-zinc-900/[0.06] px-1.5 font-mono font-normal tracking-normal dark:bg-white/10">
                        {logs.length}
                      </span>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => setLogs([])}
                    className="rounded px-1.5 py-0.5 text-[11px] text-zinc-500 hover:bg-zinc-900/[0.05] hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-zinc-50"
                  >
                    {t.clear}
                  </button>
                </div>
                <div ref={consoleRef} className="min-h-0 flex-1 overflow-auto font-mono text-[12px] leading-5">
                  {logs.length === 0 ? (
                    <div className="px-3 py-2 text-zinc-400 dark:text-zinc-600">{t.consoleEmpty}</div>
                  ) : (
                    logs.map(l => (
                      <div
                        key={l.id}
                        className={`whitespace-pre-wrap break-words border-b border-zinc-100 px-3 py-1 dark:border-white/5 ${LEVEL_CLS[l.level]}`}
                      >
                        {l.args.join(" ")}
                      </div>
                    ))
                  )}
                </div>
              </Panel>
            </PanelGroup>
          </Panel>
        </PanelGroup>
      </div>
    </Boundary>
  )
}
