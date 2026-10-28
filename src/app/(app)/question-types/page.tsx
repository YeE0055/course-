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
import { Switch } from '@/components/ui/switch';
import { Plus, Pencil, Trash2 } from 'lucide-react';

interface QuestionType {
  id: string;
  name: string;
  code: string;
  description: string | null;
  default_score: number;
  has_options: string;
  created_at: string;
}

export default function QuestionTypesPage() {
  const [types, setTypes] = useState<QuestionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<QuestionType | null>(null);
  const [form, setForm] = useState({ name: '', code: '', description: '', default_score: 5, has_options: 'false' });

  const fetchTypes = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/question-types');
    const data = await res.json();
    setTypes(data.data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTypes();
  }, [fetchTypes]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', code: '', description: '', default_score: 5, has_options: 'false' });
    setDialogOpen(true);
  };

  const openEdit = (qt: QuestionType) => {
    setEditing(qt);
    setForm({
      name: qt.name,
      code: qt.code,
      description: qt.description || '',
      default_score: qt.default_score,
      has_options: qt.has_options,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.code) return;
    if (editing) {
      await fetch('/api/question-types/[id]', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editing.id, ...form }),
      });
    } else {
      await fetch('/api/question-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
    }
    setDialogOpen(false);
    fetchTypes();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除该题型吗？')) return;
    await fetch(`/api/question-types/${id}`, { method: 'DELETE' });
    fetchTypes();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">题型管理</h1>
          <p className="text-sm text-muted-foreground mt-1">管理考试题目类型</p>
        </div>
        <Button onClick={openCreate} className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          新增题型
        </Button>
      </div>

      <Card className="border-border shadow-sm">
        <CardContent className="p-6">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>题型名称</TableHead>
                <TableHead>编码</TableHead>
                <TableHead>默认分值</TableHead>
                <TableHead>是否有选项</TableHead>
                <TableHead>描述</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">加载中...</TableCell></TableRow>
              ) : types.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">暂无数据</TableCell></TableRow>
              ) : (
                types.map((qt) => (
                  <TableRow key={qt.id}>
                    <TableCell className="font-medium">{qt.name}</TableCell>
                    <TableCell><Badge variant="outline" className="font-mono">{qt.code}</Badge></TableCell>
                    <TableCell>{qt.default_score} 分</TableCell>
                    <TableCell>
                      <Badge variant={qt.has_options === 'true' ? 'default' : 'secondary'}>
                        {qt.has_options === 'true' ? '是' : '否'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">{qt.description || '-'}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{new Date(qt.created_at).toLocaleDateString('zh-CN')}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(qt)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(qt.id)} className="text-destructive hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? '编辑题型' : '新增题型'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>题型名称 *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="如: 单选题" />
            </div>
            <div className="space-y-2">
              <Label>编码 *</Label>
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="如: single_choice" />
            </div>
            <div className="space-y-2">
              <Label>默认分值</Label>
              <Input type="number" value={form.default_score} onChange={(e) => setForm({ ...form, default_score: parseInt(e.target.value) || 5 })} />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.has_options === 'true'} onCheckedChange={(v) => setForm({ ...form, has_options: v ? 'true' : 'false' })} />
              <Label>需要选项（选择题）</Label>
            </div>
            <div className="space-y-2">
              <Label>描述</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="题型说明..." rows={3} />
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
