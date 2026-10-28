'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

interface Course {
  id: string;
  name: string;
  code: string;
  description: string | null;
  credit: number;
  teacher: string | null;
  status: string;
  created_at: string;
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [form, setForm] = useState({ name: '', code: '', description: '', credit: 0, teacher: '' });

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: '10' });
    if (keyword) params.set('keyword', keyword);
    const res = await fetch(`/api/courses?${params}`);
    const data = await res.json();
    setCourses(data.data || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [page, keyword]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleSearch = () => {
    setPage(1);
    fetchCourses();
  };

  const openCreateDialog = () => {
    setEditingCourse(null);
    setForm({ name: '', code: '', description: '', credit: 0, teacher: '' });
    setDialogOpen(true);
  };

  const openEditDialog = (course: Course) => {
    setEditingCourse(course);
    setForm({
      name: course.name,
      code: course.code,
      description: course.description || '',
      credit: course.credit,
      teacher: course.teacher || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.code) return;
    if (editingCourse) {
      await fetch('/api/courses/[id]', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingCourse.id, ...form }),
      });
    } else {
      await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
    }
    setDialogOpen(false);
    fetchCourses();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除该课程吗？')) return;
    await fetch(`/api/courses/${id}`, { method: 'DELETE' });
    fetchCourses();
  };

  const totalPages = Math.ceil(total / 10);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">课程管理</h1>
          <p className="text-sm text-muted-foreground mt-1">管理所有课程信息</p>
        </div>
        <Button onClick={openCreateDialog} className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          新增课程
        </Button>
      </div>

      <Card className="border-border shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索课程名称或编号..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-9"
              />
            </div>
            <Button variant="outline" onClick={handleSearch}>搜索</Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>课程名称</TableHead>
                <TableHead>课程编号</TableHead>
                <TableHead>学分</TableHead>
                <TableHead>教师</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    加载中...
                  </TableCell>
                </TableRow>
              ) : courses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    暂无课程数据
                  </TableCell>
                </TableRow>
              ) : (
                courses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell className="font-medium">{course.name}</TableCell>
                    <TableCell className="text-muted-foreground font-mono text-sm">{course.code}</TableCell>
                    <TableCell>{course.credit}</TableCell>
                    <TableCell>{course.teacher || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={course.status === 'active' ? 'default' : 'secondary'}>
                        {course.status === 'active' ? '启用' : '停用'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(course.created_at).toLocaleDateString('zh-CN')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(course)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(course.id)} className="text-destructive hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
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
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  {page} / {totalPages}
                </span>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCourse ? '编辑课程' : '新增课程'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>课程名称 *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="请输入课程名称" />
            </div>
            <div className="space-y-2">
              <Label>课程编号 *</Label>
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="如: CS101" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>学分</Label>
                <Input type="number" value={form.credit} onChange={(e) => setForm({ ...form, credit: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label>教师</Label>
                <Input value={form.teacher} onChange={(e) => setForm({ ...form, teacher: e.target.value })} placeholder="授课教师" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>课程描述</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="课程简介..." rows={3} />
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
