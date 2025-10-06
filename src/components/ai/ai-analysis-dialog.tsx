'use client';

import { Sparkles, Copy, Download, TrendingUp, AlertCircle, Lightbulb, Target } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { AIAnalysisResult } from '@/types';

interface AIAnalysisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: AIAnalysisResult | null;
  campaignName: string;
  isLoading?: boolean;
}

export function AIAnalysisDialog({
  open,
  onOpenChange,
  result,
  campaignName,
  isLoading = false,
}: AIAnalysisDialogProps) {
  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.rawInsights);
    toast.success('Copied to clipboard!');
  };

  const handleDownload = () => {
    if (!result) return;
    const blob = new Blob([result.rawInsights], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-analysis-${campaignName.replace(/[^a-z0-9]/gi, '-')}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Downloaded!');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI Analysis: {campaignName}
          </DialogTitle>
          {result && (
            <DialogDescription>
              Generated at {new Date(result.timestamp).toLocaleString()} • Model: {result.model}
            </DialogDescription>
          )}
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-4">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground">
                Analyzing campaign performance...
              </p>
            </div>
          </div>
        )}

        {result && !isLoading && (
          <div className="space-y-4 mt-4">
            {/* Summary */}
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Performance Summary
              </h3>
              <p className="text-sm leading-relaxed">{result.summary}</p>
            </div>

            {/* Key Findings */}
            {result.findings.length > 0 && (
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-500" />
                  Key Findings
                </h3>
                <ul className="space-y-2">
                  {result.findings.map((finding, index) => (
                    <li key={index} className="text-sm flex gap-2">
                      <span className="text-muted-foreground mt-0.5">•</span>
                      <span className="flex-1">{finding}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {result.recommendations.length > 0 && (
              <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  Actionable Recommendations
                </h3>
                <ul className="space-y-3">
                  {result.recommendations.map((rec, index) => (
                    <li key={index} className="text-sm flex gap-2">
                      <span className="font-semibold text-blue-600 dark:text-blue-400 mt-0.5">
                        {index + 1}.
                      </span>
                      <span className="flex-1">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Expected Impact */}
            {result.expectedImpact && (
              <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
                <h3 className="font-semibold mb-2 flex items-center gap-2 text-green-700 dark:text-green-400">
                  <Target className="h-4 w-4" />
                  Expected Impact
                </h3>
                <p className="text-sm leading-relaxed">{result.expectedImpact}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t">
              <Button onClick={handleCopy} variant="outline" size="sm">
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
              <Button onClick={handleDownload} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <div className="flex-1" />
              <Button onClick={() => onOpenChange(false)} variant="default" size="sm">
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
