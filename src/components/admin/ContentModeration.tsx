import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, ThumbsUp, ThumbsDown, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';

interface Feedback {
  id: string;
  diagnosis_id: string;
  feature_used: string;
  feedback_type: string;
  helpful: boolean;
  user_comments: string | null;
  created_at: string;
  ai_response_data: any;
}

export default function ContentModeration() {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from('ai_feedback')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setFeedback(data || []);
    } catch (error) {
      console.error('Fetch feedback error:', error);
      toast({
        title: 'Fetch Failed',
        description: 'Unable to load feedback data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteFeedback = async (id: string) => {
    if (!confirm('Are you sure you want to delete this feedback?')) return;

    try {
      const { error } = await supabase
        .from('ai_feedback')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Feedback Deleted',
        description: 'Feedback entry removed successfully',
      });

      fetchFeedback();
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: 'Delete Failed',
        description: 'Unable to delete feedback',
        variant: 'destructive',
      });
    }
  };

  const filteredFeedback = feedback.filter(item => {
    if (selectedTab === 'all') return true;
    if (selectedTab === 'positive') return item.helpful === true;
    if (selectedTab === 'negative') return item.helpful === false;
    return true;
  });

  const positiveFeedback = feedback.filter(f => f.helpful).length;
  const negativeFeedback = feedback.filter(f => !f.helpful).length;
  const feedbackWithComments = feedback.filter(f => f.user_comments).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-6 h-6" />
          Content Moderation
        </CardTitle>
        <CardDescription>
          Review AI feedback, user comments, and moderate platform content
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <p className="text-2xl font-bold">{feedback.length}</p>
                <p className="text-sm text-muted-foreground">Total Feedback</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <ThumbsUp className="w-8 h-8 mx-auto mb-2 text-green-600" />
                <p className="text-2xl font-bold">{positiveFeedback}</p>
                <p className="text-sm text-muted-foreground">Positive Reviews</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <ThumbsDown className="w-8 h-8 mx-auto mb-2 text-red-600" />
                <p className="text-2xl font-bold">{negativeFeedback}</p>
                <p className="text-sm text-muted-foreground">Negative Reviews</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feedback Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">
              All ({feedback.length})
            </TabsTrigger>
            <TabsTrigger value="positive">
              Positive ({positiveFeedback})
            </TabsTrigger>
            <TabsTrigger value="negative">
              Negative ({negativeFeedback})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={selectedTab} className="space-y-4 mt-6">
            {isLoading ? (
              <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredFeedback.length === 0 ? (
              <div className="text-center p-12">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No feedback found</p>
              </div>
            ) : (
              filteredFeedback.map((item) => (
                <Card key={item.id}>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline">{item.feature_used}</Badge>
                            <Badge variant="outline">{item.feedback_type}</Badge>
                            {item.helpful ? (
                              <Badge className="bg-green-600">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Helpful
                              </Badge>
                            ) : (
                              <Badge variant="destructive">
                                <XCircle className="w-3 h-3 mr-1" />
                                Not Helpful
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(item.created_at), 'MMM dd, yyyy HH:mm')}
                          </p>
                        </div>

                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteFeedback(item.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>

                      {item.user_comments && (
                        <div className="p-4 rounded-lg bg-muted">
                          <p className="text-sm font-medium mb-2">User Comments:</p>
                          <p className="text-sm text-muted-foreground">
                            {item.user_comments}
                          </p>
                        </div>
                      )}

                      {item.ai_response_data && (
                        <div className="p-4 rounded-lg border">
                          <p className="text-sm font-medium mb-2">AI Response Data:</p>
                          <pre className="text-xs text-muted-foreground overflow-x-auto">
                            {JSON.stringify(item.ai_response_data, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
