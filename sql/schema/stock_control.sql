-- Create the stock_control schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS stock_control;

-- Create Materials table
CREATE TABLE stock_control.materials (
  material_id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  chemical_type VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Drums table
CREATE TABLE stock_control.drums (
  drum_id SERIAL PRIMARY KEY,
  material_id INTEGER NOT NULL,
  date_ordered TIMESTAMP NOT NULL,
  date_received TIMESTAMP NOT NULL,
  batch_code TEXT,
  po_number TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in-stock', 'staged', 'loaded', 'repro')),
  scheduled BOOLEAN DEFAULT FALSE,
  reprocessed_from_drum_id INTEGER,
  volume_remaining DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Foreign keys
  CONSTRAINT fk_drums_material FOREIGN KEY (material_id) REFERENCES stock_control.materials(material_id),
  CONSTRAINT fk_drums_reprocessed FOREIGN KEY (reprocessed_from_drum_id) REFERENCES stock_control.drums(drum_id) ON DELETE SET NULL
);

-- Create indexes for Drums
CREATE INDEX idx_drums_status ON stock_control.drums(status);
CREATE INDEX idx_drums_material_id ON stock_control.drums(material_id);

-- Create Suppliers table
CREATE TABLE stock_control.suppliers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL
);

-- Create Distillations table
CREATE TABLE stock_control.distillations (
  distillation_id SERIAL PRIMARY KEY,
  still_id INTEGER NOT NULL UNIQUE,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  total_input_volume DECIMAL(10, 2) NOT NULL,
  expected_output_volume DECIMAL(10, 2) NOT NULL,
  actual_output_volume DECIMAL(10, 2) NOT NULL,
  loss_volume DECIMAL(10, 2) NOT NULL
);

-- Add a comment explaining how to use this script
COMMENT ON SCHEMA stock_control IS 'Schema for stock control management'; 


SELECT * FROM raw_materials;

ALTER TABLE suppliers
ALTER COLUMN id RENAME TO supplier_id;
ALTER TABLE suppliers
ALTER COLUMN name RENAME TO supplier_name;

ALTER TABLE suppliers
ADD COLUMN addr_1 VARCHAR(20),
ADD COLUMN addr_2 VARCHAR(30),
ADD COLUMN city VARCHAR(30),
ADD COLUMN post_code CHAR(7),
ADD COLUMN country_code CHAR(2);


