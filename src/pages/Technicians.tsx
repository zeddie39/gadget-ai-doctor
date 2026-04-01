import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import TechnicianCard, { Technician } from '@/components/TechnicianCard';
import PaymentSelector from '@/components/PaymentSelector';
import { ArrowLeft, Search, Users, MapPin, Filter } from 'lucide-react';

// Sample data - will be replaced with DB data once tables are created
const SAMPLE_TECHNICIANS: Technician[] = [
  {
    id: '1', name: 'James Mwangi', specialization: 'Smartphone & Tablet Repair',
    location: 'Nairobi, Kenya', rating: 4.8, reviews_count: 127, hourly_rate: 500,
    currency: 'KES', is_verified: true, is_available: true, experience_years: 6,
    skills: ['Screen Replacement', 'Battery Repair', 'Motherboard', 'Water Damage', 'Software'],
  },
  {
    id: '2', name: 'Amina Osei', specialization: 'Laptop & Desktop Specialist',
    location: 'Accra, Ghana', rating: 4.9, reviews_count: 89, hourly_rate: 35,
    currency: 'GHS', is_verified: true, is_available: true, experience_years: 8,
    skills: ['Laptop Repair', 'Data Recovery', 'Networking', 'Virus Removal'],
  },
  {
    id: '3', name: 'Chinedu Okafor', specialization: 'TV & Home Electronics',
    location: 'Lagos, Nigeria', rating: 4.6, reviews_count: 203, hourly_rate: 3500,
    currency: 'NGN', is_verified: true, is_available: false, experience_years: 10,
    skills: ['TV Repair', 'Sound Systems', 'Inverters', 'PCB Soldering'],
  },
  {
    id: '4', name: 'Fatima Hassan', specialization: 'Mobile Device Expert',
    location: 'Mombasa, Kenya', rating: 4.7, reviews_count: 56, hourly_rate: 400,
    currency: 'KES', is_verified: false, is_available: true, experience_years: 4,
    skills: ['Screen Repair', 'Charging Port', 'Camera Module', 'Speaker'],
  },
  {
    id: '5', name: 'Thabo Molefe', specialization: 'Gaming Console & PC Builds',
    location: 'Johannesburg, SA', rating: 4.5, reviews_count: 41, hourly_rate: 150,
    currency: 'ZAR', is_verified: true, is_available: true, experience_years: 5,
    skills: ['Console Repair', 'PC Builds', 'GPU Repair', 'Custom Mods'],
  },
  {
    id: '6', name: 'Grace Wanjiku', specialization: 'Apple Device Specialist',
    location: 'Nairobi, Kenya', rating: 4.9, reviews_count: 174, hourly_rate: 800,
    currency: 'KES', is_verified: true, is_available: true, experience_years: 7,
    skills: ['iPhone', 'MacBook', 'iPad', 'Apple Watch', 'iCloud'],
  },
];

const Technicians: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [showPayment, setShowPayment] = useState(false);
  const [selectedTech, setSelectedTech] = useState<Technician | null>(null);

  const filtered = SAMPLE_TECHNICIANS.filter(tech => {
    const matchesSearch = tech.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tech.specialization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tech.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesLocation = locationFilter === 'all' || tech.location.toLowerCase().includes(locationFilter.toLowerCase());
    return matchesSearch && matchesLocation;
  });

  const handleBook = (tech: Technician) => {
    setSelectedTech(tech);
    setShowPayment(true);
  };

  return (
    <div className="min-h-screen premium-gradient p-3 sm:p-6 text-foreground">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-xl">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Technician Marketplace
              </span>
            </h1>
            <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
              <Users className="h-4 w-4" />
              {filtered.length} certified repair technicians
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, skill, or specialization..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 bg-muted border-border rounded-xl"
            />
          </div>
          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger className="w-full sm:w-[200px] bg-muted border-border rounded-xl">
              <MapPin className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              <SelectItem value="nairobi">Nairobi</SelectItem>
              <SelectItem value="mombasa">Mombasa</SelectItem>
              <SelectItem value="lagos">Lagos</SelectItem>
              <SelectItem value="accra">Accra</SelectItem>
              <SelectItem value="johannesburg">Johannesburg</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(tech => (
            <TechnicianCard
              key={tech.id}
              technician={tech}
              onBook={handleBook}
              onViewProfile={(t) => navigate(`/technicians/${t.id}`)}
            />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-bold mb-2">No technicians found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters.</p>
          </div>
        )}

        <PaymentSelector
          isOpen={showPayment}
          onClose={() => setShowPayment(false)}
          onSuccess={() => {
            setShowPayment(false);
            if (selectedTech) {
              navigate(`/technicians/${selectedTech.id}`);
            }
          }}
        />
      </div>
    </div>
  );
};

export default Technicians;
