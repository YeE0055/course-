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
import { Plus, Search, Pencil, Trash2, ChevronLeft, ChevronRight, Eye } from 'lucide-react';

interface Question {
  id: string;
  course_id: string;
  chapter_id: string;
  question_type_id: string;
  content: string;
  options: Array<{ label: string; text: string }> | null;
  answer: string;
  analysis: string | null;
  difficulty: number;
  score: number;
  tags: string[] | null;
  status: string;
  created_at: string;
  courses?: { name: string };
  chapters?: { name: string };
  question_types?: { name: string; code: string };
}

interface Course { id: string; name: string; code: string }
interface Chapter { id: string; name: string; course_id: string }
interface QuestionType { id: string; name: string; code: string; has_options: string }

const difficultyLabels: Record<number, string> = { 1: '简单', 2: '较易', 3: '中等', 4: '较难', 5: '困难' };
const difficultyColors: Record<number, string> = {
  1: 'bg-green-100 text-green-700',
  2: 'bg-blue-100 text-blue-700',
  3: 'bg-yellow-100 text-yellow-700',
  4: 'bg-orange-100 text-orange-700',
  5: 'bg-red-100 text-red-700',
};

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [questionTypes, setQuestionTypes] = useState<QuestionType[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filterCourse, setFilterCourse] = useState('');
  const [filterChapter, setFilterChapter] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewQuestion, setViewQuestion] = useState<Question | null>(null);
  const [editing, setEditing] = useState<Question | null>(null);
  const [form, setForm] = useState({
    course_id: '', chapter_id: '', question_type_id: '', content: '',
    options: [{ label: 'A', text: '' }, { label: 'B', text: '' }, { label: 'C', text: '' }, { label: 'D', text: '' }],
    answer: '', analysis: '', difficulty: 3, score: 5, hasOptions: false,
  });

  const fetchMeta = async () => {
    const [cRes, chRes, qtRes] = await Promise.all([
      fetch('/api/courses'),
      fetch('/api/chapters'),
      fetch('/api/question-types'),
    ]);
    const [cData, chData, qtData] = await Promise.all([cRes.json(), chRes.json(), qtRes.json()]);
    setCourses(cData.data || []);
    setChapters(chData.data || []);
    setQuestionTypes(qtData.data || []);
  };

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: '10' });
    if (filterCourse) params.set('course_id', filterCourse);
    if (filterChapter) params.set('chapter_id', filterChapter);
    if (filterType) params.set('question_type_id', filterType);
    if (filterDifficulty) params.set('difficulty', filterDifficulty);
    if (keyword) params.set('keyword', keyword);
    const res = await fetch(`/api/questions?${params}`);
    const data = await res.json();
    setQuestions(data.data || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [page, filterCourse, filterChapter, filterType, filterDifficulty, keyword]);

  useEffect(() => { fetchMeta(); }, []);
  useEffect(() => { fetchQuestions(); }, [fetchQuestions]);

  const filteredChapters = chapters.filter((ch) => !filterCourse || ch.course_id === filterCourse);

  const handleTypeChange = (typeId: string) => {
    const qt = questionTypes.find((t) => t.id === typeId);
    setForm({ ...form, question_type_id: typeId, hasOptions: qt?.has_options === 'true' });
  };

  const openCreate = () => {
    setEditing(null);
    setForm({
      course_id: '', chapter_id: '', question_type_id: '', content: '',
      options: [{ label: 'A', text: '' }, { label: 'B', text: '' }, { label: 'C', text: '' }, { label: 'D', text: '' }],
      answer: '', analysis: '', difficulty: 3, score: 5, hasOptions: false,
    });
    setDialogOpen(true);
  };

  const openEdit = (q: Question) => {
    setEditing(q);
    const qt = questionTypes.find((t) => t.id === q.question_type_id);
    setForm({
      course_id: q.course_id,
      chapter_id: q.chapter_id,
      question_type_id: q.question_type_id,
      content: q.content,
      options: q.options || [{ label: 'A', text: '' }, { label: 'B', text: '' }, { label: 'C', text: '' }, { label: 'D', text: '' }],
      answer: q.answer,
      analysis: q.analysis || '',
      difficulty: q.difficulty,
      score: q.score,
      hasOptions: qt?.has_options === 'true',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.course_id || !form.chapter_id || !form.question_type_id || !form.content || !form.answer) return;
    const payload = {
      course_id: form.course_id,
      chapter_id: form.chapter_id,
      question_type_id: form.question_type_id,
      content: form.content,
      options: form.hasOptions ? form.options : null,
      answer: form.answer,
      analysis: form.analysis,
      difficulty: form.difficulty,
      score: form.score,
    };
    if (editing) {
      await fetch('/api/questions/[id]', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editing.id, ...payload }),
      });
    } else {
      await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }
    setDialogOpen(false);
    fetchQuestions();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除该题目吗？')) return;
    await fetch(`/api/questions/${id}`, { method: 'DELETE' });
    fetchQuestions();
  };

  const totalPages = Math.ceil(total / 10);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">题库管理</h1>
          <p className="text-sm text-muted-foreground mt-1">管理所有考试题目</p>
        </div>
        <Button onClick={openCreate} className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          新增题目
        </Button>
      </div>

      <Card className="border-border shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索题目内容..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchQuestions()}
                className="pl-9"
              />
            </div>
            <Select value={filterCourse} onValueChange={(v) => { setFilterCourse(v === 'all' ? '' : v); setPage(1); }}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="课程" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部课程</SelectItem>
                {courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterChapter} onValueChange={(v) => { setFilterChapter(v === 'all' ? '' : v); setPage(1); }}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="章节" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部章节</SelectItem>
                {filteredChapters.map((ch) => <SelectItem key={ch.id} value={ch.id}>{ch.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={(v) => { setFilterType(v === 'all' ? '' : v); setPage(1); }}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="题型" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部题型</SelectItem>
                {questionTypes.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterDifficulty} onValueChange={(v) => { setFilterDifficulty(v === 'all' ? '' : v); setPage(1); }}>
              <SelectTrigger className="w-[120px]"><SelectValue placeholder="难度" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部难度</SelectItem>
                {[1, 2, 3, 4, 5].map((d) => <SelectItem key={d} value={String(d)}>{difficultyLabels[d]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>题目内容</TableHead>
                <TableHead>课程</TableHead>
                <TableHead>章节</TableHead>
                <TableHead>题型</TableHead>
                <TableHead>难度</TableHead>
                <TableHead>分值</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">加载中...</TableCell></TableRow>
              ) : questions.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">暂无数据</TableCell></TableRow>
              ) : (
                questions.map((q) => (
                  <TableRow key={q.id}>
                    <TableCell className="max-w-[250px] truncate font-medium">{q.content}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{(q.courses as { name: string })?.name || '-'}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{(q.chapters as { name: string })?.name || '-'}</TableCell>
                    <TableCell><Badge variant="outline">{(q.question_types as { name: string })?.name || '-'}</Badge></TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${difficultyColors[q.difficulty] || ''}`}>
                        {difficultyLabels[q.difficulty]}
                      </span>
                    </TableCell>
                    <TableCell>{q.score}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => { setViewQuestion(q); setViewOpen(true); }}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openEdit(q)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(q.id)} className="text-destructive hover:text-destructive">
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? '编辑题目' : '新增题目'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>课程 *</Label>
                <Select value={form.course_id} onValueChange={(v) => setForm({ ...form, course_id: v, chapter_id: '' })}>
                  <SelectTrigger><SelectValue placeholder="选择课程" /></SelectTrigger>
                  <SelectContent>
                    {courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>章节 *</Label>
                <Select value={form.chapter_id} onValueChange={(v) => setForm({ ...form, chapter_id: v })}>
                  <SelectTrigger><SelectValue placeholder="选择章节" /></SelectTrigger>
                  <SelectContent>
                    {filteredChapters.map((ch) => <SelectItem key={ch.id} value={ch.id}>{ch.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>题型 *</Label>
                <Select value={form.question_type_id} onValueChange={handleTypeChange}>
                  <SelectTrigger><SelectValue placeholder="选择题型" /></SelectTrigger>
                  <SelectContent>
                    {questionTypes.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label>难度</Label>
                  <Select value={String(form.difficulty)} onValueChange={(v) => setForm({ ...form, difficulty: parseInt(v) })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((d) => <SelectItem key={d} value={String(d)}>{difficultyLabels[d]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>分值</Label>
                  <Input type="number" value={form.score} onChange={(e) => setForm({ ...form, score: parseInt(e.target.value) || 5 })} />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>题目内容 *</Label>
              <Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="请输入题目内容..." rows={3} />
            </div>
            {form.hasOptions && (
              <div className="space-y-2">
                <Label>选项</Label>
                {form.options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-6 text-sm font-medium text-muted-foreground">{opt.label}</span>
                    <Input
                      value={opt.text}
                      onChange={(e) => {
                        const newOpts = [...form.options];
                        newOpts[idx] = { ...newOpts[idx], text: e.target.value };
                        setForm({ ...form, options: newOpts });
                      }}
                      placeholder={`选项 ${opt.label}`}
                    />
                  </div>
                ))}
              </div>
            )}
            <div className="space-y-2">
              <Label>正确答案 *</Label>
              <Input value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} placeholder={form.hasOptions ? '如: A' : '输入答案'} />
            </div>
            <div className="space-y-2">
              <Label>解析</Label>
              <Textarea value={form.analysis} onChange={(e) => setForm({ ...form, analysis: e.target.value })} placeholder="题目解析..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>题目详情</DialogTitle>
          </DialogHeader>
          {viewQuestion && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline">{(viewQuestion.question_types as { name: string })?.name}</Badge>
                <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${difficultyColors[viewQuestion.difficulty] || ''}`}>
                  {difficultyLabels[viewQuestion.difficulty]}
                </span>
                <Badge variant="secondary">{viewQuestion.score} 分</Badge>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">题目内容</Label>
                <p className="mt-1 text-sm">{viewQuestion.content}</p>
              </div>
              {viewQuestion.options && (
                <div>
                  <Label className="text-xs text-muted-foreground">选项</Label>
                  <div className="mt-1 space-y-1">
                    {viewQuestion.options.map((opt, idx) => (
                      <p key={idx} className="text-sm">{opt.label}. {opt.text}</p>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <Label className="text-xs text-muted-foreground">答案</Label>
                <p className="mt-1 text-sm font-medium text-primary">{viewQuestion.answer}</p>
              </div>
              {viewQuestion.analysis && (
                <div>
                  <Label className="text-xs text-muted-foreground">解析</Label>
                  <p className="mt-1 text-sm text-muted-foreground">{viewQuestion.analysis}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
