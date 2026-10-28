'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, BookOpen, Database, FileText, TrendingUp } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

interface DashboardData {
  overview: { courses: number; chapters: number; questions: number; papers: number };
  questionsByCourse: { name: string; count: number }[];
  questionsByType: { name: string; count: number }[];
  difficultyDistribution: { level: string; count: number }[];
  recentQuestions: { id: string; content: string; difficulty: number; created_at: string; courses: { name: string } }[];
}

const COLORS = ['#1A5632', '#B8860B', '#2563EB', '#7C3AED', '#DC2626', '#059669', '#D97706'];

const difficultyLabels: Record<number, string> = {
  1: '简单',
  2: '较易',
  3: '中等',
  4: '较难',
  5: '困难',
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then((res) => res.json())
      .then((res) => {
        setData(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-destructive">加载失败</div>
      </div>
    );
  }

  const stats = [
    { label: '课程总数', value: data.overview.courses, icon: BookOpen, color: 'text-[#1A5632]' },
    { label: '章节总数', value: data.overview.chapters, icon: TrendingUp, color: 'text-[#B8860B]' },
    { label: '题目总数', value: data.overview.questions, icon: Database, color: 'text-[#2563EB]' },
    { label: '试卷总数', value: data.overview.papers, icon: FileText, color: 'text-[#7C3AED]' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">数据总览</h1>
        <p className="text-sm text-muted-foreground mt-1">考试题库系统数据概览</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-border shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold mt-1 tabular-nums" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {stat.value}
                  </p>
                </div>
                <div className={`rounded-lg bg-secondary p-3 ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Questions by Course */}
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              各课程题目数量
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.questionsByCourse.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.questionsByCourse}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8E5E0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #E8E5E0',
                      borderRadius: '6px',
                      fontSize: '13px',
                    }}
                  />
                  <Bar dataKey="count" fill="#1A5632" radius={[4, 4, 0, 0]} name="题目数" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">
                暂无数据
              </div>
            )}
          </CardContent>
        </Card>

        {/* Questions by Type */}
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-[#B8860B]" />
              题型分布
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.questionsByType.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={data.questionsByType}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="count"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={{ stroke: '#6B6B6B' }}
                  >
                    {data.questionsByType.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">
                暂无数据
              </div>
            )}
          </CardContent>
        </Card>

        {/* Difficulty Distribution */}
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#2563EB]" />
              难度分布
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.difficultyDistribution.some((d) => d.count > 0) ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.difficultyDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8E5E0" />
                  <XAxis dataKey="level" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #E8E5E0',
                      borderRadius: '6px',
                      fontSize: '13px',
                    }}
                  />
                  <Bar dataKey="count" fill="#B8860B" radius={[4, 4, 0, 0]} name="题目数" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">
                暂无数据
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Questions */}
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Database className="h-4 w-4 text-[#7C3AED]" />
              最近添加的题目
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentQuestions.length > 0 ? (
              <div className="space-y-3 max-h-[280px] overflow-y-auto">
                {data.recentQuestions.map((q) => (
                  <div key={q.id} className="flex items-start gap-3 p-3 rounded-md bg-secondary/50">
                    <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary shrink-0">
                      {difficultyLabels[q.difficulty] || `难度${q.difficulty}`}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{q.content}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {q.courses?.name} · {new Date(q.created_at).toLocaleDateString('zh-CN')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">
                暂无数据
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
