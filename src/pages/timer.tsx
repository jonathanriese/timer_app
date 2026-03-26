import { useState, useEffect } from "react"
import { Play, Pause, Plus, RotateCcw, X, ChevronsRight, EllipsisVertical, Check, Coffee } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { TaskCard, type Task } from "@/components/TaskCard"

type TimerState = "idle" | "running" | "paused" | "done"

const INITIAL_TASKS: Task[] = [
  { id: "1", label: "Test", done: false },
  { id: "2", label: "Test 2", done: true },
]

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

export default function TimerPage() {
  const [time, setTime] = useState("25")
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS)
  const [newTaskId, setNewTaskId] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const [timerState, setTimerState] = useState<TimerState>("idle")
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const [initialSeconds, setInitialSeconds] = useState(0)
  const [isBreak, setIsBreak] = useState(false)

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [defaultTime, setDefaultTime] = useState("25")
  const [defaultBreakTime, setDefaultBreakTime] = useState("5")

  const selectedTask = tasks.find((t) => t.id === selectedTaskId) ?? null

  // Countdown
  useEffect(() => {
    if (timerState !== "running") return
    const id = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) { setTimerState("done"); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [timerState])

  // After a break ends, play a chime and return to idle
  useEffect(() => {
    if (timerState !== "done" || !isBreak) return
    const ctx = new AudioContext()
    const frequencies = [880, 1109, 1320]
    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = "sine"
      osc.frequency.value = freq
      const t = ctx.currentTime + i * 0.18
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(0.35, t + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.9)
      osc.start(t)
      osc.stop(t + 0.9)
    })
    setTimeout(() => ctx.close(), 2000)
    setTimerState("idle")
    setIsBreak(false)
  }, [timerState, isBreak])

  // Play a soft chime when the (non-break) timer finishes
  useEffect(() => {
    if (timerState !== "done") return
    const ctx = new AudioContext()
    const frequencies = [880, 1109, 1320]
    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = "sine"
      osc.frequency.value = freq
      const t = ctx.currentTime + i * 0.18
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(0.35, t + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.9)
      osc.start(t)
      osc.stop(t + 0.9)
    })
    return () => ctx.close()
  }, [timerState])

  function startTimer() {
    const secs = Math.max(1, parseInt(time) || 1) * 60
    setInitialSeconds(secs)
    setRemainingSeconds(secs)
    setIsBreak(false)
    setTimerState("running")
  }

  function startBreak() {
    const secs = Math.max(1, parseInt(defaultBreakTime) || 5) * 60
    setInitialSeconds(secs)
    setRemainingSeconds(secs)
    setIsBreak(true)
    setTimerState("running")
  }

  function toggleTask(id: string) {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t
        if (!t.done && selectedTaskId === id) setSelectedTaskId(null)
        return { ...t, done: !t.done }
      })
    )
  }

  function renameTask(id: string, label: string) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, label } : t)))
    if (id === newTaskId) setNewTaskId(null)
  }

  function deleteTask(id: string) {
    if (selectedTaskId === id) setSelectedTaskId(null)
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }

  function addTask() {
    const newTask: Task = { id: String(Date.now()), label: "New task", done: false }
    setTasks((prev) => [...prev, newTask])
    setNewTaskId(newTask.id)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(false)
    const id = e.dataTransfer.getData("taskId")
    if (id) setSelectedTaskId(id)
  }

  const sortedTasks = [...tasks].sort((a, b) => Number(a.done) - Number(b.done))

  // Header changes with timer state
  const HeaderIcon = timerState === "done" ? Check : ChevronsRight
  const headerLabel = timerState === "idle"
    ? "Set timer"
    : timerState === "done"
      ? "Done"
      : isBreak
        ? "☕ Break time"
        : (selectedTask?.label ?? "No task selected")

  return (
    <div className="min-h-screen bg-neutral-950 flex items-start justify-center p-8">
      <div className="w-full max-w-sm bg-black rounded-[12px] p-6 flex flex-col gap-6 overflow-hidden">

        {/* ── HEADER ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
            <HeaderIcon className="h-5 w-5 shrink-0" />
            <span className="text-base leading-6 truncate">{headerLabel}</span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            onClick={() => setSettingsOpen(true)}
          >
            <EllipsisVertical className="h-4 w-4" />
          </Button>
        </div>

        {/* ── IDLE VIEW ── */}
        {timerState === "idle" && (
          <div className="flex flex-col gap-4">

            {/* Time field */}
            <div className="flex items-center gap-4">
              <Label className="text-[var(--foreground)] text-base font-normal w-10 shrink-0 leading-6">
                Time
              </Label>
              <div className="relative flex-1">
                <Input
                  type="number"
                  min={1}
                  max={120}
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="bg-[var(--input)] border-[var(--border)] text-[var(--foreground)] pr-20"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[var(--muted-foreground)] pointer-events-none">
                  minutes
                </span>
              </div>
            </div>

            {/* Task drag zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              className={`flex items-center gap-2 px-3 py-2 rounded-[var(--rounded-lg,8px)] border text-sm transition-colors
                ${selectedTask ? "justify-between" : "justify-center"}
                ${isDragOver
                  ? "border-[var(--ring)] bg-[var(--accent)] text-[var(--accent-foreground)]"
                  : selectedTask
                    ? "border-[var(--border)] bg-[var(--input)] text-[var(--foreground)]"
                    : "border-dashed border-[var(--border)] bg-transparent text-[var(--muted-foreground)]"
                }`}
            >
              <span className="truncate leading-6">
                {selectedTask ? selectedTask.label : "Drag a task here"}
              </span>
              {selectedTask && (
                <button
                  onClick={() => setSelectedTaskId(null)}
                  className="shrink-0 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Start button */}
            <Button className="w-fit" onClick={startTimer}>
              <Play className="h-4 w-4" />
              Start timer
            </Button>
          </div>
        )}

        {/* ── DONE / BREAK PROMPT VIEW ── */}
        {timerState === "done" && (
          <div className="flex flex-col gap-4">
            <p className="text-[64px] leading-none text-[var(--foreground)] font-normal tracking-[0px]">
              Take a break?
            </p>
            <div className="flex items-center gap-2">
              <Button onClick={startBreak}>
                <Coffee className="h-4 w-4" />
                Start break
              </Button>
              <Button variant="secondary" onClick={() => setTimerState("idle")}>
                Skip
              </Button>
            </div>
          </div>
        )}

        {/* ── RUNNING / PAUSED VIEW ── */}
        {(timerState === "running" || timerState === "paused") && (
          <div className="flex flex-col gap-4">
            <p className={`text-[64px] leading-none font-normal tracking-[0px] transition-colors duration-300 ${
              timerState === "running" && remainingSeconds <= 5
                ? "text-[var(--destructive)]"
                : "text-[var(--foreground)]"
            }`}>
              {formatTime(remainingSeconds)}
            </p>
            <div className="flex items-center gap-2">
              {timerState === "running" ? (
                <Button onClick={() => setTimerState("paused")}>
                  <Pause className="h-4 w-4" />
                  Stop
                </Button>
              ) : (
                <Button onClick={() => setTimerState("running")}>
                  <Play className="h-4 w-4" />
                  Resume
                </Button>
              )}
              <Button variant="secondary" size="icon" onClick={() => setRemainingSeconds(initialSeconds)}>
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => { setTimerState("idle"); setRemainingSeconds(0) }}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ── TASK LIST ── */}
        {!isBreak && <div className="flex flex-col gap-4 mt-2">
          <p className="text-[var(--foreground)] text-base font-normal leading-6">
            My tasks for today
          </p>
          <div className="flex flex-col gap-3">
            {sortedTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggle={toggleTask}
                onDelete={deleteTask}
                onRename={renameTask}
                autoEdit={task.id === newTaskId}
                draggable={!task.done && timerState === "idle"}
                selected={task.id === selectedTaskId}
              />
            ))}
          </div>
          <Button variant="secondary" className="w-fit" onClick={addTask}>
            <Plus className="h-4 w-4" />
            Add task
          </Button>
        </div>}

      </div>

      {/* ── SETTINGS DIALOG ── */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-sm min-h-[320px] flex flex-col justify-start top-8 translate-y-0">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex items-center gap-4">
              <Label htmlFor="default-time" className="w-28 shrink-0">
                Default time
              </Label>
              <div className="relative flex-1">
                <Input
                  id="default-time"
                  type="number"
                  min={1}
                  max={120}
                  value={defaultTime}
                  onChange={(e) => { setDefaultTime(e.target.value); setTime(e.target.value) }}
                  className="pr-20"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[var(--muted-foreground)] pointer-events-none">
                  minutes
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Label htmlFor="break-time" className="w-28 shrink-0">
                Break time
              </Label>
              <div className="relative flex-1">
                <Input
                  id="break-time"
                  type="number"
                  min={1}
                  max={60}
                  value={defaultBreakTime}
                  onChange={(e) => setDefaultBreakTime(e.target.value)}
                  className="pr-20"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[var(--muted-foreground)] pointer-events-none">
                  minutes
                </span>
              </div>
            </div>
          </div>
          <Accordion type="single" collapsible>
            <AccordionItem value="dev-tools" className="border-none">
              <AccordionTrigger className="text-xs text-[var(--muted-foreground)] py-3">
                Dev tools
              </AccordionTrigger>
              <AccordionContent className="pb-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setRemainingSeconds(1)
                    setSettingsOpen(false)
                  }}
                >
                  Skip timer
                </Button>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </DialogContent>
      </Dialog>
    </div>
  )
}
