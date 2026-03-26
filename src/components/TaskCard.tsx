import { useEffect, useRef, useState } from "react"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"

export type Task = {
  id: string
  label: string
  done: boolean
}

interface TaskCardProps {
  task: Task
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onRename: (id: string, label: string) => void
  autoEdit?: boolean
  draggable?: boolean
  selected?: boolean
}

export function TaskCard({ task, onToggle, onDelete, onRename, autoEdit = false, draggable: isDraggable = false, selected = false }: TaskCardProps) {
  const [editing, setEditing] = useState(autoEdit)
  const [draft, setDraft] = useState(task.label)
  const inputRef = useRef<HTMLInputElement>(null)
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (editing) {
      setDraft(task.label)
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing, task.label])

  function commit() {
    const trimmed = draft.trim()
    if (trimmed) onRename(task.id, trimmed)
    setEditing(false)
  }

  function cancel() {
    setDraft(task.label)
    setEditing(false)
  }

  function handleClick() {
    if (editing) return
    if (clickTimer.current) {
      // Second click arrived — it's a double-click, cancel toggle and edit instead
      clearTimeout(clickTimer.current)
      clickTimer.current = null
      setEditing(true)
    } else {
      // First click — wait to see if a second follows
      clickTimer.current = setTimeout(() => {
        clickTimer.current = null
        onToggle(task.id)
      }, 220)
    }
  }

  return (
    <div
      onClick={handleClick}
      draggable={isDraggable && !editing}
      onDragStart={isDraggable ? (e) => e.dataTransfer.setData("taskId", task.id) : undefined}
      className={`flex items-center gap-3 px-3 py-2 rounded-[var(--radius)] border w-full cursor-pointer transition-colors hover:bg-[var(--accent)] ${selected ? "bg-[var(--card)] border-[var(--destructive)]" : "bg-[var(--card)] border-[var(--border)]"}`}
    >
      <div className="shrink-0">
        <Checkbox
          checked={task.done}
          onCheckedChange={() => onToggle(task.id)}
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit()
            if (e.key === "Escape") cancel()
          }}
          className="flex-1 text-sm leading-5 bg-transparent outline-none text-[var(--foreground)] border-b border-[var(--border)]"
        />
      ) : (
        <span className={`flex-1 text-sm leading-5 transition-colors select-none ${task.done ? "text-[var(--muted-foreground)]" : "text-[var(--foreground)]"}`}>
          {task.label}
        </span>
      )}

      <Button
        variant="ghost"
        size="icon"
        className="shrink-0 h-7 w-7 text-[var(--muted-foreground)] hover:text-[var(--destructive)] hover:bg-transparent"
        onClick={(e) => { e.stopPropagation(); onDelete(task.id) }}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}
