-- Create spare_parts_inventory table
CREATE TABLE public.spare_parts_inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  part_name TEXT NOT NULL,
  part_category TEXT NOT NULL, -- e.g., 'battery', 'screen', 'motherboard', 'capacitor', 'ic_chip'
  compatible_devices TEXT[] NOT NULL DEFAULT '{}', -- array of compatible device types
  price NUMERIC(10, 2) NOT NULL,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  supplier TEXT,
  sku TEXT,
  description TEXT,
  image_url TEXT,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.spare_parts_inventory ENABLE ROW LEVEL SECURITY;

-- Allow all users to read spare parts inventory
CREATE POLICY "Anyone can view spare parts inventory"
  ON public.spare_parts_inventory
  FOR SELECT
  USING (true);

-- Only admins can modify inventory
CREATE POLICY "Admins can manage spare parts inventory"
  ON public.spare_parts_inventory
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for better query performance
CREATE INDEX idx_spare_parts_category ON public.spare_parts_inventory(part_category);
CREATE INDEX idx_spare_parts_availability ON public.spare_parts_inventory(is_available);
CREATE INDEX idx_spare_parts_compatible_devices ON public.spare_parts_inventory USING GIN(compatible_devices);

-- Add trigger for updated_at
CREATE TRIGGER update_spare_parts_inventory_updated_at
  BEFORE UPDATE ON public.spare_parts_inventory
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Insert some sample spare parts data
INSERT INTO public.spare_parts_inventory (part_name, part_category, compatible_devices, price, stock_quantity, supplier, description) VALUES
  ('Replacement Battery Pack', 'battery', ARRAY['iPhone 12', 'iPhone 13'], 45.99, 25, 'TechParts Inc', 'High-quality replacement battery with 2000mAh capacity'),
  ('LCD Screen Assembly', 'screen', ARRAY['Samsung Galaxy S21'], 89.99, 12, 'DisplayPro', 'Original quality OLED display with touch digitizer'),
  ('Charging Port PCB', 'motherboard', ARRAY['iPhone', 'iPad'], 19.99, 50, 'MobileParts Ltd', 'USB-C charging port circuit board'),
  ('Power Management IC', 'ic_chip', ARRAY['smartphone', 'tablet'], 15.50, 8, 'ChipMaster', 'Voltage regulation and power distribution chip'),
  ('Electrolytic Capacitor 470µF', 'capacitor', ARRAY['laptop', 'desktop', 'motherboard'], 2.99, 100, 'CapTech', 'High-quality capacitor for power supply circuits'),
  ('Cooling Fan Assembly', 'cooling', ARRAY['laptop'], 24.99, 18, 'CoolTech', 'Replacement cooling fan with heat sink'),
  ('WiFi Antenna Module', 'antenna', ARRAY['smartphone', 'laptop'], 12.50, 30, 'SignalPro', 'Dual-band WiFi antenna replacement'),
  ('Camera Lens Module', 'camera', ARRAY['iPhone 14', 'iPhone 15'], 65.00, 15, 'OpticsPro', '12MP camera sensor with lens assembly'),
  ('Speaker Assembly', 'speaker', ARRAY['smartphone', 'tablet'], 8.99, 40, 'AudioParts', 'Stereo speaker replacement unit'),
  ('SIM Card Reader', 'connector', ARRAY['smartphone'], 5.99, 60, 'ConnectParts', 'SIM card tray and reader module');