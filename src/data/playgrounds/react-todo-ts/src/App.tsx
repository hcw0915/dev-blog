import { useMemo, useState } from 'react'
import type { Todo, Filter } from './types'
import { useLocalState } from './useLocalState'

const FILTERS: Filter[] = ['all', 'active', 'done']

export default function App() {
  const [todos, setTodos] = useLocalState<Todo[]>('todos', [
    { id: 1, text: '把 done 改成字串，看編輯器標錯', done: false },
    { id: 2, text: '在 types.ts 加一個欄位', done: true },
  ])
  const [filter, setFilter] = useState<Filter>('all')
  const [draft, setDraft] = useState('')

  const visible = useMemo(
    () => todos.filter(t => filter === 'all' || (filter === 'done') === t.done),
    [todos, filter],
  )

  const add = () => {
    if (!draft.trim()) return
    setTodos(prev => [...prev, { id: Date.now(), text: draft.trim(), done: false }])
    setDraft('')
  }
  const toggle = (id: number) =>
    setTodos(prev => prev.map(t => (t.id === id ? { ...t, done: !t.done } : t)))

  return (
    <main className="app">
      <h1>Todo <span className="ts">TS</span></h1>
      <form onSubmit={e => { e.preventDefault(); add() }}>
        <input value={draft} onChange={e => setDraft(e.target.value)} placeholder="新增一項…" />
        <button type="submit">加入</button>
      </form>
      <nav>
        {FILTERS.map(f => (
          <button key={f} className={f === filter ? 'on' : ''} onClick={() => setFilter(f)}>{f}</button>
        ))}
      </nav>
      <ul>
        {visible.map(t => (
          <li key={t.id} className={t.done ? 'done' : ''} onClick={() => toggle(t.id)}>{t.text}</li>
        ))}
      </ul>
    </main>
  )
}
