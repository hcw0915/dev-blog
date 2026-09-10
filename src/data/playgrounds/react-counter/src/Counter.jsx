import { useState } from 'react'

const step = 1

export default function Counter({ onChange }) {
  const [count, setCount] = useState(0)

  const update = next => {
    console.log('count →', next)
    setCount(next)
    onChange?.(next)
  }

  return (
    <div className="counter">
      <button onClick={() => update(count - step)}>−</button>
      <span className="value">{count}</span>
      <button onClick={() => update(count + step)}>+</button>
    </div>
  )
}
