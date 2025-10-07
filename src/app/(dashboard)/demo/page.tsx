'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Plus, Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/shared/formatters';

export default function DemoPage() {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('overview');

    // Fetch all data
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['demo-data'],
        queryFn: async () => {
            const res = await fetch('/api/demo/data');
            if (!res.ok) throw new Error('Failed to fetch data');
            return res.json();
        },
    });

    // Create test data
    const createTestData = useMutation({
        mutationFn: async () => {
            const res = await fetch('/api/demo/seed', { method: 'POST' });
            if (!res.ok) throw new Error('Failed to create test data');
            return res.json();
        },
        onSuccess: () => {
            toast.success('Đã tạo dữ liệu test thành công!');
            queryClient.invalidateQueries({ queryKey: ['demo-data'] });
        },
        onError: () => {
            toast.error('Lỗi khi tạo dữ liệu test');
        },
    });

    // Clear all data
    const clearData = useMutation({
        mutationFn: async () => {
            const res = await fetch('/api/demo/clear', { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to clear data');
            return res.json();
        },
        onSuccess: () => {
            toast.success('Đã xóa tất cả dữ liệu!');
            queryClient.invalidateQueries({ queryKey: ['demo-data'] });
        },
        onError: () => {
            toast.error('Lỗi khi xóa dữ liệu');
        },
    });

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Demo & Test Data</h1>
                    <p className="text-muted-foreground">Quản lý và test dữ liệu trong database</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Refresh
                    </Button>
                    <Button
                        variant="default"
                        onClick={() => createTestData.mutate()}
                        disabled={createTestData.isPending}
                    >
                        {createTestData.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Plus className="mr-2 h-4 w-4" />
                        )}
                        Tạo dữ liệu test
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={() => {
                            if (confirm('Bạn có chắc muốn xóa TẤT CẢ dữ liệu?')) {
                                clearData.mutate();
                            }
                        }}
                        disabled={clearData.isPending}
                    >
                        {clearData.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Trash2 className="mr-2 h-4 w-4" />
                        )}
                        Xóa tất cả
                    </Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="overview">Tổng quan</TabsTrigger>
                    <TabsTrigger value="users">Users</TabsTrigger>
                    <TabsTrigger value="accounts">Ad Accounts</TabsTrigger>
                    <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
                    <TabsTrigger value="adgroups">Ad Groups</TabsTrigger>
                    <TabsTrigger value="creatives">Creatives</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                        <StatCard title="Users" count={data?.users?.length || 0} />
                        <StatCard title="Ad Accounts" count={data?.adAccounts?.length || 0} />
                        <StatCard title="Campaigns" count={data?.campaigns?.length || 0} />
                        <StatCard title="Ad Groups" count={data?.adGroups?.length || 0} />
                        <StatCard title="Creatives" count={data?.creatives?.length || 0} />
                    </div>
                </TabsContent>

                <TabsContent value="users">
                    <DataTable title="Users" data={data?.users || []} />
                </TabsContent>

                <TabsContent value="accounts">
                    <DataTable title="Ad Accounts" data={data?.adAccounts || []} />
                </TabsContent>

                <TabsContent value="campaigns">
                    <DataTable title="Campaigns" data={data?.campaigns || []} />
                </TabsContent>

                <TabsContent value="adgroups">
                    <DataTable title="Ad Groups" data={data?.adGroups || []} />
                </TabsContent>

                <TabsContent value="creatives">
                    <DataTable title="Creatives" data={data?.creatives || []} />
                </TabsContent>
            </Tabs>
        </div>
    );
}

function StatCard({ title, count }: { title: string; count: number }) {
    return (
        <Card>
            <CardHeader className="pb-2">
                <CardDescription>{title}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{count}</div>
            </CardContent>
        </Card>
    );
}

function DataTable({ title, data }: { title: string; data: any[] }) {
    if (!data || data.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>{title}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Không có dữ liệu</p>
                </CardContent>
            </Card>
        );
    }

    // Format currency fields
    const formatData = (item: any) => {
        const formatted = { ...item };

        // Format budget and spent fields
        if (formatted.budget !== undefined) {
            formatted.budget = `${formatCurrency(formatted.budget)} (${formatted.budget} cents)`;
        }
        if (formatted.spent !== undefined) {
            formatted.spent = `${formatCurrency(formatted.spent)} (${formatted.spent} cents)`;
        }
        if (formatted.spend !== undefined) {
            formatted.spend = `${formatCurrency(formatted.spend)} (${formatted.spend} cents)`;
        }
        if (formatted.costPerConversion !== undefined) {
            formatted.costPerConversion = `${formatCurrency(formatted.costPerConversion)} (${formatted.costPerConversion} cents)`;
        }
        if (formatted.cpc !== undefined) {
            formatted.cpc = `${formatCurrency(formatted.cpc)} (${formatted.cpc} cents)`;
        }

        return formatted;
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>Tổng cộng: {data.length} records</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {data.map((item, index) => (
                        <div key={item.id || index} className="rounded-lg border p-4">
                            <pre className="text-xs overflow-auto">{JSON.stringify(formatData(item), null, 2)}</pre>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
