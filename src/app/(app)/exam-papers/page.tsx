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
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Pencil, Trash2, Eye, Download, ChevronLeft, ChevronRight } from 'lucide-react';

interface ExamPaper {
  id: string;
  title: string;
  course_id: string;
  description: string | null;
  total_score: number;
  duration_minutes: number;
  status: string;
  created_at: string;
  courses?: { name: string };
}

interface PaperDetail {
  id: string;
  title: string;
  course_id: string;
  description: string | null;
  total_score: number;
  duration_minutes: number;
  status: string;
  courses?: { name: string };
  questions: Array<{
    id: string;
    sort_order: number;
    score: number;
    questions: {
      id: string;
      content: string;
      options: Array<{ label: string; text: string }> | null;
      answer: string;
      analysis: string | null;
      difficulty: number;
      question_types?: { name: string };
      chapters?: { name: string };
    };
  }>;
}

interface Course { id: string; name: string; code: string }
interface Question {
  id: string;
  content: string;
  difficulty: number;
  score: number;
  courses?: { name: string };
  chapters?: { name: string };
  question_types?: { name: string };
}

const difficultyLabels: Record<number, string> = { 1: '简单', 2: '较易', 3: '中等', 4: '较难', 5: '困难' };

export default function ExamPapersPage() {
  const [papers, setPapers] = useState<ExamPaper[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selectOpen, setSelectOpen] = useState(false);
  const [viewPaper, setViewPaper] = useState<PaperDetail | null>(null);

  // Create form
  const [form, setForm] = useState({ title: '', course_id: '', description: '', total_score: 100, duration_minutes: 120 });
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);

  // Question selection
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);
  const [qLoading, setQLoading] = useState(false);
  const [qCourse, setQCourse] = useState('');
  const [qKeyword, setQKeyword] = useState('');

  const fetchCourses = async () => {
    const res = await fetch('/api/courses');
    const data = await res.json();
    setCourses(data.data || []);
  };

  const fetchPapers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: '10' });
    const res = await fetch(`/api/exam-papers?${params}`);
    const data = await res.json();
    setPapers(data.data || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [page]);

  useEffect(() => { fetchCourses(); }, []);
  useEffect(() => { fetchPapers(); }, [fetchPapers]);

  const openCreate = () => {
    setForm({ title: '', course_id: '', description: '', total_score: 100, duration_minutes: 120 });
    setSelectedQuestions([]);
    setCreateOpen(true);
  };

  const fetchAvailableQuestions = async () => {
    setQLoading(true);
    const params = new URLSearchParams({ page: '1', pageSize: '50' });
    if (qCourse || form.course_id) params.set('course_id', qCourse || form.course_id);
    if (qKeyword) params.set('keyword', qKeyword);
    const res = await fetch(`/api/questions?${params}`);
    const data = await res.json();
    setAvailableQuestions(data.data || []);
    setQLoading(false);
  };

  const openSelectQuestions = () => {
    setQCourse(form.course_id);
    setQKeyword('');
    setSelectOpen(true);
    fetchAvailableQuestions();
  };

  const toggleQuestion = (id: string) => {
    setSelectedQuestions((prev) =>
      prev.includes(id) ? prev.filter((qid) => qid !== id) : [...prev, id]
    );
  };

  const handleCreate = async () => {
    if (!form.title || !form.course_id) return;
    await fetch('/api/exam-papers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, question_ids: selectedQuestions }),
    });
    setCreateOpen(false);
    fetchPapers();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除该试卷吗？')) return;
    await fetch(`/api/exam-papers/${id}`, { method: 'DELETE' });
    fetchPapers();
  };

  const viewPaperDetail = async (id: string) => {
    const res = await fetch(`/api/exam-papers/${id}`);
    const data = await res.json();
    setViewPaper(data.data);
    setViewOpen(true);
  };

  const exportPaper = () => {
    if (!viewPaper) return;
    const difficultyMap: Record<number, string> = { 1: '简单', 2: '较易', 3: '中等', 4: '较难', 5: '困难' };

    let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${viewPaper.title}</title>
<style>
  body { font-family: 'Noto Sans SC', 'SimSun', serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #1a1a1a; line-height: 1.8; }
  h1 { text-align: center; font-size: 22px; margin-bottom: 8px; }
  .info { text-align: center; color: #666; font-size: 14px; margin-bottom: 30px; }
  .info span { margin: 0 15px; }
  .section { margin-bottom: 24px; }
  .section-title { font-size: 16px; font-weight: bold; border-bottom: 1px solid #ddd; padding-bottom: 6px; margin-bottom: 12px; }
  .question { margin-bottom: 16px; padding-left: 4px; }
  .q-header { font-weight: 500; margin-bottom: 4px; }
  .q-meta { font-size: 12px; color: #999; }
  .options { margin: 6px 0 6px 20px; }
  .option { margin: 2px 0; }
  @media print { body { padding: 20px; } }
</style></head><body>`;

    html += `<h1>${viewPaper.title}</h1>`;
    html += `<div class="info">`;
    html += `<span>课程: ${(viewPaper.courses as { name: string })?.name || '-'}</span>`;
    html += `<span>总分: ${viewPaper.total_score} 分</span>`;
    html += `<span>时长: ${viewPaper.duration_minutes} 分钟</span>`;
    html += `</div>`;

    // Group questions by type
    const grouped = new Map<string, typeof viewPaper.questions>();
    for (const pq of viewPaper.questions) {
      const typeName = pq.questions.question_types?.name || '其他';
      if (!grouped.has(typeName)) grouped.set(typeName, []);
      grouped.get(typeName)!.push(pq);
    }

    let globalIdx = 0;
    for (const [typeName, qs] of grouped) {
      html += `<div class="section"><div class="section-title">${typeName}（共 ${qs.length} 题）</div>`;
      for (const pq of qs) {
        globalIdx++;
        const q = pq.questions;
        html += `<div class="question">`;
        html += `<div class="q-header">${globalIdx}. ${q.content} <span style="color:#999;font-size:12px;">(${pq.score}分, ${difficultyMap[q.difficulty]})</span></div>`;
        if (q.options) {
          html += `<div class="options">`;
          for (const opt of q.options) {
            html += `<div class="option">${opt.label}. ${opt.text}</div>`;
          }
          html += `</div>`;
        }
        html += `</div>`;
      }
      html += `</div>`;
    }

    html += `</body></html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${viewPaper.title}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalPages = Math.ceil(total / 10);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">组卷管理</h1>
          <p className="text-sm text-muted-foreground mt-1">创建试卷并导出</p>
        </div>
        <Button onClick={openCreate} className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          新建试卷
        </Button>
      </div>

      <Card className="border-border shadow-sm">
        <CardContent className="p-6">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>试卷标题</TableHead>
                <TableHead>课程</TableHead>
                <TableHead>总分</TableHead>
                <TableHead>时长</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">加载中...</TableCell></TableRow>
              ) : papers.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">暂无数据</TableCell></TableRow>
              ) : (
                papers.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.title}</TableCell>
                    <TableCell className="text-muted-foreground">{(p.courses as { name: string })?.name || '-'}</TableCell>
                    <TableCell>{p.total_score} 分</TableCell>
                    <TableCell>{p.duration_minutes} 分钟</TableCell>
                    <TableCell>
                      <Badge variant={p.status === 'published' ? 'default' : 'secondary'}>
                        {p.status === 'published' ? '已发布' : '草稿'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{new Date(p.created_at).toLocaleDateString('zh-CN')}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => viewPaperDetail(p.id)}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(p.id)} className="text-destructive hover:text-destructive">
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
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}><ChevronRight className="h-4 w-4" /></Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Paper Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>新建试卷</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>试卷标题 *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="如: 2024年秋季期末考试" />
            </div>
            <div className="space-y-2">
              <Label>所属课程 *</Label>
              <Select value={form.course_id} onValueChange={(v) => setForm({ ...form, course_id: v })}>
                <SelectTrigger><SelectValue placeholder="选择课程" /></SelectTrigger>
                <SelectContent>
                  {courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.name} ({c.code})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>总分</Label>
                <Input type="number" value={form.total_score} onChange={(e) => setForm({ ...form, total_score: parseInt(e.target.value) || 100 })} />
              </div>
              <div className="space-y-2">
                <Label>考试时长(分钟)</Label>
                <Input type="number" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: parseInt(e.target.value) || 120 })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>描述</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="试卷说明..." rows={2} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>选择题目 ({selectedQuestions.length} 题已选)</Label>
                <Button variant="outline" size="sm" onClick={openSelectQuestions}>选题</Button>
              </div>
              {selectedQuestions.length > 0 && (
                <p className="text-xs text-muted-foreground">已选择 {selectedQuestions.length} 道题目</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>取消</Button>
            <Button onClick={handleCreate} className="bg-primary hover:bg-primary/90">创建试卷</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Select Questions Dialog */}
      <Dialog open={selectOpen} onOpenChange={setSelectOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>选择题目</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Input
                placeholder="搜索题目..."
                value={qKeyword}
                onChange={(e) => setQKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchAvailableQuestions()}
                className="flex-1"
              />
              <Button variant="outline" onClick={fetchAvailableQuestions}>搜索</Button>
            </div>
            <ScrollArea className="h-[400px] rounded-md border border-border">
              {qLoading ? (
                <div className="flex items-center justify-center h-32 text-muted-foreground">加载中...</div>
              ) : (
                <div className="space-y-2 p-4">
                  {availableQuestions.map((q) => (
                    <label key={q.id} className="flex items-start gap-3 p-3 rounded-md hover:bg-secondary cursor-pointer transition-colors">
                      <Checkbox
                        checked={selectedQuestions.includes(q.id)}
                        onCheckedChange={() => toggleQuestion(q.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{q.content}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">{q.question_types?.name}</Badge>
                          <span className="text-xs text-muted-foreground">{q.chapters?.name}</span>
                          <span className="text-xs text-muted-foreground">难度{difficultyLabels[q.difficulty]}</span>
                          <span className="text-xs text-muted-foreground">{q.score}分</span>
                        </div>
                      </div>
                    </label>
                  ))}
                  {availableQuestions.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm">暂无可选题目</div>
                  )}
                </div>
              )}
            </ScrollArea>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectOpen(false)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Paper Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{viewPaper?.title}</span>
              <Button variant="outline" size="sm" onClick={exportPaper}>
                <Download className="h-4 w-4 mr-2" />
                导出试卷
              </Button>
            </DialogTitle>
          </DialogHeader>
          {viewPaper && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>课程: {(viewPaper.courses as { name: string })?.name}</span>
                <span>总分: {viewPaper.total_score}</span>
                <span>时长: {viewPaper.duration_minutes} 分钟</span>
              </div>
              <div className="border-t border-border pt-4">
                {viewPaper.questions && viewPaper.questions.length > 0 ? (
                  <div className="space-y-4">
                    {viewPaper.questions.map((pq, idx) => {
                      const q = pq.questions;
                      return (
                        <div key={pq.id} className="p-4 rounded-md bg-secondary/30 border border-border/50">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium">
                                {idx + 1}. {q.content}
                              </p>
                              {q.options && (
                                <div className="mt-2 ml-4 space-y-1">
                                  {q.options.map((opt, oi) => (
                                    <p key={oi} className="text-sm text-muted-foreground">{opt.label}. {opt.text}</p>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0 ml-4">
                              <Badge variant="outline">{q.question_types?.name}</Badge>
                              <span className="text-xs text-muted-foreground">{pq.score}分</span>
                            </div>
                          </div>
                          <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                            <span>答案: {q.answer}</span>
                            {q.analysis && <span>解析: {q.analysis}</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm">该试卷暂无题目</div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
