import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { dummyUsers } from '@/data/users';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function ProjectDetailsForm() {
  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <Label htmlFor="name">Project Name</Label>
        <Input id="name" placeholder="e.g. 'Q4 Marketing Campaign'" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" placeholder="Provide a brief summary of the project's objectives." />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="owner">Project Owner</Label>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select a project owner" />
          </SelectTrigger>
          <SelectContent>
            {dummyUsers.map(user => (
              <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}