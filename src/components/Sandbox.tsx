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

// sessionStorage：同一分頁重新整理還在，關掉分頁就回到原始範例。
// localStorage 會留下永遠不消失的舊草稿，讀者下次進來看到的不是範例而是自己上個月的手滑。
const DRAFT_KEY = (id: string) => `sandbox:draft:${id}`
const draftStore = () => (typeof sessionStorage !== "undefined" ? sessionStorage : null)

/** 檔名檢查：相對路徑、不能往上跳、不能以 / 開頭或結尾 */
const isValidPath = (p: string) =>
  p.length > 0 && !p.startsWith("/") && !p.endsWith("/") && !p.split("/").some(seg => seg === "" || seg === "." || seg === "..")

/** 跟 original 比：改過 + 新增 + 刪除 的檔案數 */
const countChanges = (files: FileMap, original: FileMap) => {
  const keys = new Set([...Object.keys(files), ...Object.keys(original)])
  let n = 0
  for (const k of keys) if (files[k] !== original[k]) n++
  return n
}

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

/** 行內輸入：Enter 確認、Esc 取消、失焦確認 */
function NameInput({
  initial,
  error,
  onCommit,
  onCancel,
  indent
}: {
  initial: string
  error?: string
  onCommit: (v: string) => void
  onCancel: () => void
  indent: number
}) {
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.focus()
    // 改名時預選檔名主體（不含副檔名），跟 VS Code 一樣
    const dot = initial.lastIndexOf(".")
    const slash = initial.lastIndexOf("/") + 1
    el.setSelectionRange(slash, dot > slash ? dot : initial.length)
  }, [initial])
  return (
    <div style={{ paddingLeft: indent }} className="pr-2">
      <input
        ref={ref}
        defaultValue={initial}
        spellCheck={false}
        onKeyDown={e => {
          if (e.key === "Enter") onCommit(e.currentTarget.value)
          if (e.key === "Escape") onCancel()
        }}
        onBlur={e => onCommit(e.currentTarget.value)}
        className={`w-full rounded border bg-white px-1.5 py-0.5 font-mono text-[12px] text-zinc-900 outline-none dark:bg-black/40 dark:text-zinc-50 ${
          error ? "border-red-500" : "border-violet-400"
        }`}
      />
      {error && <div className="mt-0.5 text-[11px] text-red-500">{error}</div>}
    </div>
  )
}

interface TreeActions {
  onRename: (p: string) => void
  onDelete: (p: string) => void
  onDeleteFolder: (p: string) => void
  onNewIn: (folder: string) => void
  entry: string
  editing: { kind: "new" | "rename"; path: string; error?: string } | null
  onCommit: (v: string) => void
  onCancelEdit: () => void
}

const ACTION_BTN =
  "hidden group-hover:inline-flex h-4 w-4 shrink-0 items-center justify-center rounded text-[11px] text-zinc-400 hover:bg-zinc-900/10 hover:text-zinc-900 dark:hover:bg-white/15 dark:hover:text-zinc-50"