CREATE TABLE inventory.stock_drums (
	drum_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	drum_type TEXT CHECK (drum_type IN ('new', 'repro')) NOT NULL,
	stock_id INT NOT NULL,
	fill_level DECIMAL(5,2) CHECK (fill_level >= 0), -- For tracking partial fills
	status TEXT CHECK (status IN ('en route', 'in stock', 'scheduled', 'pre-production', 'in production', 'processed', 'second process', 'disposed', 'lost')) DEFAULT 'en route',
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create separate foreign key constraints with CHECK conditions
-- This approach avoids the WHEN clause which causes errors
ALTER TABLE inventory.stock_drums 
ADD CONSTRAINT fk_stock_new 
FOREIGN KEY (stock_id) REFERENCES inventory.stock_new(stock_id) ON DELETE CASCADE;

-- Add a check constraint to ensure the foreign key is only enforced for 'new' type
ALTER TABLE inventory.stock_drums
ADD CONSTRAINT check_stock_new_reference
CHECK (drum_type != 'new' OR stock_id IN (SELECT stock_id FROM inventory.stock_new));

-- Add a similar constraint for 'repro' type
ALTER TABLE inventory.stock_drums
ADD CONSTRAINT fk_stock_repro
FOREIGN KEY (stock_id) REFERENCES inventory.stock_repro(stock_id) ON DELETE CASCADE;

ALTER TABLE inventory.stock_drums
ADD CONSTRAINT check_stock_repro_reference
CHECK (drum_type != 'repro' OR stock_id IN (SELECT stock_id FROM inventory.stock_repro));

CREATE OR REPLACE FUNCTION inventory.set_material_id()
RETURNS TRIGGER AS
$$ 
BEGIN
    NEW.material_id := (
        SELECT material_id 
        FROM public.raw_materials rm 
        WHERE rm.material_name = NEW.material_name
    );
    
    -- If no matching material found, use the 'UNKNOWN' material_id
    IF NEW.material_id IS NULL THEN
        NEW.material_id := (
            SELECT material_id 
            FROM public.raw_materials 
            WHERE material_name = 'UNKNOWN'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_material_id_trigger
BEFORE INSERT ON inventory.stock_drums
FOR EACH ROW
EXECUTE FUNCTION inventory.set_material_id();




-- PostgreSQL Schema for Stock Control

CREATE TABLE inventory.stock_orders (
    order_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    po_number TEXT UNIQUE NOT NULL, -- We generate this internally, so always available
    date_ordered TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, -- Ensures correct order tracking
    supplier_id INT,
    eta DATERANGE, -- Native PostgreSQL range type for expected delivery range
    notes TEXT
);

-- Add FK constraint `on supplier_id`:

ALTER TABLE inventory.stock_orders
ADD CONSTRAINT stock_orders_supplier_id_fkey
FOREIGN KEY (supplier_id)
REFERENCES public.suppliers(supplier_id)
ON DELETE SET NULL
ON UPDATE CASCADE;

-- FK Actions:
-- **On DELETE** of referenced row, the referencing row in `stock_order_details` is also deleted via **CASCADE**.

CREATE TABLE inventory.stock_order_details (
    detail_id SERIAL PRIMARY KEY,
    order_id INT NOT NULL REFERENCES inventory.stock_orders(order_id) ON DELETE CASCADE,
    batch_code TEXT UNIQUE, -- Usually unknown at order time
    material_id INT NOT NULL,
    material_description TEXT NOT NULL,
    drum_quantity INT NOT NULL CHECK (drum_quantity > 0), -- Ensures valid input
    drum_weight NUMERIC(6,2) CHECK (drum_weight >= 0), -- kg, optional
    drum_volume NUMERIC(6,2), -- Will be calculated by trigger
    status TEXT CHECK (status IN ('en route', 'completed', 'overdue')) DEFAULT 'en route',
    notes TEXT
);

ALTER TABLE inventory.stock_order_details
ADD CONSTRAINT stock_order_details_material_id_fkey
FOREIGN KEY (material_id)
REFERENCES public.raw_materials(material_id)
ON DELETE SET NULL
ON UPDATE CASCADE;


-- Trigger Functions and Stored Procedures

-- Function to calculate volume from mass using density from raw_materials
CREATE OR REPLACE FUNCTION mass_to_volume(material_id INT, weight NUMERIC)
RETURNS NUMERIC AS $$
DECLARE
    density NUMERIC;
BEGIN
    -- If weight is NULL, return default drum volume
    IF weight IS NULL THEN
        RETURN 200;
    END IF;
    
    -- Try to get density from raw_materials
    SELECT density INTO density 
    FROM public.raw_materials rm 
    WHERE rm.material_id = material_id;
    
    -- Calculate volume if density found
    IF FOUND THEN
        RETURN weight / density;
    ELSE
        -- Default if material not found
        RETURN 200;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to update drum_volume when weight or material changes
CREATE OR REPLACE FUNCTION update_drum_volume()
RETURNS TRIGGER AS $$
BEGIN
    -- Keep existing drum_volume if provided
    IF NEW.drum_volume IS NOT NULL THEN
        -- Do nothing, keep the provided drum_volume
        RETURN NEW;
    END IF;
    
    -- Otherwise calculate drum_volume from weight
    NEW.drum_volume := mass_to_volume(NEW.material_id, NEW.drum_weight);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_drum_volume_trigger
BEFORE INSERT OR UPDATE OF material_id, drum_weight ON inventory.stock_order_details
FOR EACH ROW
EXECUTE FUNCTION update_drum_volume();

CREATE OR REPLACE FUNCTION set_material_description()
RETURNS TRIGGER AS $$
BEGIN
    NEW.material_description := (SELECT material_name FROM public.raw_materials rm WHERE rm.material_id = NEW.material_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_material_description_trigger
BEFORE INSERT OR UPDATE ON inventory.stock_order_details
FOR EACH ROW
EXECUTE FUNCTION set_material_description();


-- Later, change this to an intelligent prediction based on supplier lead times
CREATE OR REPLACE FUNCTION set_eta_range()
RETURNS TRIGGER AS $$
BEGIN
    NEW.eta := DATERANGE(NEW.date_ordered, NEW.date_ordered + INTERVAL '6 weeks');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_eta_range_trigger
BEFORE INSERT OR UPDATE ON inventory.stock_orders
FOR EACH ROW
EXECUTE FUNCTION set_eta_range();
