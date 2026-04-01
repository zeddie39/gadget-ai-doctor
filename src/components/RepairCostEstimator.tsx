import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator, Wrench, Cpu, Clock, DollarSign, AlertTriangle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CostBreakdown {
  laborCost: { min: number; max: number };
  partsCost: { min: number; max: number };
  totalEstimate: { min: number; max: number };
  repairTime: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert';
  parts: { name: string; estimatedCost: number }[];
  recommendations: string[];
  currency: string;
}

const RepairCostEstimator: React.FC = () => {
  const [deviceType, setDeviceType] = useState('smartphone');
  const [issueDescription, setIssueDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [estimate, setEstimate] = useState<CostBreakdown | null>(null);

  const analyzeRepairCost = async () => {
    if (!issueDescription.trim()) {
      toast.error('Please describe the issue');
      return;
    }

    setIsAnalyzing(true);
    setEstimate(null);

    try {
      const { data, error } = await supabase.functions.invoke('openrouter-ai', {
        body: {
          prompt: `You are a repair cost estimator for electronics. Analyze this repair and return ONLY valid JSON (no markdown, no backticks).

Device: ${deviceType}
Issue: ${issueDescription}

Return JSON format:
{
  "laborCost": {"min": number, "max": number},
  "partsCost": {"min": number, "max": number},
  "totalEstimate": {"min": number, "max": number},
  "repairTime": "string (e.g. '1-2 hours')",
  "difficulty": "Easy|Medium|Hard|Expert",
  "parts": [{"name": "string", "estimatedCost": number}],
  "recommendations": ["string"],
  "currency": "KES"
}

Use Kenyan Shilling (KES) pricing based on local market rates.`,
          systemPrompt: 'You are a professional electronics repair cost estimator. Return only valid JSON.',
        },
      });

      if (error || data?.error) throw new Error(data?.error || 'Analysis failed');

      const responseText = data.response.trim();
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Invalid AI response format');

      const parsed: CostBreakdown = JSON.parse(jsonMatch[0]);
      setEstimate(parsed);
    } catch (err: any) {
      console.error('Cost estimation error:', err);
      toast.error('Failed to estimate repair cost. Try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const difficultyColor: Record<string, string> = {
    Easy: 'text-emerald-500 bg-emerald-500/10',
    Medium: 'text-amber-500 bg-amber-500/10',
    Hard: 'text-orange-500 bg-orange-500/10',
    Expert: 'text-red-500 bg-red-500/10',
  };

  return (
    <div className="space-y-6">
      <Card className="smart-glass border-none rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl font-bold">
            <div className="p-2 rounded-xl bg-primary/20">
              <Calculator className="h-5 w-5 text-primary" />
            </div>
            AI Repair Cost Estimator
          </CardTitle>
          <CardDescription>Get instant repair cost estimates powered by AI</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Device Type</label>
            <Select value={deviceType} onValueChange={setDeviceType}>
              <SelectTrigger className="bg-muted border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="smartphone">Smartphone</SelectItem>
                <SelectItem value="laptop">Laptop</SelectItem>
                <SelectItem value="tablet">Tablet</SelectItem>
                <SelectItem value="desktop">Desktop PC</SelectItem>
                <SelectItem value="tv">TV / Monitor</SelectItem>
                <SelectItem value="console">Gaming Console</SelectItem>
                <SelectItem value="other">Other Electronics</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Describe the Issue</label>
            <Textarea
              placeholder="e.g. Cracked screen on iPhone 14, phone still works but touch is unresponsive in the top-left corner..."
              value={issueDescription}
              onChange={(e) => setIssueDescription(e.target.value)}
              className="min-h-[100px] bg-muted border-border"
            />
          </div>

          <Button
            onClick={analyzeRepairCost}
            disabled={isAnalyzing || !issueDescription.trim()}
            className="w-full"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Calculator className="h-4 w-4 mr-2" />
                Estimate Repair Cost
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {estimate && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Summary */}
          <Card className="smart-glass border-none rounded-2xl">
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 rounded-xl bg-muted">
                  <DollarSign className="h-5 w-5 text-primary mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground mb-1">Total Estimate</p>
                  <p className="text-lg font-bold text-primary">
                    {estimate.currency} {estimate.totalEstimate.min.toLocaleString()} - {estimate.totalEstimate.max.toLocaleString()}
                  </p>
                </div>
                <div className="text-center p-3 rounded-xl bg-muted">
                  <Wrench className="h-5 w-5 text-blue-500 mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground mb-1">Labor</p>
                  <p className="text-lg font-bold">
                    {estimate.currency} {estimate.laborCost.min.toLocaleString()} - {estimate.laborCost.max.toLocaleString()}
                  </p>
                </div>
                <div className="text-center p-3 rounded-xl bg-muted">
                  <Clock className="h-5 w-5 text-amber-500 mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground mb-1">Time</p>
                  <p className="text-lg font-bold">{estimate.repairTime}</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-muted">
                  <AlertTriangle className={`h-5 w-5 mx-auto mb-1 ${difficultyColor[estimate.difficulty]?.split(' ')[0]}`} />
                  <p className="text-xs text-muted-foreground mb-1">Difficulty</p>
                  <span className={`text-sm font-bold px-2 py-0.5 rounded-full ${difficultyColor[estimate.difficulty]}`}>
                    {estimate.difficulty}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Parts Breakdown */}
          {estimate.parts.length > 0 && (
            <Card className="smart-glass border-none rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-primary" /> Parts Required
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {estimate.parts.map((part, i) => (
                    <div key={i} className="flex justify-between items-center p-3 rounded-lg bg-muted">
                      <span className="text-sm font-medium">{part.name}</span>
                      <span className="text-sm font-bold text-primary">{estimate.currency} {part.estimatedCost.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {estimate.recommendations.length > 0 && (
            <Card className="smart-glass border-none rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">💡 Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {estimate.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="text-primary mt-0.5">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default RepairCostEstimator;
