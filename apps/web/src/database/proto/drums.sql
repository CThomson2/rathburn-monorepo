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

CREATE TABLE Drum_Additions (
	
)


