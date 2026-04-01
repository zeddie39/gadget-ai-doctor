import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, MapPin, Shield, Clock } from 'lucide-react';

export interface Technician {
  id: string;
  name: string;
  avatar_url?: string;
  specialization: string;
  location: string;
  rating: number;
  reviews_count: number;
  hourly_rate: number;
  currency: string;
  is_verified: boolean;
  is_available: boolean;
  experience_years: number;
  skills: string[];
}

interface TechnicianCardProps {
  technician: Technician;
  onBook: (tech: Technician) => void;
  onViewProfile: (tech: Technician) => void;
}

const TechnicianCard: React.FC<TechnicianCardProps> = ({ technician, onBook, onViewProfile }) => {
  return (
    <Card className="smart-glass border-none rounded-2xl overflow-hidden hover:shadow-xl transition-all group">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center text-xl font-bold text-primary shrink-0">
            {technician.avatar_url ? (
              <img src={technician.avatar_url} alt={technician.name} className="w-full h-full object-cover rounded-xl" />
            ) : (
              technician.name.charAt(0)
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-foreground truncate">{technician.name}</h3>
              {technician.is_verified && (
                <Shield className="h-4 w-4 text-primary shrink-0" />
              )}
            </div>
            <p className="text-sm text-muted-foreground">{technician.specialization}</p>
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                {technician.rating.toFixed(1)} ({technician.reviews_count})
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {technician.location}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {technician.experience_years}yr exp
              </span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-lg font-bold text-primary">{technician.currency} {technician.hourly_rate}</p>
            <p className="text-[10px] text-muted-foreground uppercase">/hour</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mt-3">
          {technician.skills.slice(0, 4).map(skill => (
            <Badge key={skill} variant="secondary" className="text-[10px] px-2 py-0.5 rounded-full">
              {skill}
            </Badge>
          ))}
          {technician.skills.length > 4 && (
            <Badge variant="secondary" className="text-[10px] px-2 py-0.5 rounded-full">
              +{technician.skills.length - 4}
            </Badge>
          )}
        </div>

        <div className="flex gap-2 mt-4">
          <Button variant="outline" size="sm" className="flex-1 rounded-xl" onClick={() => onViewProfile(technician)}>
            View Profile
          </Button>
          <Button
            size="sm"
            className="flex-1 rounded-xl"
            disabled={!technician.is_available}
            onClick={() => onBook(technician)}
          >
            {technician.is_available ? 'Book Now' : 'Unavailable'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TechnicianCard;
