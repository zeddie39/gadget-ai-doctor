import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Package, Plus, Pencil, Trash2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SparePart {
  id: string;
  part_name: string;
  part_category: string;
  compatible_devices: string[];
  price: number;
  stock_quantity: number;
  supplier: string | null;
  sku: string | null;
  description: string | null;
  image_url: string | null;
  is_available: boolean;
}

const CATEGORIES = [
  'battery',
  'screen',
  'motherboard',
  'capacitor',
  'ic_chip',
  'cooling',
  'antenna',
  'camera',
  'speaker',
  'connector',
  'other'
];

export default function SparePartsInventoryManager() {
  const [parts, setParts] = useState<SparePart[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<SparePart | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    part_name: '',
    part_category: 'other',
    compatible_devices: '',
    price: '',
    stock_quantity: '',
    supplier: '',
    sku: '',
    description: '',
    image_url: '',
    is_available: true
  });

  useEffect(() => {
    checkAdminStatus();
    fetchParts();
  }, []);

  const checkAdminStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setIsAdmin(false);
      return;
    }

    try {
      const { data: roleData, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (error) {
        console.warn('Admin check failed:', error.message);
        setIsAdmin(false);
        return;
      }

      setIsAdmin(!!roleData);
    } catch (error) {
      console.warn('Admin check error:', error);
      setIsAdmin(false);
    }
  };

  const fetchParts = async () => {
    try {
      const { data, error } = await supabase
        .from('spare_parts_inventory')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setParts(data as SparePart[]);
    } catch (error) {
      console.error('Fetch error:', error);
      toast({
        title: 'Fetch Failed',
        description: 'Unable to load spare parts inventory',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      part_name: '',
      part_category: 'other',
      compatible_devices: '',
      price: '',
      stock_quantity: '',
      supplier: '',
      sku: '',
      description: '',
      image_url: '',
      is_available: true
    });
    setEditingPart(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.part_name || !formData.price || !formData.stock_quantity) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      const compatibleDevices = formData.compatible_devices
        .split(',')
        .map(d => d.trim())
        .filter(d => d);

      const partData = {
        part_name: formData.part_name,
        part_category: formData.part_category,
        compatible_devices: compatibleDevices,
        price: parseFloat(formData.price),
        stock_quantity: parseInt(formData.stock_quantity),
        supplier: formData.supplier || null,
        sku: formData.sku || null,
        description: formData.description || null,
        image_url: formData.image_url || null,
        is_available: formData.is_available
      };

      if (editingPart) {
        const { error } = await supabase
          .from('spare_parts_inventory')
          .update(partData)
          .eq('id', editingPart.id);

        if (error) throw error;

        toast({
          title: 'Part Updated',
          description: 'Spare part updated successfully',
        });
      } else {
        const { error } = await supabase
          .from('spare_parts_inventory')
          .insert(partData);

        if (error) throw error;

        toast({
          title: 'Part Added',
          description: 'New spare part added to inventory',
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchParts();
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: 'Save Failed',
        description: error instanceof Error ? error.message : 'Failed to save spare part',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (part: SparePart) => {
    setEditingPart(part);
    setFormData({
      part_name: part.part_name,
      part_category: part.part_category,
      compatible_devices: part.compatible_devices.join(', '),
      price: part.price.toString(),
      stock_quantity: part.stock_quantity.toString(),
      supplier: part.supplier || '',
      sku: part.sku || '',
      description: part.description || '',
      image_url: part.image_url || '',
      is_available: part.is_available
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this spare part?')) return;

    try {
      const { error } = await supabase
        .from('spare_parts_inventory')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Part Deleted',
        description: 'Spare part removed from inventory',
      });

      fetchParts();
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: 'Delete Failed',
        description: 'Unable to delete spare part',
        variant: 'destructive',
      });
    }
  };

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-destructive" />
            Access Denied
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>
              You need admin privileges to manage spare parts inventory.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-6 h-6" />
                Spare Parts Inventory Manager
              </CardTitle>
              <CardDescription>
                Manage spare parts catalog, pricing, and availability
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Part
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingPart ? 'Edit Spare Part' : 'Add New Spare Part'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingPart ? 'Update' : 'Enter'} the spare part details below
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="part_name">Part Name *</Label>
                      <Input
                        id="part_name"
                        value={formData.part_name}
                        onChange={(e) => setFormData({ ...formData, part_name: e.target.value })}
                        placeholder="e.g., Replacement Battery"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="part_category">Category *</Label>
                      <Select
                        value={formData.part_category}
                        onValueChange={(value) => setFormData({ ...formData, part_category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map(cat => (
                            <SelectItem key={cat} value={cat}>
                              {cat.replace('_', ' ').toUpperCase()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="compatible_devices">Compatible Devices</Label>
                    <Input
                      id="compatible_devices"
                      value={formData.compatible_devices}
                      onChange={(e) => setFormData({ ...formData, compatible_devices: e.target.value })}
                      placeholder="e.g., iPhone 12, iPhone 13 (comma-separated)"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price">Price (USD) *</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        placeholder="29.99"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stock_quantity">Stock Quantity *</Label>
                      <Input
                        id="stock_quantity"
                        type="number"
                        value={formData.stock_quantity}
                        onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                        placeholder="50"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="supplier">Supplier</Label>
                      <Input
                        id="supplier"
                        value={formData.supplier}
                        onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                        placeholder="Supplier name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sku">SKU</Label>
                      <Input
                        id="sku"
                        value={formData.sku}
                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                        placeholder="Part SKU"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Part description..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="image_url">Image URL</Label>
                    <Input
                      id="image_url"
                      type="url"
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_available"
                      checked={formData.is_available}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_available: checked })}
                    />
                    <Label htmlFor="is_available">Available for purchase</Label>
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingPart ? 'Update Part' : 'Add Part'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : parts.length === 0 ? (
            <div className="text-center p-12">
              <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">No spare parts in inventory</p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Part
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {parts.map((part) => (
                <div key={part.id} className="p-4 rounded-lg border hover:border-primary/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{part.part_name}</h4>
                        <Badge variant="outline">{part.part_category}</Badge>
                        {!part.is_available && (
                          <Badge variant="destructive">Unavailable</Badge>
                        )}
                        {part.stock_quantity <= 5 && part.is_available && (
                          <Badge variant="destructive">Low Stock</Badge>
                        )}
                      </div>
                      
                      {part.description && (
                        <p className="text-sm text-muted-foreground">{part.description}</p>
                      )}
                      
                      <div className="flex items-center gap-6 text-sm">
                        <div>
                          <span className="text-muted-foreground">Price: </span>
                          <span className="font-bold text-primary">${part.price.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Stock: </span>
                          <span className={part.stock_quantity > 10 ? "font-medium" : "text-orange-600 font-medium"}>
                            {part.stock_quantity} units
                          </span>
                        </div>
                        {part.supplier && (
                          <div>
                            <span className="text-muted-foreground">Supplier: </span>
                            <span>{part.supplier}</span>
                          </div>
                        )}
                      </div>
                      
                      {part.compatible_devices.length > 0 && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Compatible: </span>
                          <span>{part.compatible_devices.join(', ')}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(part)}
                      >
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(part.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
