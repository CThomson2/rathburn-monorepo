-- TABLE FOR PHYSICAL DRUMS i.e. the actual containers of material

-- data on their current state - what's in them, the volume, relations
-- business logic likely mandates material is always the same (no cross-contam.)
-- set constraints to model this

-- data updates when drum is emptied or added to from repro solvent
-- repro_additions -esque table for junction recording individual additions

-- batch code is supplier batch if contents are "new material"
-- " " and is internal code if repro drum
-- actually, change batch code to reference respective tables
-- so two batch code fields, and maybe keep the orders table?

-- POINT IS THAT there will be another table for units of raw material (1 to 1 with Drums generally, maybe not for half-drum processes)

-- po_number is NOT NULL, IF drum type is new

-- DELETE when drum is crushed
-- Ensure no important data is deleted,
--  i.e. exists on stock tables
-- if not feasible, don't delete but set crushed=FALSE

-- stock (new, repro) tables refernce this with FKs on Drums' PK
-- set appropriate ON DELETE / UPDATE events
CREATE TABLE Drums (
	-- not the Hxxx, but one tied to physical drum
    drum_id SERIAL PRIMARY KEY,
    status VARCHAR(20) NOT NULL CHECK (status IN ('ordered', 'in-stock', 'pre-production', 'processed', 'rescheduled', 'lost', 'waste')), -- Differentiates types
    material_id INT NOT NULL -- materials table has volume for each (e.g. ethanol standardised at 205lt.)
	-- REFERENCES Materials(material_id),
	-- next two could be a FK to an order or drum-stock table
    batch_code TEXT, -- supplier
    po_number TEXT, -- supplier
	-- current volume, updated on change (has to update on every change, logically)
    -- add logic so it matches with volume added to still or repro vol. added
	volume DECIMAL NOT NULL, -- Applies to both types
    original_drum_id INT REFERENCES Drums(drum_id), -- Used only for repro drums
    barcode_data VARCHAR(13)
	location CHAR(2) NOT NULL CHECK (location IN ('NS', 'OS')),
	updated_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TYPE inventory.drum_status AS ENUM (
  -- 'ordered',
  'en_route',
  -- 'received',
  'in_stock',
  'pending_allocation',
  'allocated', -- new name for pre-production
  'rescheduled', -- for intermediate storage between multiple processes
  'decommissioned', -- after being emptied into still
  'empty',
  'lost'
);

CREATE TABLE inventory.drum_status_transitions (
  current_status inventory.drum_status NOT NULL,
  next_status inventory.drum_status NOT NULL,
  requires_admin BOOLEAN DEFAULT false,
  requires_reason BOOLEAN DEFAULT false,
  PRIMARY KEY (current_status, next_status)
);

INSERT INTO inventory.drum_status_transitions VALUES
  -- Drum arrival and reception
  ('en_route', 'in_stock', false, false),

  -- From in_stock, when a drum is earmarked for production
  ('in_stock', 'pending_allocation', false, false),
  ('in_stock', 'allocated', true, true),  -- direct allocation (admin override)

  -- Pending allocation can either be confirmed or cancelled
  ('pending_allocation', 'allocated', false, false), -- confirmed via first QR code scan
  ('pending_allocation', 'in_stock', true, true),      -- cancellation of production

  -- Once allocated, a drum may either be:
  ('allocated', 'empty', false, false),             -- fully consumed (complete load)
  ('allocated', 'in_stock', false, false),            -- partially used, returned to stock
  ('allocated', 'pending_allocation', true, true),    -- reversal (erroneous allocation)
  ('allocated', 'rescheduled', true, true),           -- deferred for a subsequent process

  -- Rescheduled drums can be reallocated or returned to stock
  ('rescheduled', 'allocated', true, true),
  ('rescheduled', 'in_stock', true, true),

  -- Once a drum is empty, it is decommissioned
  ('empty', 'decommissioned', false, false),

  -- Lost drum transitions from various statuses (manual intervention required)
  ('in_stock', 'lost', true, false),
  ('pending_allocation', 'lost', true, false),
  ('allocated', 'lost', true, false),
  ('rescheduled', 'lost', true, false)
  -- Optionally, if a lost drum is found, you might allow:
  ('lost', 'in_stock', true, false)
;
