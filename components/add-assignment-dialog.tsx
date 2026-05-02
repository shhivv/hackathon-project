"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { addCustomAssignment, type TrackedAssignment } from "@/lib/assignments"

interface AddAssignmentDialogProps {
  onAdd: (assignment: TrackedAssignment) => void
}

export function AddAssignmentDialog({ onAdd }: AddAssignmentDialogProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [courseName, setCourseName] = useState("")
  const [dueAt, setDueAt] = useState("")
  const [estimatedHours, setEstimatedHours] = useState("2")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return

    const assignment = addCustomAssignment({
      title: title.trim(),
      description: description.trim() || undefined,
      courseName: courseName.trim() || undefined,
      dueAt: dueAt ? new Date(dueAt).toISOString() : null,
      estimatedHours: Math.max(0.5, parseFloat(estimatedHours) || 2),
    })

    onAdd(assignment)
    setTitle("")
    setDescription("")
    setCourseName("")
    setDueAt("")
    setEstimatedHours("2")
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          Add Assignment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Custom Assignment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Assignment title"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="course">Course (optional)</Label>
            <Input
              id="course"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              placeholder="Course name"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="due">Due Date (optional)</Label>
            <Input
              id="due"
              type="datetime-local"
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="hours">Estimated hours</Label>
            <Input
              id="hours"
              type="number"
              min="0.5"
              step="0.5"
              value={estimatedHours}
              onChange={(e) => setEstimatedHours(e.target.value)}
              placeholder="2"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={!title.trim()}>
              Add
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
