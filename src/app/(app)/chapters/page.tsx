'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

interface Chapter {
  id: string;
  course_id: string;
  parent_id: string | null;
  name: string;
  sort_order: number;
  description: string | null;
  created_at: string;
  courses?: { name: string };
}

interface Course {
  id: string;
  name: string;
  code: string;
}

export default function ChaptersPage() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filterCourse, setFilterCourse] = useState('');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Chapter | null>(null);
  const [form, setForm] = useState({ course_id: '', parent_id: '', name: '', sort_order: 0, description: '' });

  const fetchCourses = async () => {
    const res = await fetch('/api/courses');
    const data = await res.json();
    setCourses(data.data || []);
  };

  const fetchChapters = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: '15' });
    if (filterCourse) params.set('course_id', filterCourse);
    const res = await fetch(`/api/chapters?${params}`);
    const data = await res.json();
    setChapters(data.data || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [page, filterCourse]);

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    fetchChapters();
  }, [fetchChapters]);

  const openCreate = () => {
    setEditing(null);
    setForm({ course_id: '', parent_id: '', name: '', sort_order: 0, description: '' });
    setDialogOpen(true);
  };

  const openEdit = (ch: Chapter) => {
    setEditing(ch);
    setForm({
      course_id: ch.course_id,
      parent_id: ch.parent_id || '',
      name: ch.name,
      sort_order: ch.sort_order,
      description: ch.description || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.course_id || !form.name) return;
    if (editing) {
      await fetch('/api/chapters/[id]', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editing.id, ...form }),
      });
    } else {
      await fetch('/api/chapters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
    }
    setDialogOpen(false);
    fetchChapters();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除该章节吗？')) return;
    await fetch(`/api/chapters/${id}`, { method: 'DELETE' });
    fetchChapters();
  };

  const totalPages = Math.ceil(total / 15);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">章节管理</h1>
          <p className="text-sm text-muted-foreground mt-1">管理课程下的章节结构</p>
        </div>
        <Button onClick={openCreate} className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          新增章节
        </Button>
      </div>

      <Card className="border-border shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <Select value={filterCourse} onValueChange={(v) => { setFilterCourse(v === 'all' ? '' : v); setPage(1); }}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="筛选课程" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部课程</SelectItem>
                {courses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>章节名称</TableHead>
                <TableHead>所属课程</TableHead>
                <TableHead>排序</TableHead>
                <TableHead>描述</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">加载中...</TableCell></TableRow>
              ) : chapters.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">暂无数据</TableCell></TableRow>
              ) : (
                chapters.map((ch) => (
                  <TableRow key={ch.id}>
                    <TableCell className="font-medium">{ch.name}</TableCell>
                    <TableCell className="text-muted-foreground">{(ch.courses as { name: string })?.name || '-'}</TableCell>
                    <TableCell>{ch.sort_order}</TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">{ch.description || '-'}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{new Date(ch.created_at).toLocaleDateString('zh-CN')}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(ch)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(ch.id)} className="text-destructive hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-5 pt-5 border-t border-border">
              <p className="text-sm text-muted-foreground">共 {total} 条记录</p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}><ChevronRight className="h-4 w-4" /></Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? '编辑章节' : '新增章节'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>所属课程 *</Label>
              <Select value={form.course_id} onValueChange={(v) => setForm({ ...form, course_id: v })}>
                <SelectTrigger><SelectValue placeholder="选择课程" /></SelectTrigger>
                <SelectContent>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name} ({c.code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>章节名称 *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="请输入章节名称" />
            </div>
            <div className="space-y-2">
              <Label>排序</Label>
              <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="space-y-2">
              <Label>描述</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="章节描述..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
