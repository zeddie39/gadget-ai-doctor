import CustomVisionTrainer from '@/components/CustomVisionTrainer';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CustomVisionTrainerPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-white/10 p-4 shrink-0 flex items-center">
        <Button onClick={() => navigate(-1)} variant="ghost" className="gap-2 shrink-0">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
      </header>
      <main className="flex-1 py-8 px-4 md:px-8">
        <CustomVisionTrainer />
      </main>
    </div>
  );
}
