'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Note: Old tables have been removed and backed up to backup/old-tables/
// This demo now only shows the new Universal Table implementation

// New universal tables
import { UniversalDataTable } from '@/components/universal-data-table';
import { campaignTableConfig, adGroupsTableConfig, adsTableConfig } from '@/lib/table-configs';
import { Campaign, AdGroup, Ad } from '@/types';

interface TableComparisonDemoProps {
  adAccountId?: string;
}

export function TableComparisonDemo({ adAccountId }: TableComparisonDemoProps) {
  const [version, setVersion] = useState<'old' | 'new'>('new');

  const stats = {
    old: {
      components: 3,
      linesOfCode: 1200, // Approximate
      duplicatedLogic: '~80%',
      maintainability: 'Low',
    },
    new: {
      components: 1,
      linesOfCode: 400, // Universal + configs
      duplicatedLogic: '0%',
      maintainability: 'High',
    },
  };

  return (
    <div className="space-y-6">
      {/* Comparison Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            table architecture comparison
            <div className="flex gap-2">
              <Badge 
                variant={version === 'old' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setVersion('old')}
              >
                old (3 separate tables)
              </Badge>
              <Badge 
                variant={version === 'new' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setVersion('new')}
              >
                new (universal table)
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div className="space-y-1">
              <div className="font-medium text-muted-foreground">components</div>
              <div className="text-2xl font-bold">{stats[version].components}</div>
            </div>
            <div className="space-y-1">
              <div className="font-medium text-muted-foreground">lines of code</div>
              <div className="text-2xl font-bold">{stats[version].linesOfCode}</div>
            </div>
            <div className="space-y-1">
              <div className="font-medium text-muted-foreground">duplicated logic</div>
              <div className="text-2xl font-bold">{stats[version].duplicatedLogic}</div>
            </div>
            <div className="space-y-1">
              <div className="font-medium text-muted-foreground">maintainability</div>
              <div className={`text-2xl font-bold ${
                stats[version].maintainability === 'High' ? 'text-green-500' : 'text-red-500'
              }`}>
                {stats[version].maintainability}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table Demos */}
      <Tabs defaultValue="campaigns">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="campaigns">campaigns</TabsTrigger>
          <TabsTrigger value="ad-sets">ad_sets</TabsTrigger>
          <TabsTrigger value="ads">ads</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">campaigns table</h3>
            <Badge variant={version === 'new' ? 'default' : 'secondary'}>
              {version === 'new' ? 'universal table' : 'custom component'}
            </Badge>
          </div>
          
          {version === 'old' ? (
            <div className="p-8 text-center text-muted-foreground border border-dashed rounded-lg">
              <p>Old table components have been removed</p>
              <p className="text-xs mt-2">Backed up to: backup/old-tables/</p>
            </div>
          ) : (
            <UniversalDataTable<Campaign>
              adAccountId={adAccountId}
              config={campaignTableConfig}
            />
          )}
        </TabsContent>

        <TabsContent value="ad-sets" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">ad sets table</h3>
            <Badge variant={version === 'new' ? 'default' : 'secondary'}>
              {version === 'new' ? 'universal table' : 'custom component'}
            </Badge>
          </div>
          
          {version === 'old' ? (
            <div className="p-8 text-center text-muted-foreground border border-dashed rounded-lg">
              <p>Old table components have been removed</p>
              <p className="text-xs mt-2">Backed up to: backup/old-tables/</p>
            </div>
          ) : (
            <UniversalDataTable<AdGroup>
              adAccountId={adAccountId}
              config={adGroupsTableConfig}
            />
          )}
        </TabsContent>

        <TabsContent value="ads" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">ads table</h3>
            <Badge variant={version === 'new' ? 'default' : 'secondary'}>
              {version === 'new' ? 'universal table' : 'custom component'}
            </Badge>
          </div>
          
          {version === 'old' ? (
            <div className="p-8 text-center text-muted-foreground border border-dashed rounded-lg">
              <p>Old table components have been removed</p>
              <p className="text-xs mt-2">Backed up to: backup/old-tables/</p>
            </div>
          ) : (
            <UniversalDataTable<Ad>
              adAccountId={adAccountId}
              config={adsTableConfig}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Benefits */}
      <Card>
        <CardHeader>
          <CardTitle>universal table benefits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-medium text-green-600">✅ advantages</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Single source of truth for table logic</li>
                <li>• Consistent UI/UX across all tables</li>
                <li>• Easy to add new table types</li>
                <li>• Centralized bug fixes and improvements</li>
                <li>• Type-safe configuration</li>
                <li>• Reusable column renderers</li>
                <li>• Built-in features (search, pagination, etc.)</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-blue-600">🚀 features</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Generic type support</li>
                <li>• Configurable columns and actions</li>
                <li>• Built-in search and filtering</li>
                <li>• Date range filtering</li>
                <li>• Bulk actions</li>
                <li>• Column visibility toggle</li>
                <li>• Pagination</li>
                <li>• Loading and error states</li>
                <li>• Empty state customization</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}