
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Clock, DollarSign, CheckCircle, AlertTriangle, Plus, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface IssueRecord {
  id: string;
  issueType: string;
  issueDescription: string;
  diagnosisResult: any;
  actionsTaken: string[];
  repairCost?: number;
  repairStatus: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  severityLevel: 'minor' | 'medium' | 'critical';
  resolved: boolean;
  createdAt: string;
  updatedAt: string;
}

const IssueHistory = () => {
  const [issues, setIssues] = useState<IssueRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddingIssue, setIsAddingIssue] = useState(false);
  const [deviceId] = useState(() => `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  // Form state for new issue
  const [newIssue, setNewIssue] = useState({
    issueType: '',
    issueDescription: '',
    severityLevel: 'medium' as 'minor' | 'medium' | 'critical',
    repairCost: '',
    actionsTaken: ''
  });

  const loadIssueHistory = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('issue_history')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedIssues: IssueRecord[] = data?.map(item => ({
        id: item.id,
        issueType: item.issue_type,
        issueDescription: item.issue_description || '',
        diagnosisResult: item.diagnosis_result,
        actionsTaken: item.actions_taken || [],
        repairCost: item.repair_cost ? Number(item.repair_cost) : undefined,
        repairStatus: item.repair_status as any,
        severityLevel: item.severity_level as any,
        resolved: item.resolved || false,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      })) || [];

      setIssues(formattedIssues);
    } catch (error) {
      console.error('Error loading issue history:', error);
      toast.error('Failed to load issue history');
    } finally {
      setIsLoading(false);
    }
  };

  const addNewIssue = async () => {
    if (!newIssue.issueType || !newIssue.issueDescription) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      const actionsList = newIssue.actionsTaken
        .split('\n')
        .filter(action => action.trim() !== '')
        .map(action => action.trim());

      const { error } = await supabase.from('issue_history').insert({
        device_id: deviceId,
        issue_type: newIssue.issueType,
        issue_description: newIssue.issueDescription,
        severity_level: newIssue.severityLevel,
        repair_cost: newIssue.repairCost ? parseFloat(newIssue.repairCost) : null,
        actions_taken: actionsList,
        repair_status: 'pending',
        resolved: false
      });

      if (error) throw error;

      toast.success('Issue added successfully');
      setIsAddingIssue(false);
      setNewIssue({
        issueType: '',
        issueDescription: '',
        severityLevel: 'medium',
        repairCost: '',
        actionsTaken: ''
      });
      
      loadIssueHistory();
    } catch (error) {
      console.error('Error adding issue:', error);
      toast.error('Failed to add issue');
    }
  };

  const updateIssueStatus = async (issueId: string, status: string, resolved: boolean = false) => {
    try {
      const { error } = await supabase
        .from('issue_history')
        .update({ 
          repair_status: status,
          resolved,
          updated_at: new Date().toISOString()
        })
        .eq('id', issueId);

      if (error) throw error;

      toast.success('Issue status updated');
      loadIssueHistory();
    } catch (error) {
      console.error('Error updating issue status:', error);
      toast.error('Failed to update issue status');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'minor': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateTotalCost = () => {
    return issues.reduce((sum, issue) => sum + (issue.repairCost || 0), 0);
  };

  const getResolvedCount = () => {
    return issues.filter(issue => issue.resolved).length;
  };

  useEffect(() => {
    loadIssueHistory();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{issues.length}</p>
                <p className="text-sm text-gray-600">Total Issues</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{getResolvedCount()}</p>
                <p className="text-sm text-gray-600">Resolved</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">{issues.length - getResolvedCount()}</p>
                <p className="text-sm text-gray-600">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">${calculateTotalCost().toFixed(2)}</p>
                <p className="text-sm text-gray-600">Total Cost</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add New Issue Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Issue History</h2>
        <Dialog open={isAddingIssue} onOpenChange={setIsAddingIssue}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              Add New Issue
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Issue</DialogTitle>
              <DialogDescription>Record a new device issue or repair</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Issue Type *</label>
                <Input
                  value={newIssue.issueType}
                  onChange={(e) => setNewIssue({ ...newIssue, issueType: e.target.value })}
                  placeholder="e.g., Screen crack, Battery drain, Overheating"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Description *</label>
                <Textarea
                  value={newIssue.issueDescription}
                  onChange={(e) => setNewIssue({ ...newIssue, issueDescription: e.target.value })}
                  placeholder="Describe the issue in detail..."
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Severity Level</label>
                <Select value={newIssue.severityLevel} onValueChange={(value: any) => setNewIssue({ ...newIssue, severityLevel: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minor">Minor</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Repair Cost ($)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={newIssue.repairCost}
                  onChange={(e) => setNewIssue({ ...newIssue, repairCost: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Actions Taken</label>
                <Textarea
                  value={newIssue.actionsTaken}
                  onChange={(e) => setNewIssue({ ...newIssue, actionsTaken: e.target.value })}
                  placeholder="List actions taken (one per line)"
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={addNewIssue} className="flex-1">Add Issue</Button>
                <Button variant="outline" onClick={() => setIsAddingIssue(false)} className="flex-1">Cancel</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Issues List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Loading issue history...</p>
          </div>
        ) : issues.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">No issues recorded yet</p>
              <p className="text-sm text-gray-400">Add your first issue to start tracking</p>
            </CardContent>
          </Card>
        ) : (
          issues.map((issue) => (
            <Card key={issue.id} className="border-l-4 border-l-blue-500">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{issue.issueType}</CardTitle>
                    <CardDescription className="mt-1">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="h-4 w-4" />
                        {formatDate(issue.createdAt)}
                      </div>
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={getSeverityColor(issue.severityLevel)}>
                      {issue.severityLevel}
                    </Badge>
                    <Badge className={getStatusColor(issue.repairStatus)}>
                      {issue.repairStatus.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-gray-700">{issue.issueDescription}</p>
                  
                  {issue.actionsTaken.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Actions Taken:</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {issue.actionsTaken.map((action, index) => (
                          <li key={index} className="text-sm text-gray-600">{action}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-4">
                      {issue.repairCost && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span className="font-medium">${issue.repairCost.toFixed(2)}</span>
                        </div>
                      )}
                      {issue.resolved && (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm">Resolved</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      {!issue.resolved && issue.repairStatus !== 'completed' && (
                        <Button
                          size="sm"
                          onClick={() => updateIssueStatus(issue.id, 'completed', true)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Mark Resolved
                        </Button>
                      )}
                      {issue.repairStatus === 'pending' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateIssueStatus(issue.id, 'in_progress')}
                        >
                          Start Repair
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default IssueHistory;
