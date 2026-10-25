// C:\Users\Ignacio\Desktop\Proyectos\DAMA-CRM\client\src\pages\PlannerBoard.tsx
import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';

// Light‑mode palette per AGENTS.md
const bgClass = 'bg-slate-100/90';
const borderClass = 'border-slate-200';

interface BoardTask {
  id: string;
  title: string;
  description?: string;
}

interface BoardColumn {
  id: string;
  title: string;
  tasks: BoardTask[];
}

interface Board {
  id: string;
  name: string;
  description?: string;
  columns: BoardColumn[];
}

export const PlannerBoard: React.FC = () => {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Simple fetch – assumes the dev server runs on same origin
  useEffect(() => {
    const fetchBoards = async () => {
      try {
        const res = await fetch('/api/planner');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setBoards(data);
      } catch (e) {
        setError((e as Error).message);
        toast.error('Failed to load planner data');
      } finally {
        setLoading(false);
      }
    };
    fetchBoards();
  }, []);

  if (loading) return <Spinner className="m-8" />;
  if (error) return <div className="p-8 text-red-600">Error: {error}</div>;

  return (
    <div className={`p-4 ${bgClass}`}>
      {boards.length === 0 && <p>No boards found.</p>}
      {boards.map(board => (
        <Card key={board.id} className={`mb-6 ${borderClass}`}>
          <CardHeader className="flex flex-row items-center justify-between">
            <h2 className="text-xl font-semibold">{board.name}</h2>
            <Badge variant="secondary">Board</Badge>
          </CardHeader>
          <CardContent>
            {board.description && <p className="mb-4 text-sm text-gray-600">{board.description}</p>}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {board.columns.map(col => (
                <Card key={col.id} className={`p-2 ${borderClass}`}>
                  <h3 className="font-medium mb-2">{col.title}</h3>
                  <ul>
                    {col.tasks.map(task => (
                      <li key={task.id} className="mb-1">{task.title}</li>
                    ))}
                  </ul>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
      {/* Example modal for creating a board – centered per AGENTS.md */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" className="mt-4">Add Board</Button>
        </DialogTrigger>
        <DialogContent
          className="fixed inset-0 flex items-center justify-center p-4 m-auto"
        >
          <DialogHeader>
            <DialogTitle>Create New Board</DialogTitle>
          </DialogHeader>
          <form
            className="flex flex-col gap-4"
            onSubmit={e => {
              e.preventDefault();
              toast.success('Board creation not implemented in this mock');
            }}
          >
            <Input placeholder="Board name" required />
            <Input placeholder="Description (optional)" />
            <Button type="submit">Create</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