function Tree({
  nodes,
  active,
  dirty,
  collapsed,
  onToggle,
  onOpen,
  actions,
  depth = 0
}: {
  nodes: TreeNode[]
  active: string
  dirty: Set<string>
  collapsed: Set<string>
  onToggle: (p: string) => void
  onOpen: (p: string) => void
  actions: TreeActions
  depth?: number
}) {
  const { editing } = actions
  return (
    <ul className="text-[13px] leading-6">
      {nodes.map(n =>
        n.children ? (
          <li key={n.path}>
            <div className="group flex items-center pr-1">
              <button
                type="button"
                onClick={() => onToggle(n.path)}
                className="flex min-w-0 flex-1 items-center gap-1.5 text-left text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100"
                style={{ paddingLeft: 8 + depth * 12 }}
              >
                <span
                  className={`inline-block text-[9px] transition-transform ${
                    collapsed.has(n.path) ? "" : "rotate-90"
                  }`}
                >
                  ▶
                </span>
                <span className="truncate font-medium">{n.name}</span>
              </button>
              <button type="button" title="New file here" className={ACTION_BTN} onClick={() => actions.onNewIn(n.path)}>+</button>
              <button type="button" title="Delete folder" className={ACTION_BTN} onClick={() => actions.onDeleteFolder(n.path)}>×</button>
            </div>
            {editing?.kind === "new" && editing.path === n.path + "/" && (
              <NameInput
                initial={editing.path}
                error={editing.error}
                onCommit={actions.onCommit}
                onCancel={actions.onCancelEdit}
                indent={8 + (depth + 1) * 12 + 14}
              />
            )}
            {!collapsed.has(n.path) && (
              <Tree
                nodes={n.children}
                active={active}
                dirty={dirty}
                collapsed={collapsed}
                onToggle={onToggle}
                onOpen={onOpen}
                actions={actions}
                depth={depth + 1}
              />
            )}
          </li>
        ) : editing?.kind === "rename" && editing.path === n.path ? (
          <li key={n.path}>
            <NameInput
              initial={n.path}
              error={editing.error}
              onCommit={actions.onCommit}
              onCancel={actions.onCancelEdit}
              indent={8 + depth * 12 + 14}
            />
          </li>
        ) : (
          <li key={n.path} className="group flex items-center pr-1">
            <button
              type="button"
              onClick={() => onOpen(n.path)}
              onDoubleClick={() => n.path !== actions.entry && actions.onRename(n.path)}
              className={`flex min-w-0 flex-1 items-center gap-2 text-left transition-colors ${
                active === n.path
                  ? "bg-violet-500/10 dark:bg-white/[0.07]"
                  : "hover:bg-zinc-900/[0.04] dark:hover:bg-white/[0.04]"
              } ${
                dirty.has(n.path)
                  ? "text-amber-700 dark:text-amber-300"
                  : active === n.path
                    ? "text-zinc-900 dark:text-zinc-50"
                    : "text-zinc-600 dark:text-zinc-400"
              }`}
              style={{ paddingLeft: 8 + depth * 12 + 14 }}
              title={dirty.has(n.path) ? "Modified（與原始檔不同）" : undefined}
            >
              <FileIcon path={n.path} />
              <span className="truncate">{n.name}</span>
              {dirty.has(n.path) && (
                <span className="ml-auto mr-1 shrink-0 font-mono text-[10px] font-bold opacity-80">M</span>
              )}
            </button>
            {n.path !== actions.entry && (
              <>
                <button type="button" title="Rename" className={ACTION_BTN} onClick={() => actions.onRename(n.path)}>✎</button>
                <button type="button" title="Delete" className={ACTION_BTN} onClick={() => actions.onDelete(n.path)}>×</button>
              </>
            )}
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
      const raw = draftStore()?.getItem(DRAFT_KEY(id))
      if (raw) {
        const draft = JSON.parse(raw)
        if (draft && typeof draft === "object" && !Array.isArray(draft)) return draft as FileMap
      }
    } catch {}
    return original
  })
  const [editing, setEditing] = useState<{ kind: "new" | "rename"; path: string; error?: string } | null>(null)
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
  const changeCount = useMemo(() => countChanges(files, original), [files, original])

  // 草稿存在瀏覽器 localStorage：靜態站寫不回原始檔，跟 CodeSandbox 未登入時一樣
  const persist = useCallback(
    (next: FileMap) => {
      try {
        const store = draftStore()
        if (countChanges(next, original)) store?.setItem(DRAFT_KEY(id), JSON.stringify(next))
        else store?.removeItem(DRAFT_KEY(id))
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

  // Monaco 的 TypeScript 服務：預設不認 JSX、也不知道 esm.sh 套件的型別，會滿屏假錯。
  // 這裡設 jsx / 模組解析、忽略「找不到模組」，並把所有檔案先建成 model，
  // 跨檔 import 的型別才解析得到 —— 之後 .ts/.tsx 有真正的型別檢查。
  const monacoRef = useRef<any>(null)
  const uriOf = useCallback((p: string) => monacoRef.current?.Uri.parse(`file:///${id}/${p}`), [id])
  const ensureModel = useCallback(
    (p: string, content: string) => {
      const monaco = monacoRef.current
      if (!monaco) return
      const uri = uriOf(p)
      const m = monaco.editor.getModel(uri)
      if (m) {
        if (m.getValue() !== content) m.setValue(content)
      } else monaco.editor.createModel(content, languageOf(p), uri)
    },
    [uriOf]
  )
  const disposeModel = useCallback(
    (p: string) => {
      const monaco = monacoRef.current
      if (!monaco) return
      monaco.editor.getModel(uriOf(p))?.dispose()
    },
    [uriOf]
  )
  const beforeMount = useCallback(
    (monaco: any) => {
      if (monacoRef.current) return
      monacoRef.current = monaco
      const ts = monaco.languages.typescript
      const opts = {
        target: ts.ScriptTarget.ESNext,
        module: ts.ModuleKind.ESNext,
        moduleResolution: ts.ModuleResolutionKind.NodeJs,
        jsx: ts.JsxEmit.ReactJSX,
        allowJs: true,
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        strict: true,
        // ponytail: 沒有 React 的 .d.ts，hooks 回傳值與事件參數都是 any，開 noImplicitAny
        // 只會滿屏假錯。要真正的 React 型別得做 ATA（automatic type acquisition：
        // 從 esm.sh 抓 @types/react 及其相依 csstype/prop-types 塞進 addExtraLib）。
        noImplicitAny: false,
        noEmit: true,
        skipLibCheck: true
      }
      const diag = {
        // 2307 找不到模組、7016 沒有宣告檔：外部套件從 esm.sh 來，瀏覽器端沒有 .d.ts
        // 7026 / 2875：沒有 React 的型別就不認識 JSX.IntrinsicElements 與 jsx-runtime
        diagnosticCodesToIgnore: [2307, 7016, 7026, 2875, 7044]
      }
      ts.typescriptDefaults.setCompilerOptions(opts)
      ts.javascriptDefaults.setCompilerOptions(opts)
      ts.typescriptDefaults.setDiagnosticsOptions(diag)
      ts.javascriptDefaults.setDiagnosticsOptions(diag)
      ts.typescriptDefaults.setEagerModelSync(true)
      ts.javascriptDefaults.setEagerModelSync(true)
      for (const [p, content] of Object.entries(files)) {
        const uri = monaco.Uri.parse(`file:///${id}/${p}`)
        const existing = monaco.editor.getModel(uri)
        if (existing) existing.setValue(content)
        else monaco.editor.createModel(content, languageOf(p), uri)
      }
    },
    [files, id]
  )

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
    if (!changeCount || confirm(t.resetConfirm)) {
      setFiles(original)
      setTabs(ts => ts.filter(p => original[p] !== undefined))
      if (original[active] === undefined) setActive(entry)
      for (const p of Object.keys(files)) if (original[p] === undefined) disposeModel(p)
      for (const [p, content] of Object.entries(original)) ensureModel(p, content)
      try {
        draftStore()?.removeItem(DRAFT_KEY(id))
      } catch {}
    }
  }

  // ── 檔案操作：新增 / 改名 / 刪除 ─────────────────────────────────────
  const createFile = (path: string) => {
    setFiles(f => ({ ...f, [path]: "" }))
    ensureModel(path, "")
    open(path)
  }
  const renameFile = (from: string, to: string) => {
    setFiles(f => {
      const next: FileMap = {}
      for (const [p, c] of Object.entries(f)) next[p === from ? to : p] = c
      return next
    })
    ensureModel(to, files[from] ?? "")
    disposeModel(from)
    setTabs(ts => ts.map(p => (p === from ? to : p)))
    if (active === from) setActive(to)
  }
  const deletePaths = (paths: string[]) => {
    const gone = new Set(paths)
    setFiles(f => {
      const next: FileMap = {}
      for (const [p, c] of Object.entries(f)) if (!gone.has(p)) next[p] = c
      return next
    })
    paths.forEach(disposeModel)
    const remaining = tabs.filter(p => !gone.has(p))
    setTabs(remaining)
    if (gone.has(active)) setActive(remaining[0] ?? entry)
  }
  const deleteFile = (path: string) => {
    if (path === entry) return
    if (confirm(t.deleteConfirm.replace("{name}", path))) deletePaths([path])
  }
  const deleteFolder = (folder: string) => {
    const inside = Object.keys(files).filter(p => p.startsWith(folder + "/"))
    if (inside.includes(entry)) return
    if (confirm(t.deleteConfirm.replace("{name}", `${folder}/ (${inside.length})`))) deletePaths(inside)
  }
  /** 新增或改名的收尾：驗證 → 套用 → 關掉輸入框 */
  const commitEdit = (value: string) => {
    if (!editing) return
    const name = value.trim().replace(/^\.\//, "")
    if (!isValidPath(name)) return setEditing({ ...editing, error: t.invalidName })
    if (editing.kind === "rename" && name === editing.path) return setEditing(null)
    if (files[name] !== undefined) return setEditing({ ...editing, error: t.nameExists })
    if (editing.kind === "new") createFile(name)
    else renameFile(editing.path, name)
    setEditing(null)
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
              <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => setEditing({ kind: "new", path: "" })}
                title={t.newFile}
                className="rounded px-1.5 py-0.5 text-[13px] leading-none text-zinc-500 hover:bg-zinc-900/[0.05] hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-zinc-50"
              >
                +
              </button>
              <button
                type="button"
                onClick={reset}
                disabled={!changeCount}
                title={t.reset}
                className="rounded px-1.5 py-0.5 text-[11px] text-zinc-500 hover:bg-zinc-900/[0.05] hover:text-zinc-900 disabled:opacity-30 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-zinc-50"
              >
                {t.reset}
              </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto py-1.5">
              {editing?.kind === "new" && !editing.path.includes("/") && (
                <NameInput
                  initial={editing.path}
                  error={editing.error}
                  onCommit={commitEdit}
                  onCancel={() => setEditing(null)}
                  indent={8}
                />
              )}
              <Tree
                nodes={tree}
                active={active}
                dirty={dirty}
                collapsed={collapsed}
                onToggle={toggleFolder}
                onOpen={open}
                actions={{
                  entry,
                  editing,
                  onRename: p => setEditing({ kind: "rename", path: p }),
                  onDelete: deleteFile,
                  onDeleteFolder: deleteFolder,
                  onNewIn: folder => {
                    setCollapsed(s => {
                      const n = new Set(s)
                      n.delete(folder)
                      return n
                    })
                    setEditing({ kind: "new", path: folder + "/" })
                  },
                  onCommit: commitEdit,
                  onCancelEdit: () => setEditing(null)
                }}
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
                    active === p ? "bg-white dark:bg-[#0e0e12]" : ""
                  } ${
                    dirty.has(p)
                      ? "text-amber-700 dark:text-amber-300"
                      : active === p
                        ? "text-zinc-900 dark:text-zinc-50"
                        : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                  }`}
                  title={dirty.has(p) ? "Modified（與原始檔不同）" : undefined}
                >
                  <FileIcon path={p} />
                  <span className="whitespace-nowrap">{p.split("/").pop()}</span>
                  {dirty.has(p) && <span className="font-mono text-[10px] font-bold opacity-80">M</span>}
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
                      : changeCount
                        ? "text-zinc-500 dark:text-zinc-400"
                        : "text-zinc-400 dark:text-zinc-600"
                  }`}
                >
                  {flash ? t.draftSaved : changeCount ? `${t.draftSaved} · ${changeCount}` : t.draftClean}
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
                  path={`file:///${id}/${active}`}
                  beforeMount={beforeMount}
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
