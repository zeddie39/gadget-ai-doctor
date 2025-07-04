
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ThumbsUp, ThumbsDown, MessageSquare, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AIFeedbackProps {
  diagnosisId: string;
  feature: string;
  aiResponse: any;
  onFeedbackSubmitted?: () => void;
}

const AIFeedback: React.FC<AIFeedbackProps> = ({ 
  diagnosisId, 
  feature, 
  aiResponse, 
  onFeedbackSubmitted 
}) => {
  const [feedback, setFeedback] = useState<'positive' | 'negative' | null>(null);
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const submitFeedback = async () => {
    if (!feedback) return;
    
    setIsSubmitting(true);
    try {
      await supabase.from('ai_feedback').insert({
        diagnosis_id: diagnosisId,
        feature_used: feature,
        feedback_type: feedback,
        user_comments: comments,
        ai_response_data: aiResponse,
        helpful: feedback === 'positive',
        created_at: new Date().toISOString()
      });

      toast.success('Thank you for your feedback! This helps improve our AI.');
      onFeedbackSubmitted?.();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFeedbackClick = (type: 'positive' | 'negative') => {
    setFeedback(type);
    if (type === 'negative') {
      setShowComments(true);
    } else {
      setShowComments(false);
      setComments('');
    }
  };

  return (
    <Card className="mt-4 border-blue-200 bg-blue-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-blue-900">
          How was this AI diagnosis?
        </CardTitle>
        <CardDescription className="text-xs text-blue-700">
          Your feedback helps train our AI to be more accurate
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={feedback === 'positive' ? 'default' : 'outline'}
            onClick={() => handleFeedbackClick('positive')}
            className="flex-1"
          >
            <ThumbsUp className="h-4 w-4 mr-1" />
            Helpful
          </Button>
          <Button
            size="sm"
            variant={feedback === 'negative' ? 'destructive' : 'outline'}
            onClick={() => handleFeedbackClick('negative')}
            className="flex-1"
          >
            <ThumbsDown className="h-4 w-4 mr-1" />
            Not Helpful
          </Button>
        </div>

        {(showComments || feedback === 'positive') && (
          <div className="space-y-2">
            <Textarea
              placeholder={
                feedback === 'positive' 
                  ? "What did you find most helpful? (optional)"
                  : "How can we improve this diagnosis?"
              }
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="min-h-[60px] text-sm"
            />
            <Button
              onClick={submitFeedback}
              disabled={!feedback || isSubmitting}
              size="sm"
              className="w-full"
            >
              <Send className="h-4 w-4 mr-1" />
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </div>
        )}

        {feedback === 'positive' && !showComments && (
          <Button
            onClick={submitFeedback}
            disabled={isSubmitting}
            size="sm"
            className="w-full"
          >
            <Send className="h-4 w-4 mr-1" />
            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default AIFeedback;
