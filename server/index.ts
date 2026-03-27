import express from "express"
import { Client } from "@notionhq/client"

const app = express()
app.use(express.json())

const notion = new Client({ auth: process.env.NOTION_TOKEN })
const DATABASE_ID = process.env.NOTION_DATABASE_ID!

// Map a Notion page to the Task shape the frontend uses
function pageToTask(page: any) {
  const name = page.properties.Name?.title?.[0]?.plain_text ?? "Untitled"
  const done = page.properties.Done?.checkbox ?? false
  return { id: page.id, label: name, done }
}

// GET /api/tasks — fetch tasks scheduled for today from Notion
app.get("/api/tasks", async (_req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10) // "YYYY-MM-DD"
    const response = await notion.databases.query({
      database_id: DATABASE_ID,
      filter: {
        property: "Do Date",
        date: { equals: today },
      },
      sorts: [{ timestamp: "created_time", direction: "ascending" }],
    })
    res.json(response.results.map(pageToTask))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Failed to fetch tasks" })
  }
})

// POST /api/tasks — create a new task with today's Do Date
app.post("/api/tasks", async (req, res) => {
  const { label } = req.body
  const today = new Date().toISOString().slice(0, 10)
  try {
    const page = await notion.pages.create({
      parent: { database_id: DATABASE_ID },
      properties: {
        Name: { title: [{ text: { content: label ?? "New task" } }] },
        Done: { checkbox: false },
        "Do Date": { date: { start: today } },
      },
    })
    res.json(pageToTask(page))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Failed to create task" })
  }
})

// PATCH /api/tasks/:id — update done status and/or label
app.patch("/api/tasks/:id", async (req, res) => {
  const { id } = req.params
  const { done, label } = req.body
  try {
    const properties: Record<string, any> = {}
    if (done !== undefined) properties.Done = { checkbox: done }
    if (label !== undefined) properties.Name = { title: [{ text: { content: label } }] }
    const page = await notion.pages.update({ page_id: id, properties })
    res.json(pageToTask(page))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Failed to update task" })
  }
})

// DELETE /api/tasks/:id — archive the page
app.delete("/api/tasks/:id", async (req, res) => {
  const { id } = req.params
  try {
    await notion.pages.update({ page_id: id, archived: true })
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Failed to delete task" })
  }
})

const PORT = 3001
app.listen(PORT, () => console.log(`API server running on http://localhost:${PORT}`))
