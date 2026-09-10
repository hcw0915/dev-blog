import { useState } from 'react'
import Counter from './Counter'

export default function App() {
  const [history, setHistory] = useState([])

  return (
    <main className="app">
      <h1>React Counter</h1>
      <p className="hint">
        試著改 <code>src/Counter.jsx</code> 的 step，或在 console 看每次點擊的紀錄。
      </p>
      <Counter onChange={n => setHistory(h => [...h, n])} />
      <p className="history">
        歷史：{history.length ? history.join(' → ') : '（還沒點）'}
      </p>
    </main>
  )
}
