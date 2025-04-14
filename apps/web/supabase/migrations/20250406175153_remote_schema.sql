

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






CREATE SCHEMA IF NOT EXISTS "inventory";


ALTER SCHEMA "inventory" OWNER TO "postgres";


CREATE SCHEMA IF NOT EXISTS "obselete";


ALTER SCHEMA "obselete" OWNER TO "postgres";


CREATE EXTENSION IF NOT EXISTS "pgsodium";






CREATE SCHEMA IF NOT EXISTS "production";


ALTER SCHEMA "production" OWNER TO "postgres";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE SCHEMA IF NOT EXISTS "stock_control";


ALTER SCHEMA "stock_control" OWNER TO "postgres";


COMMENT ON SCHEMA "stock_control" IS 'Schema for stock control management';



CREATE SCHEMA IF NOT EXISTS "temp";


ALTER SCHEMA "temp" OWNER TO "postgres";


CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "wrappers" WITH SCHEMA "extensions";






CREATE TYPE "inventory"."drum_status" AS ENUM (
    'en_route',
    'in_stock',
    'pending_allocation',
    'allocated',
    'rescheduled',
    'decommissioned',
    'empty',
    'lost'
);


ALTER TYPE "inventory"."drum_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "inventory"."add_to_repro_drum"("distillation_id" integer, "repro_material" character varying, "volume_to_add" integer) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    target_drum_id INTEGER;
    remaining_capacity INTEGER;
BEGIN
    -- Find a suitable drum of the given material type with enough capacity
    SELECT repro_drum_id, (capacity - current_volume) AS remaining_capacity
    INTO target_drum_id, remaining_capacity
    FROM repro_drums rd
    WHERE rd.material_type = repro_material
      AND rd.capacity - rd.current_volume >= volume_to_add
      AND rd.volume_status = 'partial'  -- Ensure we only add to drums that are available for more material
    ORDER BY rd.current_volume DESC  -- Prioritize the drum with the least amount of material
    LIMIT 1;

    -- If no suitable drum is found, create a new drum and get its ID
    IF target_drum_id IS NULL THEN
        INSERT INTO repro_drums (material_type, volume_status, current_volume) 
        VALUES (repro_material, 'partial', GREATEST(0, volume_to_add))
        RETURNING repro_drum_id INTO target_drum_id;

        -- Adjust the remaining volume to add after the new drum
        volume_to_add = GREATEST(0, volume_to_add - 200);
    END IF;

    -- Check if the addition will breach capacity and handle overflow
    IF current_volume + volume_to_add > capacity THEN
        volume_to_add = capacity - current_volume; -- Adjust to fit into the current drum
    END IF;

    -- Update the selected drum's current volume
    UPDATE repro_drums
    SET current_volume = current_volume + volume_to_add,
        updated_at = CURRENT_TIMESTAMP
    WHERE repro_drum_id = target_drum_id;

    -- Record this addition in the repro_additions table
    INSERT INTO repro_additions (
        repro_drum_id, 
        distillation_id, 
        date_added,
        volume_added, 
        volume_in_drum
    )
    VALUES (
        target_drum_id,
        distillation_id,
        CURRENT_DATE,
        volume_to_add,
        volume_to_add + remaining_capacity
    );

    -- Handle any overflow by recursively calling this function
    IF volume_to_add > 0 THEN
        PERFORM inventory.add_to_repro_drum(distillation_id, repro_material, volume_to_add);
    END IF;
END;
$$;


ALTER FUNCTION "inventory"."add_to_repro_drum"("distillation_id" integer, "repro_material" character varying, "volume_to_add" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "inventory"."create_new_drums"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Insert multiple new drum records using generate_series()
    INSERT INTO inventory.new_drums (order_id, material, status, location)
    SELECT
        NEW.order_id,
        NEW.material,
        'en route', -- Default status
        'new-site'   -- Default location
    FROM
        generate_series(1, NEW.quantity) AS drum_count; -- Creates rows based on quantity

    RETURN NEW;
END;
$$;


ALTER FUNCTION "inventory"."create_new_drums"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "inventory"."delete_expired_notifications"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    DELETE FROM inventory.notifications WHERE expires_at IS NOT NULL AND expires_at < NOW();
    RETURN NULL; -- This ensures the function doesn't return anything
END;
$$;


ALTER FUNCTION "inventory"."delete_expired_notifications"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "inventory"."enforce_stock_id_constraint"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF NEW.drum_type = 'new' THEN
        -- Ensure stock_id exists in stock_new
        IF NOT EXISTS (SELECT 1 FROM inventory.stock_new WHERE id = NEW.stock_id) THEN
            RAISE EXCEPTION 'Invalid stock_id: % does not exist in stock_new', NEW.stock_id;
        END IF;
    ELSIF NEW.drum_type = 'repro' THEN
        -- Ensure stock_id exists in stock_repro
        IF NOT EXISTS (SELECT 1 FROM inventory.stock_repro WHERE stock_id = NEW.stock_id) THEN
            RAISE EXCEPTION 'Invalid stock_id: % does not exist in stock_repro', NEW.stock_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "inventory"."enforce_stock_id_constraint"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "inventory"."generate_stock_drums"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    INSERT INTO inventory.stock_drums (drum_type, order_detail_id, status, created_at, updated_at)
    SELECT 'new', NEW.detail_id, 'en route', NOW(), NOW()
    FROM generate_series(1, NEW.drum_quantity); -- Generate N rows per quantity ordered

    RETURN NEW;
END;
$$;


ALTER FUNCTION "inventory"."generate_stock_drums"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "inventory"."get_drum_inventory"("material" character varying) RETURNS TABLE("drum_id" integer, "import_id" integer, "material_type" character varying, "date_received" "date", "supplier_name" character varying, "supplier_batch_code" character varying, "date_processed" "date")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.drum_id, 
        d.import_id, 
        d.material_type, 
        i.date_received, 
        i.supplier_name, 
        i.supplier_batch_code, 
        d.date_processed
    FROM inventory.new_drums d
    JOIN inventory.imports i ON d.import_id = i.import_id
    WHERE d.material_type = material
    ORDER BY i.date_received;
END;
$$;


ALTER FUNCTION "inventory"."get_drum_inventory"("material" character varying) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "inventory"."handle_disposal_loss_transaction"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    drum_id INT;
BEGIN
    IF NEW.tx_type IN ('disposed', 'lost') THEN
        drum_id := NEW.drum_id;
        IF drum_id IS NOT NULL THEN
            UPDATE inventory.new_drums
            SET status = NEW.tx_type,
                updated_at = CURRENT_TIMESTAMP
            WHERE drum_id = drum_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "inventory"."handle_disposal_loss_transaction"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "inventory"."handle_empty_drums"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- If the drum has reached 0 volume, update its status
    IF NEW.remaining_volume = 0 THEN
        -- Mark drum as 'empty' so it can be removed or reused
        UPDATE inventory.stock_drums
        SET status = 'empty'
        WHERE drum_id = NEW.drum_id;

        -- Log the event in a table for tracking purposes
        INSERT INTO inventory.drum_decommission_log (drum_id, decommissioned_at, worker_id)
        VALUES (NEW.drum_id, NOW(), NEW.worker_id);
        
        -- Optionally: Notify staff
        INSERT INTO inventory.notifications (message, created_at)
        VALUES (format('Drum ID %s is now empty and should be decommissioned.', NEW.drum_id), NOW());

    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "inventory"."handle_empty_drums"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "inventory"."handle_intake_transaction"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    existing_delivery_id INT;
    current_total_received INT;
    order_qty INT;
BEGIN
    IF NEW.tx_type = 'intake' THEN

        --------------------------------------------------------
        -- 1) Find or Create Delivery row
        --------------------------------------------------------
        SELECT delivery_id
        INTO existing_delivery_id
        FROM inventory.deliveries
        WHERE order_id = NEW.order_id
          AND is_finalised = false
        LIMIT 1;

        IF existing_delivery_id IS NULL THEN
            INSERT INTO inventory.deliveries (order_id, quantity_received, is_finalised, created_at)
            VALUES (NEW.order_id, 1, false, CURRENT_TIMESTAMP)
            RETURNING delivery_id INTO existing_delivery_id;
        ELSE
            UPDATE inventory.deliveries
            SET quantity_received = quantity_received + 1,
                updated_at = CURRENT_TIMESTAMP
            WHERE delivery_id = existing_delivery_id;
        END IF;

        --------------------------------------------------------
        -- 2) Update Orders (increment quantity_received)
        --------------------------------------------------------
        UPDATE inventory.orders
        SET quantity_received = quantity_received + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE order_id = NEW.order_id
        RETURNING quantity_received, quantity INTO current_total_received, order_qty;

        --------------------------------------------------------
        -- 3) If we have a known drum_id, set the drum to 'available'
        --------------------------------------------------------
        IF NEW.drum_id IS NOT NULL THEN
            UPDATE inventory.new_drums
            SET status = 'in stock',
                updated_at = CURRENT_TIMESTAMP
            WHERE drum_id = NEW.drum_id;
        END IF;

        --------------------------------------------------------
        -- 4) If total_received == order_quantity => finalize
        --------------------------------------------------------
        IF current_total_received = order_qty THEN
            UPDATE inventory.deliveries
            SET is_finalised = true,
                updated_at = CURRENT_TIMESTAMP
            WHERE delivery_id = existing_delivery_id;

            UPDATE inventory.orders
            SET status = 'complete',
                updated_at = CURRENT_TIMESTAMP
            WHERE order_id = NEW.order_id;
        END IF;

        --------------------------------------------------------
        -- 5) Link the transaction to the chosen delivery_id
        --------------------------------------------------------
        UPDATE inventory.transactions
        SET delivery_id = existing_delivery_id
        WHERE tx_id = NEW.tx_id;

    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "inventory"."handle_intake_transaction"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "inventory"."handle_processed_transaction"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    drum_id INT;
BEGIN
    -- Check if the transaction type is 'processing'
    IF NEW.tx_type = 'processed' THEN
        -- Update the corresponding drum in the new_drums table
        UPDATE inventory.new_drums
        SET 
            status = CASE 
                        WHEN status <> 'en route' THEN 'processed'
                        ELSE status
                     END,
            date_processed = CASE 
                                WHEN status <> 'en route' THEN NEW.tx_date
                                ELSE NULL
                             END,
            updated_at = CASE 
                            WHEN status <> 'en route' THEN CURRENT_TIMESTAMP
                            ELSE updated_at
                         END
        WHERE drum_id = NEW.drum_id;    -- Match the source drum
    END IF;

    -- Return the newly inserted row in the transactions table
    RETURN NEW;
END;
$$;


ALTER FUNCTION "inventory"."handle_processed_transaction"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "inventory"."handle_processing_transaction"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$BEGIN
    -- Check if the transaction type is 'processing'
    IF NEW.tx_type = 'processed' THEN
        -- Update the corresponding drum in the new_drums table
        UPDATE inventory.new_drums
        SET 
            status = CASE 
                        WHEN status <> 'en route' THEN 'processed'
                        ELSE status
                     END,
            date_processed = CASE 
                                WHEN status <> 'en route' THEN NEW.tx_date
                                ELSE NULL
                             END,
            updated_at = CASE 
                            WHEN status <> 'en route' THEN CURRENT_TIMESTAMP
                            ELSE updated_at
                         END
        WHERE drum_id = NEW.drum_id;    -- Match the source drum
    END IF;

    -- Return the newly inserted row in the transactions table
    RETURN NEW;
END;$$;


ALTER FUNCTION "inventory"."handle_processing_transaction"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "inventory"."insert_stock_new"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE existing_stock_id INT;
BEGIN
    -- Check if stock_new already has the material+supplier combination
    SELECT stock_id INTO existing_stock_id
    FROM inventory.stock_new
    WHERE material_id = NEW.material_id
    AND supplier_id = (SELECT supplier_id FROM inventory.stock_orders WHERE order_id = NEW.order_id)
    LIMIT 1;

    -- If stock exists, update quantity
    IF existing_stock_id IS NOT NULL THEN
        UPDATE inventory.stock_new
        SET quantity = quantity + NEW.drum_quantity, updated_at = NOW()
        WHERE stock_id = existing_stock_id;
    ELSE
        -- If stock does not exist, create a new row
        INSERT INTO inventory.stock_new (material_id, supplier_id, quantity, location, batch_code, created_at, updated_at, detail_id)
        VALUES (
            NEW.material_id,
            (SELECT supplier_id FROM inventory.stock_orders WHERE order_id = NEW.order_id),
            NEW.drum_quantity,
            NULL,  -- Default location for new stock
            NULL, -- Batch code is recorded later
            NOW(), NOW(), -- Timestamps
            NEW.detail_id -- Link to stock_order_details
        );
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "inventory"."insert_stock_new"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "inventory"."mass_to_volume"("_material_id" integer, "_weight" numeric) RETURNS numeric
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    density NUMERIC;
BEGIN
    -- If weight is NULL, return default drum volume
    IF _weight IS NULL THEN
        RETURN 200;
    END IF;
    
    -- Try to get density from raw_materials
    SELECT density INTO density 
    FROM public.raw_materials rm 
    WHERE rm.material_id = _material_id;
    
    -- Calculate volume if density found
    IF FOUND THEN
        RETURN _weight / density;
    ELSE
        -- Default if material not found
        RETURN 200;
    END IF;
END;
$$;


ALTER FUNCTION "inventory"."mass_to_volume"("_material_id" integer, "_weight" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "inventory"."prevent_excess_deliveries"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    total_received       INT;
    order_quantity       INT;
    delivery_status      TEXT;
    quantity_remaining   INT;
    existing_import_tx   INT;
BEGIN
    -- Only run if this is an import transaction
    IF NEW.tx_type = 'intake' THEN

        /*
         1) Check if this drum has already been imported.
            We look for any transaction with the same drum_id and tx_type = 'import'.
            If found, raise an error to prevent duplicates.
        */
        SELECT tx_id
        INTO existing_import_tx
        FROM inventory.transactions
        WHERE drum_id = NEW.drum_id
          AND tx_type = 'intake'
        LIMIT 1;

        IF existing_import_tx IS NOT NULL THEN
            RAISE EXCEPTION 'Drum with ID % has already been received.', NEW.drum_id;
        END IF;

        /*
         2) Gather order info: total_received, order_quantity, and status
         */
        SELECT COALESCE(SUM(d.quantity_received), 0) AS total_received,
               o.quantity AS order_quantity,
               o.status AS delivery_status
        INTO total_received, order_quantity, delivery_status
        FROM inventory.orders o
        LEFT JOIN inventory.deliveries d ON o.order_id = d.order_id
        WHERE o.order_id = NEW.order_id
        GROUP BY o.quantity, o.status;

        IF delivery_status = 'complete' THEN
            RAISE EXCEPTION 'Cannot add new deliveries. The order is already complete.';
        END IF;

        IF order_quantity IS NULL OR order_quantity = 0 THEN
            RAISE EXCEPTION 'Invalid order quantity or order not found for order_id = %', NEW.order_id;
        END IF;

        -- quantity_remaining = how many more we can receive before hitting the order limit
        quantity_remaining := order_quantity - total_received;

        /*
         3) We might not have a "quantity_received" column directly in NEW, because it's an import transaction row,
            not a deliveries row. We typically add +1 for each import transaction. So let's define that logic:
        */
        IF (total_received + 1) > order_quantity THEN
            RAISE EXCEPTION 'Cannot import drum. Quantity received would exceed the order''s limit. Quantity remaining: %', quantity_remaining;
        END IF;

    END IF;

    -- If checks pass or tx_type != 'import', allow insertion
    RETURN NEW;
END;
$$;


ALTER FUNCTION "inventory"."prevent_excess_deliveries"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "inventory"."set_drum_volume"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN -- Keep existing drum_volume if provided
	IF NEW.drum_volume IS NOT NULL THEN
		-- Do nothing, keep the provided drum_volume
		RETURN NEW;
	END IF;

	-- Otherwise, calculate drum_volume from its provided weight
	-- NEW.drum_volume := mass_to_volume(NEW.material_id, NEW.drum_weight);
	NEW.drum_volume := 200;

	RETURN NEW;
END;
$$;


ALTER FUNCTION "inventory"."set_drum_volume"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "inventory"."set_eta_range"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.eta := DATERANGE(NEW.date_ordered, (NEW.date_ordered + INTERVAL '6 weeks')::date);
    RETURN NEW;
END;
$$;


ALTER FUNCTION "inventory"."set_eta_range"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "inventory"."set_material_id"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$ 
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
$$;


ALTER FUNCTION "inventory"."set_material_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "inventory"."set_material_type"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$BEGIN
    -- Set material based on which TX source ID is not null
    NEW.material := CASE
        -- Fetch material from orders table via deliveries
        WHEN NEW.delivery_id IS NOT NULL THEN
            (
                SELECT o.material
                FROM inventory.deliveries d
                JOIN inventory.orders o ON d.order_id = o.order_id
                WHERE d.delivery_id = NEW.delivery_id
            )
        -- Fetch material directly from new_drums table
        WHEN NEW.drum_id IS NOT NULL THEN
            (
                SELECT material
                FROM inventory.new_drums
                WHERE drum_id = NEW.drum_id
            )
        -- Fetch material directly from repro_drums table
        WHEN NEW.repro_id IS NOT NULL THEN
            (
                SELECT material
                FROM inventory.repro_drums
                WHERE repro_drum_id = NEW.repro_id
            )
    END;

    RETURN NEW;
END;$$;


ALTER FUNCTION "inventory"."set_material_type"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "inventory"."set_supplier_id"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$ 
BEGIN
    NEW.supplier_id := (
        SELECT supplier_id 
        FROM public.suppliers s
        WHERE s.supplier_name = NEW.supplier_name
    );
    
    -- If no matching supplier found, use the 'UNKNOWN' supplier_id
    IF NEW.supplier_id IS NULL THEN
        NEW.supplier_id := (
            SELECT supplier_id 
            FROM public.suppliers 
            WHERE supplier_name = 'UNKNOWN'
        );
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "inventory"."set_supplier_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "inventory"."update_order_status_on_transaction"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    total_drums INT;
    available_drums INT;
BEGIN
    -- Calculate the total number of drums for the order
    SELECT COUNT(*)
    INTO total_drums
    FROM inventory.new_drums
    WHERE order_id = NEW.order_id;

    -- Calculate the number of drums with status 'in stock'
    SELECT COUNT(*)
    INTO available_drums
    FROM inventory.new_drums
    WHERE order_id = NEW.order_id AND status IN ('in stock', 'scheduled');

    -- Update the order status based on the drum counts
    IF available_drums = 0 THEN
        UPDATE inventory.orders
        SET status = 'pending',
            updated_at = CURRENT_TIMESTAMP
        WHERE order_id = NEW.order_id;
    ELSIF available_drums < total_drums THEN
        UPDATE inventory.orders
        SET status = 'partial',
            updated_at = CURRENT_TIMESTAMP
        WHERE order_id = NEW.order_id;
    ELSE
        UPDATE inventory.orders
        SET status = 'complete',
            updated_at = CURRENT_TIMESTAMP
        WHERE order_id = NEW.order_id;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "inventory"."update_order_status_on_transaction"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "inventory"."update_repro_drum_status"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- In trigger functions, NEW refers to the new row being inserted/updated
    -- := is the PL/pgSQL assignment operator (different from SQL's = comparison operator)
    
    -- Set volume status based on volume added
    IF NEW.current_volume = 0 THEN
        NEW.volume_status := 'empty';
    ELSIF NEW.current_volume >= NEW.capacity THEN
        NEW.volume_status := 'full';
    ELSE
        NEW.volume_status := 'partial';
    END IF;

    -- Update the timestamp using PostgreSQL's CURRENT_TIMESTAMP function
    -- This automatically sets the time zone based on the server's configuration
    NEW.updated_at := CURRENT_TIMESTAMP;
    
    -- RETURN NEW is required for BEFORE triggers
    -- It tells PostgreSQL to proceed with the actual update using our modified NEW record
    RETURN NEW;
END;
$$;


ALTER FUNCTION "inventory"."update_repro_drum_status"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "inventory"."update_stock_drums_status"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$BEGIN
  UPDATE inventory.stock_drums
  SET status = 'in stock',
    updated_at = NOW()
  WHERE order_detail_id = NEW.detail_id;

  RETURN NEW;
END;$$;


ALTER FUNCTION "inventory"."update_stock_drums_status"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "inventory"."update_stock_new_on_arrival"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$DECLARE
    existing_stock_id INT;
BEGIN
    -- Find if stock batch already exists
    SELECT stock_id INTO existing_stock_id
    FROM inventory.stock_new
    WHERE material_id = (SELECT material_id FROM inventory.stock_order_details WHERE detail_id = NEW.order_detail_id)
	    AND batch_code = (SELECT batch_code FROM inventory.stock_order_details WHERE detail_id = NEW.order_detail_id)
	    AND supplier_id = (SELECT supplier_id FROM inventory.stock_orders WHERE order_id = 
                        (SELECT order_id FROM inventory.stock_order_details WHERE detail_id = NEW.order_detail_id))
    LIMIT 1;

    -- If stock exists, update quantity
    IF existing_stock_id IS NOT NULL THEN
        UPDATE inventory.stock_new
        SET quantity = quantity + 1, updated_at = NOW()
        WHERE stock_id = existing_stock_id;
    ELSE
        -- If stock does not exist, create a new batch
        INSERT INTO inventory.stock_new (material_id, supplier_id, quantity, batch_code, location, created_at, updated_at)
        VALUES (
            (SELECT material_id FROM inventory.stock_order_details WHERE detail_id = NEW.order_detail_id),
            (SELECT supplier_id FROM inventory.stock_orders WHERE order_id = 
                    (SELECT order_id FROM inventory.stock_order_details WHERE detail_id = NEW.order_detail_id)),
            1,
            (SELECT batch_code FROM inventory.stock_order_details WHERE detail_id = NEW.order_detail_id),
			 'New Site', NOW(), NOW()
        );
    END IF;

    -- Update drum status to 'in stock'
    UPDATE inventory.stock_drums
    SET updated_at = NOW()
    WHERE drum_id = NEW.drum_id;

    RETURN NEW;
END;$$;


ALTER FUNCTION "inventory"."update_stock_new_on_arrival"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_to_repro_drum"("distillation_id" integer, "repro_material" character varying, "volume_to_add" integer) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    target_drum_id INTEGER;
    remaining_capacity INTEGER;
BEGIN
    -- Find a suitable drum of the given material type with enough capacity
    SELECT repro_drum_id, (capacity - current_volume) AS remaining_capacity
    INTO target_drum_id, remaining_capacity
    FROM repro_drums rd
    WHERE rd.material_type = repro_material
      AND rd.capacity - rd.current_volume >= volume_to_add
      AND rd.status = 'partial'  -- Ensure we only add to drums that are available for more material
    ORDER BY rd.current_volume ASC  -- Prioritize the drum with the least amount of material
    LIMIT 1;

    -- If no suitable drum is found, raise an exception or handle as needed
    IF target_drum_id IS NULL THEN
        RAISE EXCEPTION 'No available repro drum with enough capacity for material type % and volume %', repro_material, volume_to_add;
    END IF;

    -- Update the selected drum's current volume
    UPDATE repro_drums
    SET current_volume = current_volume + volume_to_add,
        updated_at = CURRENT_TIMESTAMP
    WHERE repro_drum_id = target_drum_id;

    -- Record this addition in the repro_additions table
    INSERT INTO repro_additions (
        repro_drum_id, 
        distillation_id, 
        date_added,
        volume_added, 
        volume_in_drum
    )
    SELECT 
        target_drum_id,
        distillation_id,
        CURRENT_DATE,
        volume_to_add,
        current_volume
    FROM repro_drums
    WHERE repro_drum_id = target_drum_id;
END;
$$;


ALTER FUNCTION "public"."add_to_repro_drum"("distillation_id" integer, "repro_material" character varying, "volume_to_add" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."date_add"("arg1" timestamp with time zone, "arg2" interval) RETURNS timestamp with time zone
    LANGUAGE "sql"
    AS $$
select arg1+arg2
$$;


ALTER FUNCTION "public"."date_add"("arg1" timestamp with time zone, "arg2" interval) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  insert into public.profiles (id, full_name, avatar_url, email)
  values (
    new.id,                                              -- Use the new auth user's ID
    new.raw_user_meta_data->>'full_name',               -- Extract from metadata JSON
    new.raw_user_meta_data->>'avatar_url',              -- Extract from metadata JSON
    new.raw_user_meta_data->>'email'                    -- Extract from metadata JSON
    );
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mass_to_volume"("material_id" integer, "weight" numeric) RETURNS numeric
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
DECLARE
    density NUMERIC;
BEGIN
    SELECT density INTO density FROM public.raw_materials rm WHERE rm.material_id = material_id;
    RETURN weight / density;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        -- RAISE EXCEPTION 'Material not found';
        RETURN 200;
END;
$$;


ALTER FUNCTION "public"."mass_to_volume"("material_id" integer, "weight" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_modified_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_modified_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_timestamp"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at := NOW();  -- Set updated_at to the current timestamp
    RETURN NEW;  -- Return the modified row
END;
$$;


ALTER FUNCTION "public"."update_updated_at"() OWNER TO "postgres";


CREATE FOREIGN DATA WRAPPER "s3_wrapper" HANDLER "extensions"."s3_fdw_handler" VALIDATOR "extensions"."s3_fdw_validator";



SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "obselete"."deliveries" (
    "delivery_id" integer NOT NULL,
    "order_id" integer NOT NULL,
    "quantity_received" integer DEFAULT 0,
    "date_received" "date" DEFAULT CURRENT_DATE NOT NULL,
    "batch_code" character varying(50),
    "location" character varying(15) DEFAULT 'new-site'::character varying NOT NULL,
    "delivery_notes" "text",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "is_finalised" boolean DEFAULT false NOT NULL,
    CONSTRAINT "location_check" CHECK ((("location")::"text" = ANY (ARRAY[('old-site'::character varying)::"text", ('new-site'::character varying)::"text"]))),
    CONSTRAINT "valid_quantity" CHECK (("quantity_received" > 0))
);


ALTER TABLE "obselete"."deliveries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "obselete"."new_drums" (
    "drum_id" integer NOT NULL,
    "material" character varying(100) NOT NULL,
    "date_processed" "date",
    "status" character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    "location" character varying(20) DEFAULT 'new-site'::character varying,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "order_id" integer,
    CONSTRAINT "check_valid_status" CHECK ((("status")::"text" = ANY (ARRAY[('en route'::character varying)::"text", ('in stock'::character varying)::"text", ('scheduled'::character varying)::"text", ('pre-production'::character varying)::"text", ('in production'::character varying)::"text", ('processed'::character varying)::"text", ('second process'::character varying)::"text", ('disposed'::character varying)::"text", ('lost'::character varying)::"text"]))),
    CONSTRAINT "drums_location_check" CHECK ((("location")::"text" = ANY (ARRAY[('new-site'::character varying)::"text", ('old-site'::character varying)::"text"])))
);


ALTER TABLE "obselete"."new_drums" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "obselete"."orders" (
    "order_id" integer NOT NULL,
    "supplier" character varying(100) NOT NULL,
    "material" character varying(100) NOT NULL,
    "quantity" integer NOT NULL,
    "date_ordered" "date" DEFAULT CURRENT_DATE NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "quantity_received" integer DEFAULT 0 NOT NULL,
    "status" character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    "eta_start" "date",
    "eta_end" "date",
    "po_number" character varying(10),
    CONSTRAINT "delivery_status_check" CHECK ((("status")::"text" = ANY (ARRAY[('pending'::character varying)::"text", ('partial'::character varying)::"text", ('complete'::character varying)::"text"]))),
    CONSTRAINT "eta_dates_valid" CHECK ((("eta_end" >= "eta_start") AND ("eta_start" >= "date_ordered"))),
    CONSTRAINT "eta_end_requires_start" CHECK (((("eta_start" IS NULL) AND ("eta_end" IS NULL)) OR (("eta_start" IS NOT NULL) AND ("eta_end" IS NOT NULL))))
);


ALTER TABLE "obselete"."orders" OWNER TO "postgres";


CREATE OR REPLACE VIEW "obselete"."delivered_drums" AS
 SELECT "d"."drum_id",
    "dv"."date_received",
    "d"."date_processed",
    "d"."status",
    "o"."supplier",
    "o"."material",
    "dv"."batch_code"
   FROM (("obselete"."new_drums" "d"
     JOIN "obselete"."orders" "o" ON (("d"."order_id" = "o"."order_id")))
     JOIN "obselete"."deliveries" "dv" ON (("d"."order_id" = "dv"."order_id")))
  ORDER BY "dv"."date_received";


ALTER TABLE "obselete"."delivered_drums" OWNER TO "postgres";


ALTER TABLE "obselete"."deliveries" ALTER COLUMN "delivery_id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "obselete"."deliveries_delivery_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "obselete"."distillations" (
    "distillation_id" integer NOT NULL,
    "loading_date" "date" DEFAULT CURRENT_DATE,
    "start_date" "date",
    "still_code" character(1),
    "volume_in" numeric DEFAULT 200,
    "transporter" character(2),
    "loader" character(2),
    "operator" character(2),
    "completion_date" "date",
    "volume_in_spec" numeric DEFAULT 0,
    "volume_repro" numeric DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "obselete"."distillations" OWNER TO "postgres";


ALTER TABLE "obselete"."distillations" ALTER COLUMN "distillation_id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "obselete"."distillations_distillation_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE "obselete"."new_drums" ALTER COLUMN "drum_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "obselete"."new_drums_drum_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE "obselete"."orders" ALTER COLUMN "order_id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "obselete"."orders_order_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "obselete"."repro_drums" (
    "repro_drum_id" integer NOT NULL,
    "date_created" "date" DEFAULT CURRENT_DATE NOT NULL,
    "material" character varying(100) NOT NULL,
    "capacity" integer DEFAULT 200 NOT NULL,
    "current_volume" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "status" character varying(20) DEFAULT 'available'::character varying NOT NULL,
    "volume_status" character varying(20) DEFAULT 'partial'::character varying NOT NULL,
    "notes" character varying(20),
    "location" character varying(20) DEFAULT 'TBD'::character varying,
    CONSTRAINT "repro_drums_location_check" CHECK ((("location")::"text" = ANY (ARRAY[('new-site'::character varying)::"text", ('old-site'::character varying)::"text", ('TBD'::character varying)::"text"]))),
    CONSTRAINT "repro_volume" CHECK ((("current_volume" >= 0) AND ("current_volume" <= 200))),
    CONSTRAINT "valid_status" CHECK ((("status")::"text" = ANY (ARRAY[('not full'::character varying)::"text", ('available'::character varying)::"text", ('scheduled'::character varying)::"text", ('processed'::character varying)::"text"]))),
    CONSTRAINT "valid_volume_status" CHECK ((("volume_status")::"text" = ANY (ARRAY[('empty'::character varying)::"text", ('partial'::character varying)::"text", ('full'::character varying)::"text"])))
);


ALTER TABLE "obselete"."repro_drums" OWNER TO "postgres";


COMMENT ON TABLE "obselete"."repro_drums" IS 'Reprocessing drums are classed as Work-in-Progress inventory - the stage after initial processing, but before the stock is ready to be batched and sold.';



ALTER TABLE "obselete"."repro_drums" ALTER COLUMN "repro_drum_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "obselete"."repro_drums_repro_drum_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "obselete"."transactions" (
    "tx_id" integer NOT NULL,
    "tx_type" character varying(20) DEFAULT 'import'::character varying NOT NULL,
    "tx_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "material" character varying(100) NOT NULL,
    "drum_id" integer,
    "repro_id" integer,
    "tx_notes" "text",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "process_id" integer,
    "delivery_id" integer,
    "order_id" integer,
    "direction" "text" GENERATED ALWAYS AS (
CASE "tx_type"
    WHEN 'intake'::"text" THEN 'IN'::"text"
    WHEN 'scheduled'::"text" THEN NULL::"text"
    WHEN 'loaded'::"text" THEN 'OUT'::"text"
    WHEN 'processed'::"text" THEN NULL::"text"
    WHEN 'failed'::"text" THEN 'IN'::"text"
    WHEN 'requeued'::"text" THEN 'IN'::"text"
    WHEN 'disposed'::"text" THEN 'OUT'::"text"
    WHEN 'lost'::"text" THEN 'OUT'::"text"
    WHEN 'cancelled'::"text" THEN NULL::"text"
    ELSE NULL::"text"
END) STORED,
    CONSTRAINT "transactions_tx_type_check" CHECK ((("tx_type")::"text" = ANY (ARRAY[('intake'::character varying)::"text", ('scheduled'::character varying)::"text", ('loaded'::character varying)::"text", ('processed'::character varying)::"text", ('failed'::character varying)::"text", ('requeued'::character varying)::"text", ('disposed'::character varying)::"text", ('lost'::character varying)::"text", ('cancelled'::character varying)::"text"])))
);


ALTER TABLE "obselete"."transactions" OWNER TO "postgres";


ALTER TABLE "obselete"."transactions" ALTER COLUMN "tx_id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "obselete"."transactions_tx_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE OR REPLACE VIEW "obselete"."transactions_view" AS
 SELECT "t"."tx_id",
    "t"."tx_type",
    "t"."tx_date",
    "t"."material",
    "t"."drum_id",
    "t"."repro_id",
    "t"."tx_notes",
    "t"."created_at",
    "t"."updated_at",
    "t"."process_id",
    "t"."direction",
    "t"."delivery_id"
   FROM ((("obselete"."transactions" "t"
     LEFT JOIN "obselete"."deliveries" "d" ON (("t"."delivery_id" = "d"."delivery_id")))
     LEFT JOIN "obselete"."new_drums" "nd" ON (("t"."drum_id" = "nd"."drum_id")))
     LEFT JOIN "obselete"."repro_drums" "rd" ON (("t"."repro_id" = "rd"."repro_drum_id")))
  ORDER BY "t"."created_at" DESC
 LIMIT 100;


ALTER TABLE "obselete"."transactions_view" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "production"."cleaning_records" (
    "cleaning_id" integer NOT NULL,
    "still_code" "char",
    "operator" character varying(10),
    "checker" character varying(10)
);


ALTER TABLE "production"."cleaning_records" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "production"."cleaning_records_cleaning_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "production"."cleaning_records_cleaning_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "production"."cleaning_records_cleaning_id_seq" OWNED BY "production"."cleaning_records"."cleaning_id";



CREATE TABLE IF NOT EXISTS "production"."drum_distillations" (
    "drum_id" integer NOT NULL,
    "distillation_id" integer NOT NULL,
    "fraction_used" numeric DEFAULT 1 NOT NULL,
    CONSTRAINT "drum_distillations_fraction_used_check" CHECK ((("fraction_used" > (0)::numeric) AND ("fraction_used" <= (1)::numeric)))
);


ALTER TABLE "production"."drum_distillations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "production"."employees" (
    "employee_id" integer NOT NULL,
    "first_name" character varying(30) NOT NULL,
    "last_name" character varying(30),
    "initials" character varying(3),
    "middle_names" character varying(100)
);


ALTER TABLE "production"."employees" OWNER TO "postgres";


ALTER TABLE "production"."employees" ALTER COLUMN "employee_id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "production"."employees_employee_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "production"."operators_work_labs" (
    "operator_id" integer NOT NULL,
    "lab_id" integer NOT NULL
);


ALTER TABLE "production"."operators_work_labs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ref_labs" (
    "lab_id" integer NOT NULL,
    "lab_name" character varying(100) NOT NULL,
    "lab_site" character(3) NOT NULL,
    "description" "text",
    CONSTRAINT "labs_lab_site_check" CHECK (("lab_site" = ANY (ARRAY['OLD'::"bpchar", 'NEW'::"bpchar"])))
);


ALTER TABLE "public"."ref_labs" OWNER TO "postgres";


CREATE OR REPLACE VIEW "production"."operator_details" AS
 SELECT "o"."employee_id" AS "operator_id",
    "o"."first_name",
    "o"."last_name",
    "o"."initials",
    "l"."lab_name",
    "l"."description"
   FROM (("production"."employees" "o"
     JOIN "production"."operators_work_labs" "owl" ON (("owl"."operator_id" = "o"."employee_id")))
     JOIN "public"."ref_labs" "l" ON (("l"."lab_id" = "owl"."lab_id")));


ALTER TABLE "production"."operator_details" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "production"."output_records" (
    "output_id" integer NOT NULL,
    "production_id" integer,
    "container_size" integer NOT NULL,
    "no_containers" integer NOT NULL,
    "grade" character varying(10),
    "batch_number" character varying(10),
    "destination" character varying(100),
    "labels_required" integer,
    "labels_destroyed" integer,
    "start_time" timestamp without time zone,
    "end_time" timestamp without time zone,
    "start_temp" numeric(4,1),
    "completion_date" "date" DEFAULT CURRENT_DATE
);


ALTER TABLE "production"."output_records" OWNER TO "postgres";


ALTER TABLE "production"."output_records" ALTER COLUMN "output_id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "production"."output_records_output_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "production"."pr_schedule" (
    "schedule_id" integer NOT NULL,
    "production_date" "date" NOT NULL,
    "lab_site" character(3) NOT NULL,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT "pr_schedule_lab_site_check" CHECK (("lab_site" = ANY (ARRAY['OLD'::"bpchar", 'NEW'::"bpchar"])))
);


ALTER TABLE "production"."pr_schedule" OWNER TO "postgres";


ALTER TABLE "production"."pr_schedule" ALTER COLUMN "schedule_id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "production"."pr_schedule_schedule_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."active_context" (
    "context_id" integer NOT NULL,
    "worker_id" integer,
    "still_id" integer,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."active_context" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."active_context_context_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."active_context_context_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."active_context_context_id_seq" OWNED BY "public"."active_context"."context_id";



CREATE TABLE IF NOT EXISTS "public"."auth_activity_log" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "action" "text" NOT NULL,
    "ip_address" "text",
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."auth_activity_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bottle_sizes" (
    "id" integer NOT NULL,
    "volume" character varying(10) NOT NULL
);


ALTER TABLE "public"."bottle_sizes" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."bottle_sizes_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."bottle_sizes_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."bottle_sizes_id_seq" OWNED BY "public"."bottle_sizes"."id";



CREATE TABLE IF NOT EXISTS "public"."raw_materials" (
    "material_id" integer NOT NULL,
    "material_name" character varying(100) NOT NULL,
    "cas_number" character varying(20) NOT NULL,
    "chemical_group" character varying(50) DEFAULT 'Hydrocarbon'::character varying,
    "description" character varying(150),
    "un_code" character(4),
    "flash_point" integer,
    "material_code" character varying(4) DEFAULT '___'::character varying NOT NULL,
    "drum_weight" numeric(5,2),
    "drum_volume" integer DEFAULT 200 NOT NULL,
    "chemical_props" "jsonb"
);


ALTER TABLE "public"."raw_materials" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."chemical_class_groups" AS
 SELECT DISTINCT "raw_materials"."chemical_group" AS "groups",
    "count"(*) AS "materials"
   FROM "public"."raw_materials"
  GROUP BY "raw_materials"."chemical_group";


ALTER TABLE "public"."chemical_class_groups" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chemical_group_kind" (
    "value" "text" NOT NULL
);


ALTER TABLE "public"."chemical_group_kind" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."log_load_still" (
    "loading_id" integer NOT NULL,
    "scan_id" integer,
    "drum_id" integer,
    "still_id" integer,
    "distillation_id" integer NOT NULL,
    "status" "text" DEFAULT 'loaded'::"text",
    CONSTRAINT "distillation_loading_log_status_check" CHECK (("status" = ANY (ARRAY['loaded'::"text", 'ready'::"text", 'error'::"text"])))
);


ALTER TABLE "public"."log_load_still" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."distillation_loading_log_loading_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."distillation_loading_log_loading_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."distillation_loading_log_loading_id_seq" OWNED BY "public"."log_load_still"."loading_id";



CREATE TABLE IF NOT EXISTS "public"."distillation_pending_assignment" (
    "pending_id" integer NOT NULL,
    "drum_id" integer,
    "transport_id" integer NOT NULL,
    "assigned_distillation_id" integer,
    "status" "text" DEFAULT 'pending'::"text",
    CONSTRAINT "distillation_pending_assignments_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'assigned'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."distillation_pending_assignment" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."distillation_pending_assignments_pending_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."distillation_pending_assignments_pending_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."distillation_pending_assignments_pending_id_seq" OWNED BY "public"."distillation_pending_assignment"."pending_id";



CREATE TABLE IF NOT EXISTS "public"."distillation_record" (
    "record_id" integer NOT NULL,
    "distillation_id" integer,
    "actual_start" timestamp with time zone DEFAULT "now"(),
    "actual_end" timestamp with time zone,
    "status" "text" DEFAULT 'in_progress'::"text",
    "notes" "text",
    CONSTRAINT "distillation_records_status_check" CHECK (("status" = ANY (ARRAY['in_progress'::"text", 'completed'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."distillation_record" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."distillation_records_record_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."distillation_records_record_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."distillation_records_record_id_seq" OWNED BY "public"."distillation_record"."record_id";



CREATE TABLE IF NOT EXISTS "public"."distillation_schedule" (
    "distillation_id" integer NOT NULL,
    "scheduled_date" "date" NOT NULL,
    "still_id" integer NOT NULL,
    "expected_drum_qty" numeric(5,2) DEFAULT 1.00 NOT NULL,
    "status" "text" DEFAULT 'scheduled'::"text",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "distillation_schedules_expected_drum_qty_check" CHECK (("expected_drum_qty" > (0)::numeric)),
    CONSTRAINT "distillation_schedules_status_check" CHECK (("status" = ANY (ARRAY['scheduled'::"text", 'confirmed'::"text"])))
);


ALTER TABLE "public"."distillation_schedule" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."distillation_schedule_items" (
    "details_id" integer NOT NULL,
    "distillation_id" integer NOT NULL,
    "new_stock_id" integer,
    "repro_stock_id" integer,
    "drum_quantity" numeric(5,2) NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "chk_stock_reference" CHECK (((("new_stock_id" IS NOT NULL) AND ("repro_stock_id" IS NULL)) OR (("repro_stock_id" IS NOT NULL) AND ("new_stock_id" IS NULL)))),
    CONSTRAINT "distillation_schedules_details_drum_quantity_check" CHECK (("drum_quantity" > (0)::numeric)),
    CONSTRAINT "distillation_schedules_details_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'assigned'::"text", 'confirmed'::"text"])))
);


ALTER TABLE "public"."distillation_schedule_items" OWNER TO "postgres";


ALTER TABLE "public"."distillation_schedule_items" ALTER COLUMN "details_id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."distillation_schedules_details_details_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE "public"."distillation_schedule" ALTER COLUMN "distillation_id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."distillation_schedules_distillation_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."log_start_distillation" (
    "start_id" integer NOT NULL,
    "distillation_id" integer,
    "still_id" integer NOT NULL,
    "worker_id" integer,
    "status" "text" DEFAULT 'started'::"text",
    CONSTRAINT "distillation_start_log_status_check" CHECK (("status" = ANY (ARRAY['started'::"text", 'error'::"text"])))
);


ALTER TABLE "public"."log_start_distillation" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."distillation_start_log_start_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."distillation_start_log_start_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."distillation_start_log_start_id_seq" OWNED BY "public"."log_start_distillation"."start_id";



CREATE TABLE IF NOT EXISTS "public"."log_transport_drum" (
    "transport_id" integer NOT NULL,
    "scan_id" integer,
    "drum_id" integer,
    "transported_at" timestamp with time zone DEFAULT "now"(),
    "distillation_id" integer,
    "status" "text" DEFAULT 'in-transit'::"text",
    CONSTRAINT "distillation_transport_log_status_check" CHECK (("status" = ANY (ARRAY['in-transit'::"text", 'complete'::"text", 'error'::"text"])))
);


ALTER TABLE "public"."log_transport_drum" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."distillation_transport_log_transport_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."distillation_transport_log_transport_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."distillation_transport_log_transport_id_seq" OWNED BY "public"."log_transport_drum"."transport_id";



CREATE OR REPLACE VIEW "public"."drum_order_details" AS
 SELECT "d"."drum_id",
    "o"."order_id",
    "dy"."delivery_id",
    "d"."material",
    "o"."supplier",
    "dy"."batch_code",
    "o"."quantity" AS "qty_ordered",
    "o"."quantity_received" AS "qty_received",
    "o"."status" AS "delivery_status",
    "d"."status" AS "drum_status",
    "d"."date_processed"
   FROM (("obselete"."new_drums" "d"
     JOIN "obselete"."orders" "o" ON (("d"."order_id" = "o"."order_id")))
     LEFT JOIN "obselete"."deliveries" "dy" ON (("d"."order_id" = "dy"."order_id")))
  ORDER BY "d"."drum_id" DESC;


ALTER TABLE "public"."drum_order_details" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."drum_status_transition" (
    "current_status" "inventory"."drum_status" NOT NULL,
    "next_status" "inventory"."drum_status" NOT NULL,
    "requires_admin" boolean DEFAULT false,
    "requires_reason" boolean DEFAULT false
);


ALTER TABLE "public"."drum_status_transition" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."drums" (
    "old_id" integer NOT NULL,
    "material" "text" DEFAULT 'Unknown'::"text" NOT NULL,
    "batch_code" "text",
    "id" integer NOT NULL,
    "supplier" "text",
    "status" "text" DEFAULT '''N''::text'::"text" NOT NULL,
    "created_at" "date" DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "site" character varying DEFAULT 'new'::character varying NOT NULL,
    "date_ordered" "text",
    "chemical_group" "text",
    "material_code" "text"
);


ALTER TABLE "public"."drums" OWNER TO "postgres";


ALTER TABLE "public"."drums" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."drums_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE "public"."ref_labs" ALTER COLUMN "lab_id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."labs_lab_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."log_drum_decommission" (
    "decommission_id" integer NOT NULL,
    "drum_id" integer NOT NULL,
    "decommissioned_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "worker_id" integer DEFAULT 9
);


ALTER TABLE "public"."log_drum_decommission" OWNER TO "postgres";


ALTER TABLE "public"."log_drum_decommission" ALTER COLUMN "decommission_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."log_drum_decommission_decommission_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."log_drum_scan" (
    "scan_id" integer NOT NULL,
    "scanned_at" timestamp with time zone DEFAULT "now"(),
    "drum_id" integer,
    "worker_id" integer DEFAULT 9 NOT NULL,
    "scan_type" "text" NOT NULL,
    "scan_status" "text" DEFAULT 'success'::"text" NOT NULL,
    "error_message" "text",
    CONSTRAINT "scan_log_scan_status_check" CHECK (("scan_status" = ANY (ARRAY['success'::"text", 'failed'::"text"]))),
    CONSTRAINT "scan_log_scan_type_check" CHECK (("scan_type" = ANY (ARRAY['intake'::"text", 'transport'::"text", 'distillation_loading'::"text", 'distillation_start'::"text", 'error'::"text"])))
);


ALTER TABLE "public"."log_drum_scan" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."log_volume_transfer" (
    "transfer_id" integer NOT NULL,
    "drum_id" integer NOT NULL,
    "distillation_id" integer NOT NULL,
    "volume_transferred" numeric(7,2) NOT NULL,
    "remaining_volume" numeric(7,2) NOT NULL,
    "usage_type" "text" NOT NULL,
    "transfer_timestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "worker_id" integer DEFAULT 9,
    CONSTRAINT "log_volume_transfers_remaining_volume_check" CHECK (("remaining_volume" >= (0)::numeric)),
    CONSTRAINT "log_volume_transfers_usage_type_check" CHECK (("usage_type" = ANY (ARRAY['removal'::"text", 'addition'::"text"]))),
    CONSTRAINT "log_volume_transfers_volume_transferred_check" CHECK (("volume_transferred" > (0)::numeric))
);


ALTER TABLE "public"."log_volume_transfer" OWNER TO "postgres";


ALTER TABLE "public"."log_volume_transfer" ALTER COLUMN "transfer_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."log_volume_transfers_transfer_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."stock_history" (
    "id" integer NOT NULL,
    "date" "date" NOT NULL,
    "material_id" integer,
    "material_name" "text" NOT NULL,
    "supplier_id" integer,
    "supplier_name" "text",
    "quantity" integer,
    "drum_type" "text" NOT NULL,
    "drum_ids" "text",
    "batch_code" "text",
    "source_record_id" integer,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "material_code" character varying
);


ALTER TABLE "public"."stock_history" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."material_consumption" AS
 WITH "monthly_data" AS (
         SELECT "stock_history"."material_id",
            "stock_history"."material_name",
            "date_trunc"('month'::"text", ("stock_history"."date")::timestamp with time zone) AS "month",
            "sum"("stock_history"."quantity") AS "monthly_quantity"
           FROM "public"."stock_history"
          GROUP BY "stock_history"."material_id", "stock_history"."material_name", ("date_trunc"('month'::"text", ("stock_history"."date")::timestamp with time zone))
        )
 SELECT "md"."material_id",
    "md"."material_name",
    "md"."month",
    "md"."monthly_quantity",
    "sum"("md"."monthly_quantity") OVER (PARTITION BY "md"."material_id" ORDER BY "md"."month" ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS "running_total"
   FROM "monthly_data" "md"
  ORDER BY "md"."material_id", "md"."month";


ALTER TABLE "public"."material_consumption" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notification" (
    "notification_id" integer NOT NULL,
    "message" "text" NOT NULL,
    "message_type" "text" DEFAULT 'info'::"text" NOT NULL,
    "private" boolean DEFAULT false NOT NULL,
    "audience_type" "text" DEFAULT 'all'::"text" NOT NULL,
    "is_read" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone,
    "created_by" "uuid" NOT NULL,
    CONSTRAINT "notifications_audience_type_check" CHECK (("audience_type" = ANY (ARRAY['all'::"text", 'lab_workers'::"text", 'inventory_workers'::"text", 'office_workers'::"text", 'managers'::"text"]))),
    CONSTRAINT "notifications_message_type_check" CHECK (("message_type" = ANY (ARRAY['info'::"text", 'warning'::"text", 'urgent'::"text", 'error'::"text", 'success'::"text"])))
);


ALTER TABLE "public"."notification" OWNER TO "postgres";


ALTER TABLE "public"."notification" ALTER COLUMN "notification_id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."notifications_notification_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."order_detail" (
    "detail_id" integer NOT NULL,
    "order_id" integer NOT NULL,
    "batch_code" "text",
    "material_id" integer NOT NULL,
    "material_name" "text" NOT NULL,
    "drum_quantity" integer NOT NULL,
    "drum_weight" numeric(6,2),
    "drum_volume" numeric(6,2) GENERATED ALWAYS AS (
CASE
    WHEN ("drum_weight" IS NULL) THEN NULL::numeric
    ELSE "public"."mass_to_volume"("material_id", "drum_weight")
END) STORED,
    "status" "text" DEFAULT 'en route'::"text" NOT NULL,
    "notes" "text",
    "material_code" "text" NOT NULL,
    CONSTRAINT "stock_order_details_drum_quantity_check" CHECK (("drum_quantity" > 0)),
    CONSTRAINT "stock_order_details_drum_weight_check" CHECK (("drum_weight" >= (0)::numeric)),
    CONSTRAINT "stock_order_details_status_check" CHECK (("status" = ANY (ARRAY['en route'::"text", 'completed'::"text", 'overdue'::"text"])))
);


ALTER TABLE "public"."order_detail" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."product_prices" (
    "product_id" integer NOT NULL,
    "bottle_size_id" integer NOT NULL,
    "price" numeric(10,2) NOT NULL
);


ALTER TABLE "public"."product_prices" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."products" (
    "product_id" integer NOT NULL,
    "name" character varying(50) NOT NULL,
    "sku" character varying(20) NOT NULL,
    "raw_material_id" integer,
    "grade" character varying(10) NOT NULL
);


ALTER TABLE "public"."products" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."product_source_material" AS
 SELECT "p"."product_id",
    "r"."material_id" AS "raw_material_id",
    "p"."name" AS "product",
    "p"."sku",
    "r"."material_name" AS "material"
   FROM ("public"."products" "p"
     LEFT JOIN "public"."raw_materials" "r" ON (("r"."material_id" = "p"."raw_material_id")));


ALTER TABLE "public"."product_source_material" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."product_table" AS
 SELECT "p"."name",
    "p"."grade",
    "p"."sku",
    "r"."cas_number" AS "cas"
   FROM ("public"."products" "p"
     JOIN "public"."raw_materials" "r" ON (("p"."raw_material_id" = "r"."material_id")))
  ORDER BY "p"."grade", "p"."name";


ALTER TABLE "public"."product_table" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."products_product_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."products_product_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."products_product_id_seq" OWNED BY "public"."products"."product_id";



CREATE OR REPLACE VIEW "public"."raw_drum_archives" AS
 SELECT "new_drums"."drum_id",
    "new_drums"."order_id",
    "new_drums"."material",
    "new_drums"."date_processed",
    "new_drums"."status",
    "new_drums"."location",
    "new_drums"."created_at",
    "new_drums"."updated_at"
   FROM "obselete"."new_drums"
  WHERE (("new_drums"."status")::"text" = 'processed'::"text");


ALTER TABLE "public"."raw_drum_archives" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."raw_materials_raw_material_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."raw_materials_raw_material_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."raw_materials_raw_material_id_seq" OWNED BY "public"."raw_materials"."material_id";



CREATE TABLE IF NOT EXISTS "public"."raw_stock_history" (
    "id" integer NOT NULL,
    "date" "date",
    "event_str" "text",
    "drum_type" "text",
    "no_events" integer,
    "notes_ids" "text",
    "notes_batch" "text",
    "source" "text",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "material_code" character varying
);


ALTER TABLE "public"."raw_stock_history" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."raw_stock_history_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."raw_stock_history_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."raw_stock_history_id_seq" OWNED BY "public"."raw_stock_history"."id";



CREATE TABLE IF NOT EXISTS "public"."ref_materials" (
    "value" "text" NOT NULL,
    "code" character varying(8) NOT NULL,
    "chemical_group" "text" NOT NULL
);


ALTER TABLE "public"."ref_materials" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ref_stills" (
    "still_id" integer NOT NULL,
    "still_code" character(1) NOT NULL,
    "max_capacity" numeric(2,1) NOT NULL,
    "power_rating_kw" integer NOT NULL,
    "lab_id" integer NOT NULL,
    "is_vacuum" boolean NOT NULL,
    "is_operational" boolean NOT NULL,
    "description" "text"
);


ALTER TABLE "public"."ref_stills" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ref_suppliers" (
    "supplier_id" integer NOT NULL,
    "supplier_name" character varying(50) NOT NULL,
    "addr_1" character varying(20),
    "addr_2" character varying(30),
    "city" character varying(30),
    "post_code" character(7),
    "country_code" character(2)
);


ALTER TABLE "public"."ref_suppliers" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."scan_log_scan_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."scan_log_scan_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."scan_log_scan_id_seq" OWNED BY "public"."log_drum_scan"."scan_id";



CREATE TABLE IF NOT EXISTS "public"."session_settings" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "device_type" "text" NOT NULL,
    "session_duration_seconds" integer NOT NULL,
    "inactivity_timeout_seconds" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."session_settings" OWNER TO "postgres";


ALTER TABLE "public"."ref_stills" ALTER COLUMN "still_id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."stills_still_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."stock_drum" (
    "drum_id" integer NOT NULL,
    "drum_type" "text" DEFAULT 'new'::"text" NOT NULL,
    "order_detail_id" integer NOT NULL,
    "fill_level" numeric(5,2) DEFAULT 200,
    "status" "text" DEFAULT '''en_route''::text'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "material_code" "text",
    "distillation_id" integer,
    CONSTRAINT "stock_drum_drum_type_check" CHECK (("drum_type" = ANY (ARRAY['new'::"text", 'repro'::"text", 'recycled'::"text", 'waste'::"text"]))),
    CONSTRAINT "stock_drums_fill_level_check" CHECK (("fill_level" >= (0)::numeric)),
    CONSTRAINT "stock_drums_status_check" CHECK (("status" = ANY (ARRAY['ordered'::"text", 'en_route'::"text", 'in_stock'::"text", 'pending_allocation'::"text", 'allocated'::"text", 'rescheduled'::"text", 'decommissioned'::"text", 'empty'::"text"])))
);


ALTER TABLE "public"."stock_drum" OWNER TO "postgres";


COMMENT ON COLUMN "public"."stock_drum"."material_code" IS 'Explicit field for material content of drum. Could be queried by joining, but that would require two join with order details and materials. Detrimental for performance. Adding material field simply increases storage negligibly.';



COMMENT ON COLUMN "public"."stock_drum"."distillation_id" IS 'A nullable column defining the foreign key relation to `distillation_records`';



CREATE TABLE IF NOT EXISTS "public"."stock_drum_new" (
    "drum_id" integer NOT NULL,
    "material_code" "text",
    "drum_type" "text" DEFAULT 'new'::"text" NOT NULL,
    "order_detail_id" integer NOT NULL,
    "status" "text" DEFAULT '''en_route''::text'::"text" NOT NULL,
    "fill_level" numeric(5,2) DEFAULT 200,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "distillation_id" integer,
    CONSTRAINT "stock_drum_new_drum_type_check" CHECK (("drum_type" = ANY (ARRAY['new'::"text", 'repro'::"text", 'recycled'::"text", 'waste'::"text"]))),
    CONSTRAINT "stock_drums_fill_level_check" CHECK (("fill_level" >= (0)::numeric)),
    CONSTRAINT "stock_drums_status_check" CHECK (("status" = ANY (ARRAY['ordered'::"text", 'en_route'::"text", 'in_stock'::"text", 'pending_allocation'::"text", 'allocated'::"text", 'rescheduled'::"text", 'decommissioned'::"text", 'empty'::"text"])))
);


ALTER TABLE "public"."stock_drum_new" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."stock_drum_new_drum_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."stock_drum_new_drum_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."stock_drum_new_drum_id_seq" OWNED BY "public"."stock_drum_new"."drum_id";



CREATE SEQUENCE IF NOT EXISTS "public"."stock_drums_drum_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."stock_drums_drum_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."stock_drums_drum_id_seq" OWNED BY "public"."stock_drum"."drum_id";



CREATE OR REPLACE VIEW "public"."stock_history_analysis" AS
 SELECT "sh"."id",
    "sh"."date",
    "rm"."material_name",
    "rm"."material_code",
    "rm"."chemical_group",
    "s"."supplier_name",
    "sh"."quantity",
    "sh"."drum_type",
    "sh"."drum_ids",
    "sh"."batch_code",
    EXTRACT(year FROM "sh"."date") AS "year",
    EXTRACT(month FROM "sh"."date") AS "month",
    EXTRACT(quarter FROM "sh"."date") AS "quarter"
   FROM (("public"."stock_history" "sh"
     LEFT JOIN "public"."raw_materials" "rm" ON (("sh"."material_id" = "rm"."material_id")))
     LEFT JOIN "public"."ref_suppliers" "s" ON (("sh"."supplier_id" = "s"."supplier_id")));


ALTER TABLE "public"."stock_history_analysis" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."stock_history_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."stock_history_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."stock_history_id_seq" OWNED BY "public"."stock_history"."id";



CREATE TABLE IF NOT EXISTS "public"."stock_new" (
    "stock_id" integer NOT NULL,
    "material_id" integer,
    "supplier_id" integer,
    "quantity" integer NOT NULL,
    "batch_code" "text" NOT NULL,
    "location" character varying(20),
    "notes" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "material_code" "text",
    CONSTRAINT "stock_new_quantity_check" CHECK (("quantity" >= 0))
);


ALTER TABLE "public"."stock_new" OWNER TO "postgres";


ALTER TABLE "public"."stock_new" ALTER COLUMN "stock_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."stock_new_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."stock_order" (
    "order_id" integer NOT NULL,
    "po_number" "text",
    "date_ordered" "date" DEFAULT CURRENT_DATE NOT NULL,
    "supplier_id" integer NOT NULL,
    "eta" "daterange",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."stock_order" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."stock_order_details_detail_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."stock_order_details_detail_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."stock_order_details_detail_id_seq" OWNED BY "public"."order_detail"."detail_id";



ALTER TABLE "public"."stock_order" ALTER COLUMN "order_id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."stock_orders_order_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."stock_repro" (
    "stock_id" integer NOT NULL,
    "location" "text" NOT NULL,
    "notes" "text",
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "quantity" integer NOT NULL,
    "material_description" "text",
    "material_code" "text",
    CONSTRAINT "stock_repro_quantity_check" CHECK (("quantity" >= 0))
);


ALTER TABLE "public"."stock_repro" OWNER TO "postgres";


ALTER TABLE "public"."stock_repro" ALTER COLUMN "stock_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."stock_repro_drum_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE OR REPLACE VIEW "public"."supplier_analysis" AS
 SELECT "sh"."supplier_id",
    "sh"."supplier_name",
    "count"(*) AS "total_transactions",
    "count"(DISTINCT "sh"."material_id") AS "unique_materials",
    "sum"(
        CASE
            WHEN ("sh"."quantity" < 0) THEN 1
            ELSE 0
        END) AS "outgoing_transactions",
    "sum"(
        CASE
            WHEN ("sh"."quantity" > 0) THEN 1
            ELSE 0
        END) AS "incoming_transactions",
    "sum"(
        CASE
            WHEN ("sh"."quantity" < 0) THEN "sh"."quantity"
            ELSE 0
        END) AS "total_outgoing",
    "sum"(
        CASE
            WHEN ("sh"."quantity" > 0) THEN "sh"."quantity"
            ELSE 0
        END) AS "total_incoming"
   FROM "public"."stock_history" "sh"
  GROUP BY "sh"."supplier_id", "sh"."supplier_name"
  ORDER BY ("count"(*)) DESC;


ALTER TABLE "public"."supplier_analysis" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."supplier_material" (
    "material_id" integer NOT NULL,
    "supplier_id" integer,
    "material_name" "text" NOT NULL,
    "quantity" integer NOT NULL,
    "location" character varying(20) NOT NULL,
    "updated_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."supplier_material" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."suppliers_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."suppliers_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."suppliers_id_seq" OWNED BY "public"."ref_suppliers"."supplier_id";



CREATE TABLE IF NOT EXISTS "public"."user_profiles" (
    "id" "uuid" NOT NULL,
    "full_name" "text",
    "email" "text",
    "avatar_url" "text"
);


ALTER TABLE "public"."user_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "role" "text" DEFAULT 'user'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_roles" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."vw_active_drums" AS
 SELECT "new_drums"."drum_id",
    "new_drums"."order_id",
    "new_drums"."material",
    "new_drums"."date_processed",
    "new_drums"."status",
    "new_drums"."location",
    "new_drums"."created_at",
    "new_drums"."updated_at"
   FROM "obselete"."new_drums"
  WHERE (("new_drums"."status")::"text" = ANY (ARRAY[('available'::character varying)::"text", ('scheduled'::character varying)::"text"]));


ALTER TABLE "public"."vw_active_drums" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."vw_current_inventory" AS
 SELECT "new_drums"."material",
    "count"("new_drums"."drum_id") AS "total_drums",
    "count"(
        CASE
            WHEN (("new_drums"."status")::"text" = 'available'::"text") THEN 1
            ELSE NULL::integer
        END) AS "available_drums",
    "count"(
        CASE
            WHEN (("new_drums"."status")::"text" = 'scheduled'::"text") THEN 1
            ELSE NULL::integer
        END) AS "scheduled_drums"
   FROM "obselete"."new_drums"
  WHERE (("new_drums"."status")::"text" <> 'processed'::"text")
  GROUP BY "new_drums"."material"
  ORDER BY "new_drums"."material";


ALTER TABLE "public"."vw_current_inventory" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."vw_goods_inwards" WITH ("security_invoker"='on') AS
 SELECT "d"."drum_id",
    "d"."status",
    "od"."detail_id",
    "od"."batch_code" AS "batch",
    "rm"."material_name" AS "material",
    "od"."drum_quantity" AS "qty",
    "od"."status" AS "order_status",
    "o"."order_id",
    "o"."po_number",
    "o"."date_ordered",
    "sp"."supplier_name"
   FROM (((("public"."stock_drum" "d"
     JOIN "public"."order_detail" "od" ON (("od"."detail_id" = "d"."order_detail_id")))
     JOIN "public"."raw_materials" "rm" ON (("rm"."material_id" = "od"."material_id")))
     JOIN "public"."stock_order" "o" ON (("o"."order_id" = "od"."order_id")))
     JOIN "public"."ref_suppliers" "sp" ON (("sp"."supplier_id" = "o"."supplier_id")))
  ORDER BY "d"."drum_id" DESC;


ALTER TABLE "public"."vw_goods_inwards" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."vw_order_drum_details" AS
 SELECT "d"."drum_id",
    "rm"."material_name",
    "sod"."drum_quantity",
    "sp"."supplier_name",
    "sod"."batch_code",
    "o"."date_ordered"
   FROM (((("public"."stock_drum" "d"
     JOIN "public"."order_detail" "sod" ON (("sod"."detail_id" = "d"."order_detail_id")))
     JOIN "public"."raw_materials" "rm" ON (("rm"."material_id" = "sod"."material_id")))
     JOIN "public"."stock_order" "o" ON (("o"."order_id" = "sod"."order_id")))
     JOIN "public"."ref_suppliers" "sp" ON (("sp"."supplier_id" = "o"."supplier_id")));


ALTER TABLE "public"."vw_order_drum_details" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."vw_order_history" AS
 SELECT "sub"."order_id",
    "sub"."date_ordered",
    "sub"."batch_code",
    "sub"."material_description",
    "sub"."drum_quantity",
    "sub"."order_count"
   FROM ( SELECT "sod"."order_id",
            "so"."date_ordered",
            "sod"."batch_code",
            "sod"."material_name" AS "material_description",
            "sod"."drum_quantity",
            "count"(*) OVER (PARTITION BY "so"."order_id") AS "order_count"
           FROM ("public"."order_detail" "sod"
             JOIN "public"."stock_order" "so" ON (("so"."order_id" = "sod"."order_id")))) "sub"
  WHERE ("sub"."order_count" > 1)
  ORDER BY "sub"."order_id";


ALTER TABLE "public"."vw_order_history" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."vw_pending_assignments" AS
 SELECT "pa"."pending_id",
    "pa"."drum_id",
    "pa"."transport_id",
    "pa"."assigned_distillation_id",
    "pa"."status",
    "log"."scanned_at" AS "transported_at",
    ("now"() - "log"."scanned_at") AS "pending_time"
   FROM ("public"."distillation_pending_assignment" "pa"
     JOIN LATERAL ( SELECT "log_1"."scanned_at"
           FROM "public"."log_drum_scan" "log_1"
          WHERE (("log_1"."drum_id" = "pa"."drum_id") AND ("log_1"."scan_type" = 'transport'::"text"))
          ORDER BY "log_1"."scanned_at" DESC
         LIMIT 1) "log" ON (true))
  WHERE ("pa"."status" = 'pending'::"text");


ALTER TABLE "public"."vw_pending_assignments" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."vw_recent_order_details" AS
 SELECT "d"."drum_id",
    "d"."order_detail_id",
    "o"."order_id",
    "d"."status",
    "s"."supplier_name",
    "dt"."batch_code",
    "dt"."drum_quantity",
    "dt"."material_name" AS "material",
    "dt"."material_id"
   FROM ((("public"."stock_drum" "d"
     JOIN "public"."order_detail" "dt" ON (("dt"."detail_id" = "d"."order_detail_id")))
     JOIN "public"."stock_order" "o" ON (("o"."order_id" = "dt"."order_id")))
     JOIN "public"."ref_suppliers" "s" ON (("o"."supplier_id" = "s"."supplier_id")))
  ORDER BY "d"."drum_id" DESC;


ALTER TABLE "public"."vw_recent_order_details" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."worker_passcodes" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "worker_name" "text" NOT NULL,
    "role" "text" NOT NULL,
    "passcode" "text" NOT NULL,
    "is_active" boolean DEFAULT true,
    "last_login_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "updated_by" "uuid"
);


ALTER TABLE "public"."worker_passcodes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "stock_control"."distillations" (
    "distillation_id" integer NOT NULL,
    "still_id" integer NOT NULL,
    "start_time" timestamp without time zone NOT NULL,
    "end_time" timestamp without time zone NOT NULL,
    "total_input_volume" numeric(10,2) NOT NULL,
    "expected_output_volume" numeric(10,2) NOT NULL,
    "actual_output_volume" numeric(10,2) NOT NULL,
    "loss_volume" numeric(10,2) NOT NULL
);


ALTER TABLE "stock_control"."distillations" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "stock_control"."distillations_distillation_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "stock_control"."distillations_distillation_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "stock_control"."distillations_distillation_id_seq" OWNED BY "stock_control"."distillations"."distillation_id";



CREATE TABLE IF NOT EXISTS "stock_control"."drums" (
    "drum_id" integer NOT NULL,
    "material_id" integer NOT NULL,
    "date_ordered" timestamp without time zone NOT NULL,
    "date_received" timestamp without time zone NOT NULL,
    "batch_code" character varying(30),
    "po_number" character varying(30),
    "status" character varying(20) DEFAULT 'pending'::character varying,
    "scheduled" boolean DEFAULT false,
    "reprocessed_from_drum_id" integer,
    "volume_remaining" numeric(10,2) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "drums_status_check" CHECK ((("status")::"text" = ANY (ARRAY[('dispatched'::character varying)::"text", ('in-stock'::character varying)::"text", ('pre-production'::character varying)::"text", ('processing'::character varying)::"text", ('repro'::character varying)::"text", ('distilled'::character varying)::"text"])))
);


ALTER TABLE "stock_control"."drums" OWNER TO "postgres";


ALTER TABLE "stock_control"."drums" ALTER COLUMN "drum_id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "stock_control"."drums_drum_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "stock_control"."materials" (
    "material_id" integer NOT NULL,
    "name" character varying(100) NOT NULL,
    "chemical_type" character varying(50),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "stock_control"."materials" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "stock_control"."materials_material_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "stock_control"."materials_material_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "stock_control"."materials_material_id_seq" OWNED BY "stock_control"."materials"."material_id";



CREATE TABLE IF NOT EXISTS "stock_control"."suppliers" (
    "id" integer NOT NULL,
    "name" character varying(50) NOT NULL
);


ALTER TABLE "stock_control"."suppliers" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "stock_control"."suppliers_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "stock_control"."suppliers_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "stock_control"."suppliers_id_seq" OWNED BY "stock_control"."suppliers"."id";



CREATE TABLE IF NOT EXISTS "temp"."temp_data" (
    "old_id" "text",
    "material_name" "text",
    "quantity" integer,
    "supplier" "text",
    "batch" "text",
    "order_date" "date",
    "site" "text",
    "int_column" "text",
    "clerk_column" "text",
    "processed_date" "text",
    "material_id" integer,
    "supplier_id" integer,
    "new_id" integer
);


ALTER TABLE "temp"."temp_data" OWNER TO "postgres";


ALTER TABLE ONLY "production"."cleaning_records" ALTER COLUMN "cleaning_id" SET DEFAULT "nextval"('"production"."cleaning_records_cleaning_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."active_context" ALTER COLUMN "context_id" SET DEFAULT "nextval"('"public"."active_context_context_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."bottle_sizes" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."bottle_sizes_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."distillation_pending_assignment" ALTER COLUMN "pending_id" SET DEFAULT "nextval"('"public"."distillation_pending_assignments_pending_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."distillation_record" ALTER COLUMN "record_id" SET DEFAULT "nextval"('"public"."distillation_records_record_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."log_drum_scan" ALTER COLUMN "scan_id" SET DEFAULT "nextval"('"public"."scan_log_scan_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."log_load_still" ALTER COLUMN "loading_id" SET DEFAULT "nextval"('"public"."distillation_loading_log_loading_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."log_start_distillation" ALTER COLUMN "start_id" SET DEFAULT "nextval"('"public"."distillation_start_log_start_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."log_transport_drum" ALTER COLUMN "transport_id" SET DEFAULT "nextval"('"public"."distillation_transport_log_transport_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."order_detail" ALTER COLUMN "detail_id" SET DEFAULT "nextval"('"public"."stock_order_details_detail_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."products" ALTER COLUMN "product_id" SET DEFAULT "nextval"('"public"."products_product_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."raw_materials" ALTER COLUMN "material_id" SET DEFAULT "nextval"('"public"."raw_materials_raw_material_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."raw_stock_history" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."raw_stock_history_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."ref_suppliers" ALTER COLUMN "supplier_id" SET DEFAULT "nextval"('"public"."suppliers_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."stock_drum" ALTER COLUMN "drum_id" SET DEFAULT "nextval"('"public"."stock_drums_drum_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."stock_drum_new" ALTER COLUMN "drum_id" SET DEFAULT "nextval"('"public"."stock_drum_new_drum_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."stock_history" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."stock_history_id_seq"'::"regclass");



ALTER TABLE ONLY "stock_control"."distillations" ALTER COLUMN "distillation_id" SET DEFAULT "nextval"('"stock_control"."distillations_distillation_id_seq"'::"regclass");



ALTER TABLE ONLY "stock_control"."materials" ALTER COLUMN "material_id" SET DEFAULT "nextval"('"stock_control"."materials_material_id_seq"'::"regclass");



ALTER TABLE ONLY "stock_control"."suppliers" ALTER COLUMN "id" SET DEFAULT "nextval"('"stock_control"."suppliers_id_seq"'::"regclass");



ALTER TABLE ONLY "obselete"."distillations"
    ADD CONSTRAINT "distillations_pkey" PRIMARY KEY ("distillation_id");



ALTER TABLE ONLY "obselete"."deliveries"
    ADD CONSTRAINT "drum_deliveries_pkey" PRIMARY KEY ("delivery_id");



ALTER TABLE ONLY "obselete"."new_drums"
    ADD CONSTRAINT "drums_pkey" PRIMARY KEY ("drum_id");



ALTER TABLE ONLY "obselete"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("order_id");



ALTER TABLE ONLY "obselete"."repro_drums"
    ADD CONSTRAINT "repro_drums_pkey" PRIMARY KEY ("repro_drum_id");



ALTER TABLE ONLY "obselete"."transactions"
    ADD CONSTRAINT "transactions_pkey" PRIMARY KEY ("tx_id");



ALTER TABLE ONLY "obselete"."deliveries"
    ADD CONSTRAINT "unique_order_batch" UNIQUE ("order_id", "batch_code");



ALTER TABLE ONLY "production"."cleaning_records"
    ADD CONSTRAINT "cleaning_records_pkey" PRIMARY KEY ("cleaning_id");



ALTER TABLE ONLY "production"."drum_distillations"
    ADD CONSTRAINT "drum_distillations_pkey" PRIMARY KEY ("drum_id", "distillation_id");



ALTER TABLE ONLY "production"."employees"
    ADD CONSTRAINT "employees_pkey" PRIMARY KEY ("employee_id");



ALTER TABLE ONLY "production"."employees"
    ADD CONSTRAINT "operators_initials_key" UNIQUE ("initials");



ALTER TABLE ONLY "production"."operators_work_labs"
    ADD CONSTRAINT "operators_work_labs_pkey" PRIMARY KEY ("operator_id", "lab_id");



ALTER TABLE ONLY "production"."output_records"
    ADD CONSTRAINT "output_records_pkey" PRIMARY KEY ("output_id");



ALTER TABLE ONLY "production"."pr_schedule"
    ADD CONSTRAINT "pr_schedule_pkey" PRIMARY KEY ("schedule_id");



ALTER TABLE ONLY "production"."pr_schedule"
    ADD CONSTRAINT "pr_schedule_production_date_lab_site_key" UNIQUE ("production_date", "lab_site");



ALTER TABLE ONLY "public"."active_context"
    ADD CONSTRAINT "active_context_pkey" PRIMARY KEY ("context_id");



ALTER TABLE ONLY "public"."auth_activity_log"
    ADD CONSTRAINT "auth_activity_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bottle_sizes"
    ADD CONSTRAINT "bottle_sizes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chemical_group_kind"
    ADD CONSTRAINT "chemical_group_kind_pkey" PRIMARY KEY ("value");



ALTER TABLE ONLY "public"."log_load_still"
    ADD CONSTRAINT "distillation_loading_log_pkey" PRIMARY KEY ("loading_id");



ALTER TABLE ONLY "public"."log_load_still"
    ADD CONSTRAINT "distillation_loading_log_scan_id_key" UNIQUE ("scan_id");



ALTER TABLE ONLY "public"."distillation_pending_assignment"
    ADD CONSTRAINT "distillation_pending_assignments_pkey" PRIMARY KEY ("pending_id");



ALTER TABLE ONLY "public"."distillation_record"
    ADD CONSTRAINT "distillation_records_distillation_id_key" UNIQUE ("distillation_id");



ALTER TABLE ONLY "public"."distillation_record"
    ADD CONSTRAINT "distillation_records_pkey" PRIMARY KEY ("record_id");



ALTER TABLE ONLY "public"."distillation_schedule_items"
    ADD CONSTRAINT "distillation_schedules_details_pkey" PRIMARY KEY ("details_id");



ALTER TABLE ONLY "public"."distillation_schedule"
    ADD CONSTRAINT "distillation_schedules_pkey" PRIMARY KEY ("distillation_id");



ALTER TABLE ONLY "public"."log_start_distillation"
    ADD CONSTRAINT "distillation_start_log_distillation_id_key" UNIQUE ("distillation_id");



ALTER TABLE ONLY "public"."log_start_distillation"
    ADD CONSTRAINT "distillation_start_log_pkey" PRIMARY KEY ("start_id");



ALTER TABLE ONLY "public"."log_transport_drum"
    ADD CONSTRAINT "distillation_transport_log_pkey" PRIMARY KEY ("transport_id");



ALTER TABLE ONLY "public"."log_transport_drum"
    ADD CONSTRAINT "distillation_transport_log_scan_id_key" UNIQUE ("scan_id");



ALTER TABLE ONLY "public"."drum_status_transition"
    ADD CONSTRAINT "drum_status_transitions_pkey" PRIMARY KEY ("current_status", "next_status");



ALTER TABLE ONLY "public"."drums"
    ADD CONSTRAINT "drums_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ref_labs"
    ADD CONSTRAINT "labs_pkey" PRIMARY KEY ("lab_id");



ALTER TABLE ONLY "public"."log_drum_decommission"
    ADD CONSTRAINT "log_drum_decommission_pkey" PRIMARY KEY ("decommission_id");



ALTER TABLE ONLY "public"."log_volume_transfer"
    ADD CONSTRAINT "log_volume_transfers_pkey" PRIMARY KEY ("transfer_id");



ALTER TABLE ONLY "public"."ref_materials"
    ADD CONSTRAINT "material_kind_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."ref_materials"
    ADD CONSTRAINT "material_kind_pkey" PRIMARY KEY ("value");



ALTER TABLE ONLY "public"."notification"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("notification_id");



ALTER TABLE ONLY "public"."product_prices"
    ADD CONSTRAINT "product_prices_pkey" PRIMARY KEY ("product_id", "bottle_size_id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("product_id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "profiles_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."raw_materials"
    ADD CONSTRAINT "raw_materials_pkey" PRIMARY KEY ("material_id");



ALTER TABLE ONLY "public"."raw_stock_history"
    ADD CONSTRAINT "raw_stock_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."log_drum_scan"
    ADD CONSTRAINT "scan_log_pkey" PRIMARY KEY ("scan_id");



ALTER TABLE ONLY "public"."session_settings"
    ADD CONSTRAINT "session_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ref_stills"
    ADD CONSTRAINT "stills_pkey" PRIMARY KEY ("still_id");



ALTER TABLE ONLY "public"."ref_stills"
    ADD CONSTRAINT "stills_still_code_key" UNIQUE ("still_code");



ALTER TABLE ONLY "public"."stock_drum_new"
    ADD CONSTRAINT "stock_drum_new_pkey" PRIMARY KEY ("drum_id");



ALTER TABLE ONLY "public"."stock_drum"
    ADD CONSTRAINT "stock_drums_pkey" PRIMARY KEY ("drum_id");



ALTER TABLE ONLY "public"."stock_history"
    ADD CONSTRAINT "stock_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."supplier_material"
    ADD CONSTRAINT "stock_materials_pkey" PRIMARY KEY ("material_id");



ALTER TABLE ONLY "public"."stock_new"
    ADD CONSTRAINT "stock_new_batch_code_key" UNIQUE ("batch_code");



ALTER TABLE ONLY "public"."stock_new"
    ADD CONSTRAINT "stock_new_pkey" PRIMARY KEY ("stock_id");



ALTER TABLE ONLY "public"."order_detail"
    ADD CONSTRAINT "stock_order_details_pkey" PRIMARY KEY ("detail_id");



ALTER TABLE ONLY "public"."stock_order"
    ADD CONSTRAINT "stock_orders_pkey" PRIMARY KEY ("order_id");



ALTER TABLE ONLY "public"."stock_repro"
    ADD CONSTRAINT "stock_repro_pkey" PRIMARY KEY ("stock_id");



ALTER TABLE ONLY "public"."ref_suppliers"
    ADD CONSTRAINT "suppliers_pkey" PRIMARY KEY ("supplier_id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."worker_passcodes"
    ADD CONSTRAINT "worker_passcodes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "stock_control"."distillations"
    ADD CONSTRAINT "distillations_pkey" PRIMARY KEY ("distillation_id");



ALTER TABLE ONLY "stock_control"."distillations"
    ADD CONSTRAINT "distillations_still_id_key" UNIQUE ("still_id");



ALTER TABLE ONLY "stock_control"."drums"
    ADD CONSTRAINT "drums_pkey" PRIMARY KEY ("drum_id");



ALTER TABLE ONLY "stock_control"."materials"
    ADD CONSTRAINT "materials_pkey" PRIMARY KEY ("material_id");



ALTER TABLE ONLY "stock_control"."suppliers"
    ADD CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_drums_material_type" ON "obselete"."new_drums" USING "btree" ("material");



CREATE INDEX "idx_drums_status" ON "obselete"."new_drums" USING "btree" ("status");



CREATE INDEX "idx_repro_drums_material_type" ON "obselete"."repro_drums" USING "btree" ("material");



CREATE INDEX "idx_repro_drums_status" ON "obselete"."repro_drums" USING "btree" ("status");



CREATE INDEX "idx_repro_drums_volume_status" ON "obselete"."repro_drums" USING "btree" ("volume_status");



CREATE INDEX "fki_cleaning_still_code_fkey" ON "production"."cleaning_records" USING "btree" ("still_code");



CREATE INDEX "idx_auth_activity_log_created_at" ON "public"."auth_activity_log" USING "btree" ("created_at");



CREATE INDEX "idx_auth_activity_log_user_id" ON "public"."auth_activity_log" USING "btree" ("user_id");



CREATE INDEX "idx_distload_drum" ON "public"."log_load_still" USING "btree" ("drum_id");



CREATE INDEX "idx_distload_still_distill" ON "public"."log_load_still" USING "btree" ("still_id", "distillation_id");



CREATE INDEX "idx_distrecords_start" ON "public"."distillation_record" USING "btree" ("actual_start");



CREATE INDEX "idx_distsched_date_status" ON "public"."distillation_schedule" USING "btree" ("scheduled_date", "status");



CREATE INDEX "idx_distsched_still" ON "public"."distillation_schedule" USING "btree" ("still_id");



CREATE INDEX "idx_diststart_distill" ON "public"."log_start_distillation" USING "btree" ("distillation_id");



CREATE INDEX "idx_notifications_audience" ON "public"."notification" USING "btree" ("audience_type");



CREATE INDEX "idx_pendingassign_distillation" ON "public"."distillation_pending_assignment" USING "btree" ("assigned_distillation_id");



CREATE INDEX "idx_pendingassign_drum" ON "public"."distillation_pending_assignment" USING "btree" ("drum_id");



CREATE INDEX "idx_scanlog_drum_id" ON "public"."log_drum_scan" USING "btree" ("drum_id");



CREATE INDEX "idx_scanlog_scan_id" ON "public"."log_drum_scan" USING "btree" ("scan_id");



CREATE INDEX "idx_stock_history_date" ON "public"."stock_history" USING "btree" ("date");



CREATE INDEX "idx_stock_history_material_id" ON "public"."stock_history" USING "btree" ("material_id");



CREATE INDEX "idx_stockdrums_drum_id" ON "public"."stock_drum" USING "btree" ("drum_id");



CREATE INDEX "idx_stockdrums_drum_status" ON "public"."stock_drum" USING "btree" ("drum_id", "status");



CREATE INDEX "idx_worker_passcodes_passcode" ON "public"."worker_passcodes" USING "btree" ("passcode");



CREATE UNIQUE INDEX "idx_worker_passcodes_unique_passcode" ON "public"."worker_passcodes" USING "btree" ("passcode") WHERE ("is_active" = true);



CREATE UNIQUE INDEX "product_sku_key" ON "public"."products" USING "btree" ("sku");



CREATE INDEX "user_roles_user_id_idx" ON "public"."user_roles" USING "btree" ("user_id");



CREATE UNIQUE INDEX "user_roles_user_id_role_idx" ON "public"."user_roles" USING "btree" ("user_id", "role");



CREATE INDEX "idx_drums_material_id" ON "stock_control"."drums" USING "btree" ("material_id");



CREATE INDEX "idx_drums_status" ON "stock_control"."drums" USING "btree" ("status");



CREATE OR REPLACE TRIGGER "after_import_insert" AFTER INSERT ON "obselete"."orders" FOR EACH ROW EXECUTE FUNCTION "inventory"."create_new_drums"();



CREATE OR REPLACE TRIGGER "handle_disposal_loss_scan" AFTER INSERT OR UPDATE ON "obselete"."transactions" FOR EACH ROW WHEN (((("new"."tx_type")::"text" = 'disposed'::"text") OR (("new"."tx_type")::"text" = 'lost'::"text"))) EXECUTE FUNCTION "inventory"."handle_disposal_loss_transaction"();



CREATE OR REPLACE TRIGGER "handle_intake_scan" AFTER INSERT ON "obselete"."transactions" FOR EACH ROW WHEN ((("new"."tx_type")::"text" = 'intake'::"text")) EXECUTE FUNCTION "inventory"."handle_intake_transaction"();



CREATE OR REPLACE TRIGGER "handle_processed_scan" AFTER INSERT OR UPDATE ON "obselete"."transactions" FOR EACH ROW WHEN ((("new"."tx_type")::"text" = 'processed'::"text")) EXECUTE FUNCTION "inventory"."handle_processed_transaction"();



CREATE OR REPLACE TRIGGER "prevent_excess_deliveries" BEFORE INSERT ON "obselete"."transactions" FOR EACH ROW EXECUTE FUNCTION "inventory"."prevent_excess_deliveries"();



CREATE OR REPLACE TRIGGER "trg_update_repro_volume_status" BEFORE UPDATE OF "current_volume" ON "obselete"."repro_drums" FOR EACH ROW EXECUTE FUNCTION "inventory"."update_repro_drum_status"();



CREATE OR REPLACE TRIGGER "trigger_set_material_type" BEFORE INSERT ON "obselete"."transactions" FOR EACH ROW EXECUTE FUNCTION "inventory"."set_material_type"();



CREATE OR REPLACE TRIGGER "update_order_status_on_transaction" AFTER INSERT ON "obselete"."transactions" FOR EACH ROW EXECUTE FUNCTION "inventory"."update_order_status_on_transaction"();



CREATE OR REPLACE TRIGGER "trg_generate_stock_drums" AFTER INSERT ON "public"."order_detail" FOR EACH ROW EXECUTE FUNCTION "inventory"."generate_stock_drums"();



CREATE OR REPLACE TRIGGER "trg_set_drum_volume" BEFORE INSERT ON "public"."stock_drum" FOR EACH ROW EXECUTE FUNCTION "inventory"."set_drum_volume"();



CREATE OR REPLACE TRIGGER "trg_set_eta_range" BEFORE INSERT OR UPDATE ON "public"."stock_order" FOR EACH ROW EXECUTE FUNCTION "inventory"."set_eta_range"();



CREATE OR REPLACE TRIGGER "trg_update_stock_drums_after_order_completed" AFTER UPDATE OF "status" ON "public"."order_detail" FOR EACH ROW WHEN (("new"."status" = 'completed'::"text")) EXECUTE FUNCTION "inventory"."update_stock_drums_status"();



CREATE OR REPLACE TRIGGER "trg_update_stock_new" AFTER UPDATE OF "status" ON "public"."stock_drum" FOR EACH ROW WHEN (("new"."status" = 'in stock'::"text")) EXECUTE FUNCTION "inventory"."update_stock_new_on_arrival"();



CREATE OR REPLACE TRIGGER "trigger_delete_expired_notifications" BEFORE INSERT ON "public"."notification" FOR EACH STATEMENT EXECUTE FUNCTION "inventory"."delete_expired_notifications"();



CREATE OR REPLACE TRIGGER "trigger_handle_empty_drums" AFTER INSERT OR UPDATE ON "public"."log_volume_transfer" FOR EACH ROW EXECUTE FUNCTION "inventory"."handle_empty_drums"();



CREATE OR REPLACE TRIGGER "update_stock_history_modtime" BEFORE UPDATE ON "public"."stock_history" FOR EACH ROW EXECUTE FUNCTION "public"."update_modified_column"();



CREATE OR REPLACE TRIGGER "update_updated_at_trigger" BEFORE UPDATE ON "public"."raw_stock_history" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "update_updated_at_trigger" BEFORE UPDATE ON "public"."stock_history" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



ALTER TABLE ONLY "obselete"."deliveries"
    ADD CONSTRAINT "deliveries_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "obselete"."orders"("order_id");



ALTER TABLE ONLY "obselete"."new_drums"
    ADD CONSTRAINT "new_drums_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "obselete"."orders"("order_id") ON DELETE CASCADE;



ALTER TABLE ONLY "obselete"."transactions"
    ADD CONSTRAINT "transactions_delivery_id_fkey" FOREIGN KEY ("delivery_id") REFERENCES "obselete"."deliveries"("delivery_id") ON DELETE CASCADE;



ALTER TABLE ONLY "obselete"."transactions"
    ADD CONSTRAINT "transactions_drum_id_fkey" FOREIGN KEY ("drum_id") REFERENCES "obselete"."new_drums"("drum_id");



ALTER TABLE ONLY "obselete"."transactions"
    ADD CONSTRAINT "transactions_repro_id_fkey" FOREIGN KEY ("repro_id") REFERENCES "obselete"."repro_drums"("repro_drum_id");



ALTER TABLE ONLY "production"."drum_distillations"
    ADD CONSTRAINT "drum_distillations_distillation_id_fkey" FOREIGN KEY ("distillation_id") REFERENCES "obselete"."distillations"("distillation_id");



ALTER TABLE ONLY "production"."drum_distillations"
    ADD CONSTRAINT "drum_distillations_drum_id_fkey" FOREIGN KEY ("drum_id") REFERENCES "obselete"."new_drums"("drum_id");



ALTER TABLE ONLY "production"."operators_work_labs"
    ADD CONSTRAINT "operators_work_labs_lab_id_fkey" FOREIGN KEY ("lab_id") REFERENCES "public"."ref_labs"("lab_id");



ALTER TABLE ONLY "production"."operators_work_labs"
    ADD CONSTRAINT "operators_work_labs_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "production"."employees"("employee_id");



ALTER TABLE ONLY "public"."active_context"
    ADD CONSTRAINT "active_context_still_id_fkey" FOREIGN KEY ("still_id") REFERENCES "public"."ref_stills"("still_id") ON UPDATE CASCADE;



ALTER TABLE ONLY "public"."auth_activity_log"
    ADD CONSTRAINT "auth_activity_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."log_load_still"
    ADD CONSTRAINT "distillation_loading_log_distillation_id_fkey" FOREIGN KEY ("distillation_id") REFERENCES "public"."distillation_schedule"("distillation_id") ON UPDATE CASCADE;



ALTER TABLE ONLY "public"."log_load_still"
    ADD CONSTRAINT "distillation_loading_log_drum_id_fkey" FOREIGN KEY ("drum_id") REFERENCES "public"."stock_drum"("drum_id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."log_load_still"
    ADD CONSTRAINT "distillation_loading_log_scan_id_fkey" FOREIGN KEY ("scan_id") REFERENCES "public"."log_drum_scan"("scan_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."log_load_still"
    ADD CONSTRAINT "distillation_loading_log_still_id_fkey" FOREIGN KEY ("still_id") REFERENCES "public"."ref_stills"("still_id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."distillation_pending_assignment"
    ADD CONSTRAINT "distillation_pending_assignments_assigned_distillation_id_fkey" FOREIGN KEY ("assigned_distillation_id") REFERENCES "public"."distillation_schedule"("distillation_id") ON UPDATE CASCADE;



ALTER TABLE ONLY "public"."distillation_pending_assignment"
    ADD CONSTRAINT "distillation_pending_assignments_drum_id_fkey" FOREIGN KEY ("drum_id") REFERENCES "public"."stock_drum"("drum_id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."distillation_pending_assignment"
    ADD CONSTRAINT "distillation_pending_assignments_transport_id_fkey" FOREIGN KEY ("transport_id") REFERENCES "public"."log_transport_drum"("transport_id");



ALTER TABLE ONLY "public"."distillation_record"
    ADD CONSTRAINT "distillation_records_distillation_id_fkey" FOREIGN KEY ("distillation_id") REFERENCES "public"."distillation_schedule"("distillation_id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."distillation_schedule_items"
    ADD CONSTRAINT "distillation_schedules_details_distillation_id_fkey" FOREIGN KEY ("distillation_id") REFERENCES "public"."distillation_schedule"("distillation_id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."distillation_schedule_items"
    ADD CONSTRAINT "distillation_schedules_details_new_stock_id_fkey" FOREIGN KEY ("new_stock_id") REFERENCES "public"."stock_new"("stock_id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."distillation_schedule_items"
    ADD CONSTRAINT "distillation_schedules_details_repro_stock_id_fkey" FOREIGN KEY ("repro_stock_id") REFERENCES "public"."stock_repro"("stock_id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."distillation_schedule"
    ADD CONSTRAINT "distillation_schedules_still_id_fkey" FOREIGN KEY ("still_id") REFERENCES "public"."ref_stills"("still_id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."log_start_distillation"
    ADD CONSTRAINT "distillation_start_log_distillation_id_fkey" FOREIGN KEY ("distillation_id") REFERENCES "public"."distillation_schedule"("distillation_id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."log_start_distillation"
    ADD CONSTRAINT "distillation_start_log_still_id_fkey" FOREIGN KEY ("still_id") REFERENCES "public"."ref_stills"("still_id") ON UPDATE CASCADE;



ALTER TABLE ONLY "public"."log_transport_drum"
    ADD CONSTRAINT "distillation_transport_log_distillation_id_fkey" FOREIGN KEY ("distillation_id") REFERENCES "public"."distillation_schedule"("distillation_id") ON UPDATE CASCADE;



ALTER TABLE ONLY "public"."log_transport_drum"
    ADD CONSTRAINT "distillation_transport_log_drum_id_fkey" FOREIGN KEY ("drum_id") REFERENCES "public"."stock_drum"("drum_id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."log_transport_drum"
    ADD CONSTRAINT "distillation_transport_log_scan_id_fkey" FOREIGN KEY ("scan_id") REFERENCES "public"."log_drum_scan"("scan_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product_prices"
    ADD CONSTRAINT "fk_bottle_size" FOREIGN KEY ("bottle_size_id") REFERENCES "public"."bottle_sizes"("id");



ALTER TABLE ONLY "public"."product_prices"
    ADD CONSTRAINT "fk_product" FOREIGN KEY ("product_id") REFERENCES "public"."products"("product_id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "fk_raw_material" FOREIGN KEY ("raw_material_id") REFERENCES "public"."raw_materials"("material_id");



ALTER TABLE ONLY "public"."log_volume_transfer"
    ADD CONSTRAINT "log_volume_transfers_distillation_id_fkey" FOREIGN KEY ("distillation_id") REFERENCES "public"."distillation_schedule"("distillation_id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."log_volume_transfer"
    ADD CONSTRAINT "log_volume_transfers_drum_id_fkey" FOREIGN KEY ("drum_id") REFERENCES "public"."stock_drum"("drum_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ref_materials"
    ADD CONSTRAINT "material_kind_chemical_group_fkey" FOREIGN KEY ("chemical_group") REFERENCES "public"."chemical_group_kind"("value");



ALTER TABLE ONLY "public"."notification"
    ADD CONSTRAINT "notification_user_id_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."order_detail"
    ADD CONSTRAINT "order_detail_material_code_fkey" FOREIGN KEY ("material_code") REFERENCES "public"."ref_materials"("code") ON UPDATE CASCADE;



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."raw_stock_history"
    ADD CONSTRAINT "raw_stock_history_material_code_fkey" FOREIGN KEY ("material_code") REFERENCES "public"."ref_materials"("code");



ALTER TABLE ONLY "public"."log_drum_scan"
    ADD CONSTRAINT "scan_log_drum_id_fkey" FOREIGN KEY ("drum_id") REFERENCES "public"."stock_drum"("drum_id") ON UPDATE CASCADE;



ALTER TABLE ONLY "public"."ref_stills"
    ADD CONSTRAINT "stills_lab_id_fkey" FOREIGN KEY ("lab_id") REFERENCES "public"."ref_labs"("lab_id");



ALTER TABLE ONLY "public"."stock_drum"
    ADD CONSTRAINT "stock_drum_distillation_id_fkey" FOREIGN KEY ("distillation_id") REFERENCES "public"."distillation_record"("record_id") ON UPDATE CASCADE;



ALTER TABLE ONLY "public"."stock_drum_new"
    ADD CONSTRAINT "stock_drum_new_distillation_id_fkey" FOREIGN KEY ("distillation_id") REFERENCES "public"."distillation_record"("record_id") ON UPDATE CASCADE;



ALTER TABLE ONLY "public"."stock_drum_new"
    ADD CONSTRAINT "stock_drum_new_material_code_fkey" FOREIGN KEY ("material_code") REFERENCES "public"."ref_materials"("code") ON UPDATE CASCADE;



ALTER TABLE ONLY "public"."stock_drum_new"
    ADD CONSTRAINT "stock_drum_new_order_detail_id_fkey" FOREIGN KEY ("order_detail_id") REFERENCES "public"."order_detail"("detail_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stock_drum"
    ADD CONSTRAINT "stock_drums_order_detail_id_fkey" FOREIGN KEY ("order_detail_id") REFERENCES "public"."order_detail"("detail_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stock_history"
    ADD CONSTRAINT "stock_history_material_code_fkey" FOREIGN KEY ("material_code") REFERENCES "public"."ref_materials"("code");



ALTER TABLE ONLY "public"."stock_history"
    ADD CONSTRAINT "stock_history_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "public"."raw_materials"("material_id");



ALTER TABLE ONLY "public"."stock_history"
    ADD CONSTRAINT "stock_history_source_record_id_fkey" FOREIGN KEY ("source_record_id") REFERENCES "public"."raw_stock_history"("id");



ALTER TABLE ONLY "public"."stock_history"
    ADD CONSTRAINT "stock_history_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."ref_suppliers"("supplier_id");



ALTER TABLE ONLY "public"."supplier_material"
    ADD CONSTRAINT "stock_materials_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "public"."raw_materials"("material_id");



ALTER TABLE ONLY "public"."supplier_material"
    ADD CONSTRAINT "stock_materials_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."raw_materials"("material_id");



ALTER TABLE ONLY "public"."stock_new"
    ADD CONSTRAINT "stock_new_material_code_fkey" FOREIGN KEY ("material_code") REFERENCES "public"."ref_materials"("code") ON UPDATE CASCADE;



ALTER TABLE ONLY "public"."stock_new"
    ADD CONSTRAINT "stock_new_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "public"."raw_materials"("material_id");



ALTER TABLE ONLY "public"."stock_new"
    ADD CONSTRAINT "stock_new_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."ref_suppliers"("supplier_id");



ALTER TABLE ONLY "public"."order_detail"
    ADD CONSTRAINT "stock_order_details_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."stock_order"("order_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stock_order"
    ADD CONSTRAINT "stock_orders_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."ref_suppliers"("supplier_id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."stock_repro"
    ADD CONSTRAINT "stock_repro_material_code_fkey" FOREIGN KEY ("material_code") REFERENCES "public"."ref_materials"("code") ON UPDATE CASCADE;



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."worker_passcodes"
    ADD CONSTRAINT "worker_passcodes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."worker_passcodes"
    ADD CONSTRAINT "worker_passcodes_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."worker_passcodes"
    ADD CONSTRAINT "worker_passcodes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "stock_control"."drums"
    ADD CONSTRAINT "fk_drums_material" FOREIGN KEY ("material_id") REFERENCES "stock_control"."materials"("material_id");



ALTER TABLE ONLY "stock_control"."drums"
    ADD CONSTRAINT "fk_drums_reprocessed" FOREIGN KEY ("reprocessed_from_drum_id") REFERENCES "stock_control"."drums"("drum_id") ON DELETE SET NULL;



ALTER TABLE "production"."employees" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Admins can insert passcodes" ON "public"."worker_passcodes" FOR INSERT WITH CHECK (("auth"."uid"() IN ( SELECT "user_roles"."user_id"
   FROM "public"."user_roles"
  WHERE ("user_roles"."role" = 'admin'::"text"))));



CREATE POLICY "Admins can insert roles" ON "public"."user_roles" FOR INSERT WITH CHECK (("auth"."uid"() IN ( SELECT "user_roles_1"."user_id"
   FROM "public"."user_roles" "user_roles_1"
  WHERE ("user_roles_1"."role" = 'admin'::"text"))));



CREATE POLICY "Admins can update passcodes" ON "public"."worker_passcodes" FOR UPDATE USING (("auth"."uid"() IN ( SELECT "user_roles"."user_id"
   FROM "public"."user_roles"
  WHERE ("user_roles"."role" = 'admin'::"text"))));



CREATE POLICY "Admins can update roles" ON "public"."user_roles" FOR UPDATE TO "authenticated" USING (("auth"."uid"() IN ( SELECT "user_roles_1"."user_id"
   FROM "public"."user_roles" "user_roles_1"
  WHERE ("user_roles_1"."role" = 'admin'::"text"))));



CREATE POLICY "Admins can view all passcodes" ON "public"."worker_passcodes" FOR SELECT TO "authenticated" USING (("auth"."uid"() IN ( SELECT "user_roles"."user_id"
   FROM "public"."user_roles"
  WHERE ("user_roles"."role" = 'admin'::"text"))));



CREATE POLICY "Admins can view all roles" ON "public"."user_roles" FOR SELECT TO "authenticated" USING (("auth"."uid"() IN ( SELECT "user_roles_1"."user_id"
   FROM "public"."user_roles" "user_roles_1"
  WHERE ("user_roles_1"."role" = 'admin'::"text"))));



CREATE POLICY "Enable insert for authenticated users only" ON "public"."notification" FOR INSERT TO "authenticated" WITH CHECK (("created_by" = "auth"."uid"()));



CREATE POLICY "Enable read access for all users" ON "public"."distillation_schedule" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."drums" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."raw_materials" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."stock_drum" FOR SELECT TO "authenticated", "prisma" USING (true);



CREATE POLICY "Enable users to view their own data only" ON "public"."notification" FOR SELECT TO "authenticated" USING (((( SELECT "auth"."uid"() AS "uid") = "created_by") OR ("audience_type" = 'All'::"text")));



CREATE POLICY "Management can modify records" ON "public"."stock_drum" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = "auth"."uid"()) AND ("user_roles"."role" = ANY (ARRAY['admin'::"text", 'supervisor'::"text", 'manager'::"text"]))))));



CREATE POLICY "Public profiles are viewable by everyone." ON "public"."user_profiles" FOR SELECT USING (true);



CREATE POLICY "Users can insert their own profile" ON "public"."user_profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can update their own profile" ON "public"."user_profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view their own role" ON "public"."user_roles" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Workers can view their own passcodes" ON "public"."worker_passcodes" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."active_context" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bottle_sizes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."chemical_group_kind" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."distillation_pending_assignment" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."distillation_record" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."distillation_schedule" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."distillation_schedule_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."drum_status_transition" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."drums" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."log_drum_decommission" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."log_drum_scan" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."log_load_still" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."log_start_distillation" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."log_transport_drum" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."log_volume_transfer" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notification" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."order_detail" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."product_prices" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."raw_materials" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ref_materials" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ref_stills" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ref_suppliers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."stock_drum" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."stock_new" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."stock_order" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."stock_repro" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."supplier_material" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."worker_passcodes" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";





GRANT USAGE ON SCHEMA "inventory" TO "anon";
GRANT USAGE ON SCHEMA "inventory" TO "authenticated";
GRANT USAGE ON SCHEMA "inventory" TO "service_role";



REVOKE USAGE ON SCHEMA "public" FROM PUBLIC;
GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";
GRANT ALL ON SCHEMA "public" TO "prisma";





















































































































































































































































































































GRANT ALL ON FUNCTION "inventory"."add_to_repro_drum"("distillation_id" integer, "repro_material" character varying, "volume_to_add" integer) TO "anon";
GRANT ALL ON FUNCTION "inventory"."add_to_repro_drum"("distillation_id" integer, "repro_material" character varying, "volume_to_add" integer) TO "authenticated";
GRANT ALL ON FUNCTION "inventory"."add_to_repro_drum"("distillation_id" integer, "repro_material" character varying, "volume_to_add" integer) TO "service_role";



GRANT ALL ON FUNCTION "inventory"."create_new_drums"() TO "anon";
GRANT ALL ON FUNCTION "inventory"."create_new_drums"() TO "authenticated";
GRANT ALL ON FUNCTION "inventory"."create_new_drums"() TO "service_role";



GRANT ALL ON FUNCTION "inventory"."delete_expired_notifications"() TO "anon";
GRANT ALL ON FUNCTION "inventory"."delete_expired_notifications"() TO "authenticated";
GRANT ALL ON FUNCTION "inventory"."delete_expired_notifications"() TO "service_role";



GRANT ALL ON FUNCTION "inventory"."enforce_stock_id_constraint"() TO "anon";
GRANT ALL ON FUNCTION "inventory"."enforce_stock_id_constraint"() TO "authenticated";
GRANT ALL ON FUNCTION "inventory"."enforce_stock_id_constraint"() TO "service_role";



GRANT ALL ON FUNCTION "inventory"."generate_stock_drums"() TO "anon";
GRANT ALL ON FUNCTION "inventory"."generate_stock_drums"() TO "authenticated";
GRANT ALL ON FUNCTION "inventory"."generate_stock_drums"() TO "service_role";



GRANT ALL ON FUNCTION "inventory"."get_drum_inventory"("material" character varying) TO "anon";
GRANT ALL ON FUNCTION "inventory"."get_drum_inventory"("material" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "inventory"."get_drum_inventory"("material" character varying) TO "service_role";



GRANT ALL ON FUNCTION "inventory"."handle_disposal_loss_transaction"() TO "anon";
GRANT ALL ON FUNCTION "inventory"."handle_disposal_loss_transaction"() TO "authenticated";
GRANT ALL ON FUNCTION "inventory"."handle_disposal_loss_transaction"() TO "service_role";



GRANT ALL ON FUNCTION "inventory"."handle_empty_drums"() TO "anon";
GRANT ALL ON FUNCTION "inventory"."handle_empty_drums"() TO "authenticated";
GRANT ALL ON FUNCTION "inventory"."handle_empty_drums"() TO "service_role";



GRANT ALL ON FUNCTION "inventory"."handle_intake_transaction"() TO "anon";
GRANT ALL ON FUNCTION "inventory"."handle_intake_transaction"() TO "authenticated";
GRANT ALL ON FUNCTION "inventory"."handle_intake_transaction"() TO "service_role";



GRANT ALL ON FUNCTION "inventory"."handle_processed_transaction"() TO "anon";
GRANT ALL ON FUNCTION "inventory"."handle_processed_transaction"() TO "authenticated";
GRANT ALL ON FUNCTION "inventory"."handle_processed_transaction"() TO "service_role";



GRANT ALL ON FUNCTION "inventory"."handle_processing_transaction"() TO "anon";
GRANT ALL ON FUNCTION "inventory"."handle_processing_transaction"() TO "authenticated";
GRANT ALL ON FUNCTION "inventory"."handle_processing_transaction"() TO "service_role";



GRANT ALL ON FUNCTION "inventory"."insert_stock_new"() TO "anon";
GRANT ALL ON FUNCTION "inventory"."insert_stock_new"() TO "authenticated";
GRANT ALL ON FUNCTION "inventory"."insert_stock_new"() TO "service_role";



GRANT ALL ON FUNCTION "inventory"."mass_to_volume"("_material_id" integer, "_weight" numeric) TO "anon";
GRANT ALL ON FUNCTION "inventory"."mass_to_volume"("_material_id" integer, "_weight" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "inventory"."mass_to_volume"("_material_id" integer, "_weight" numeric) TO "service_role";



GRANT ALL ON FUNCTION "inventory"."prevent_excess_deliveries"() TO "anon";
GRANT ALL ON FUNCTION "inventory"."prevent_excess_deliveries"() TO "authenticated";
GRANT ALL ON FUNCTION "inventory"."prevent_excess_deliveries"() TO "service_role";



GRANT ALL ON FUNCTION "inventory"."set_drum_volume"() TO "anon";
GRANT ALL ON FUNCTION "inventory"."set_drum_volume"() TO "authenticated";
GRANT ALL ON FUNCTION "inventory"."set_drum_volume"() TO "service_role";



GRANT ALL ON FUNCTION "inventory"."set_eta_range"() TO "anon";
GRANT ALL ON FUNCTION "inventory"."set_eta_range"() TO "authenticated";
GRANT ALL ON FUNCTION "inventory"."set_eta_range"() TO "service_role";



GRANT ALL ON FUNCTION "inventory"."set_material_id"() TO "anon";
GRANT ALL ON FUNCTION "inventory"."set_material_id"() TO "authenticated";
GRANT ALL ON FUNCTION "inventory"."set_material_id"() TO "service_role";



GRANT ALL ON FUNCTION "inventory"."set_material_type"() TO "anon";
GRANT ALL ON FUNCTION "inventory"."set_material_type"() TO "authenticated";
GRANT ALL ON FUNCTION "inventory"."set_material_type"() TO "service_role";



GRANT ALL ON FUNCTION "inventory"."set_supplier_id"() TO "anon";
GRANT ALL ON FUNCTION "inventory"."set_supplier_id"() TO "authenticated";
GRANT ALL ON FUNCTION "inventory"."set_supplier_id"() TO "service_role";



GRANT ALL ON FUNCTION "inventory"."update_order_status_on_transaction"() TO "anon";
GRANT ALL ON FUNCTION "inventory"."update_order_status_on_transaction"() TO "authenticated";
GRANT ALL ON FUNCTION "inventory"."update_order_status_on_transaction"() TO "service_role";



GRANT ALL ON FUNCTION "inventory"."update_repro_drum_status"() TO "anon";
GRANT ALL ON FUNCTION "inventory"."update_repro_drum_status"() TO "authenticated";
GRANT ALL ON FUNCTION "inventory"."update_repro_drum_status"() TO "service_role";



GRANT ALL ON FUNCTION "inventory"."update_stock_drums_status"() TO "anon";
GRANT ALL ON FUNCTION "inventory"."update_stock_drums_status"() TO "authenticated";
GRANT ALL ON FUNCTION "inventory"."update_stock_drums_status"() TO "service_role";



GRANT ALL ON FUNCTION "inventory"."update_stock_new_on_arrival"() TO "anon";
GRANT ALL ON FUNCTION "inventory"."update_stock_new_on_arrival"() TO "authenticated";
GRANT ALL ON FUNCTION "inventory"."update_stock_new_on_arrival"() TO "service_role";












GRANT ALL ON FUNCTION "public"."add_to_repro_drum"("distillation_id" integer, "repro_material" character varying, "volume_to_add" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."add_to_repro_drum"("distillation_id" integer, "repro_material" character varying, "volume_to_add" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_to_repro_drum"("distillation_id" integer, "repro_material" character varying, "volume_to_add" integer) TO "service_role";
GRANT ALL ON FUNCTION "public"."add_to_repro_drum"("distillation_id" integer, "repro_material" character varying, "volume_to_add" integer) TO "prisma";



GRANT ALL ON FUNCTION "public"."date_add"("arg1" timestamp with time zone, "arg2" interval) TO "anon";
GRANT ALL ON FUNCTION "public"."date_add"("arg1" timestamp with time zone, "arg2" interval) TO "authenticated";
GRANT ALL ON FUNCTION "public"."date_add"("arg1" timestamp with time zone, "arg2" interval) TO "service_role";
GRANT ALL ON FUNCTION "public"."date_add"("arg1" timestamp with time zone, "arg2" interval) TO "prisma";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "prisma";



GRANT ALL ON FUNCTION "public"."mass_to_volume"("material_id" integer, "weight" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."mass_to_volume"("material_id" integer, "weight" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."mass_to_volume"("material_id" integer, "weight" numeric) TO "service_role";
GRANT ALL ON FUNCTION "public"."mass_to_volume"("material_id" integer, "weight" numeric) TO "prisma";



GRANT ALL ON FUNCTION "public"."update_modified_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_modified_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_modified_column"() TO "service_role";
GRANT ALL ON FUNCTION "public"."update_modified_column"() TO "prisma";



GRANT ALL ON FUNCTION "public"."update_timestamp"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_timestamp"() TO "service_role";
GRANT ALL ON FUNCTION "public"."update_timestamp"() TO "prisma";



GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "service_role";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "prisma";


















GRANT ALL ON TABLE "obselete"."deliveries" TO "anon";
GRANT ALL ON TABLE "obselete"."deliveries" TO "authenticated";
GRANT ALL ON TABLE "obselete"."deliveries" TO "service_role";



GRANT ALL ON TABLE "obselete"."new_drums" TO "anon";
GRANT ALL ON TABLE "obselete"."new_drums" TO "authenticated";
GRANT ALL ON TABLE "obselete"."new_drums" TO "service_role";



GRANT ALL ON TABLE "obselete"."orders" TO "anon";
GRANT ALL ON TABLE "obselete"."orders" TO "authenticated";
GRANT ALL ON TABLE "obselete"."orders" TO "service_role";



GRANT ALL ON TABLE "obselete"."delivered_drums" TO "anon";
GRANT ALL ON TABLE "obselete"."delivered_drums" TO "authenticated";
GRANT ALL ON TABLE "obselete"."delivered_drums" TO "service_role";



GRANT ALL ON SEQUENCE "obselete"."deliveries_delivery_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "obselete"."deliveries_delivery_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "obselete"."deliveries_delivery_id_seq" TO "service_role";



GRANT ALL ON TABLE "obselete"."distillations" TO "anon";
GRANT ALL ON TABLE "obselete"."distillations" TO "authenticated";
GRANT ALL ON TABLE "obselete"."distillations" TO "service_role";



GRANT ALL ON SEQUENCE "obselete"."distillations_distillation_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "obselete"."distillations_distillation_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "obselete"."distillations_distillation_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "obselete"."new_drums_drum_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "obselete"."new_drums_drum_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "obselete"."new_drums_drum_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "obselete"."orders_order_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "obselete"."orders_order_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "obselete"."orders_order_id_seq" TO "service_role";



GRANT ALL ON TABLE "obselete"."repro_drums" TO "anon";
GRANT ALL ON TABLE "obselete"."repro_drums" TO "authenticated";
GRANT ALL ON TABLE "obselete"."repro_drums" TO "service_role";



GRANT ALL ON SEQUENCE "obselete"."repro_drums_repro_drum_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "obselete"."repro_drums_repro_drum_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "obselete"."repro_drums_repro_drum_id_seq" TO "service_role";



GRANT ALL ON TABLE "obselete"."transactions" TO "anon";
GRANT ALL ON TABLE "obselete"."transactions" TO "authenticated";
GRANT ALL ON TABLE "obselete"."transactions" TO "service_role";



GRANT ALL ON SEQUENCE "obselete"."transactions_tx_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "obselete"."transactions_tx_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "obselete"."transactions_tx_id_seq" TO "service_role";



GRANT ALL ON TABLE "obselete"."transactions_view" TO "anon";
GRANT ALL ON TABLE "obselete"."transactions_view" TO "authenticated";
GRANT ALL ON TABLE "obselete"."transactions_view" TO "service_role";












GRANT ALL ON TABLE "production"."employees" TO "anon";
GRANT ALL ON TABLE "production"."employees" TO "authenticated";
GRANT ALL ON TABLE "production"."employees" TO "service_role";
GRANT ALL ON TABLE "production"."employees" TO "prisma";



GRANT ALL ON SEQUENCE "production"."employees_employee_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "production"."employees_employee_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "production"."employees_employee_id_seq" TO "service_role";
GRANT ALL ON SEQUENCE "production"."employees_employee_id_seq" TO "prisma";



GRANT ALL ON TABLE "public"."active_context" TO "anon";
GRANT ALL ON TABLE "public"."active_context" TO "authenticated";
GRANT ALL ON TABLE "public"."active_context" TO "service_role";
GRANT ALL ON TABLE "public"."active_context" TO "prisma";



GRANT ALL ON SEQUENCE "public"."active_context_context_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."active_context_context_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."active_context_context_id_seq" TO "service_role";
GRANT ALL ON SEQUENCE "public"."active_context_context_id_seq" TO "prisma";



GRANT ALL ON TABLE "public"."auth_activity_log" TO "anon";
GRANT ALL ON TABLE "public"."auth_activity_log" TO "authenticated";
GRANT ALL ON TABLE "public"."auth_activity_log" TO "service_role";
GRANT ALL ON TABLE "public"."auth_activity_log" TO "prisma";



GRANT ALL ON TABLE "public"."bottle_sizes" TO "anon";
GRANT ALL ON TABLE "public"."bottle_sizes" TO "authenticated";
GRANT ALL ON TABLE "public"."bottle_sizes" TO "service_role";
GRANT ALL ON TABLE "public"."bottle_sizes" TO "prisma";



GRANT ALL ON SEQUENCE "public"."bottle_sizes_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."bottle_sizes_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."bottle_sizes_id_seq" TO "service_role";
GRANT ALL ON SEQUENCE "public"."bottle_sizes_id_seq" TO "prisma";



GRANT ALL ON TABLE "public"."raw_materials" TO "anon";
GRANT ALL ON TABLE "public"."raw_materials" TO "authenticated";
GRANT ALL ON TABLE "public"."raw_materials" TO "service_role";
GRANT ALL ON TABLE "public"."raw_materials" TO "prisma";



GRANT ALL ON TABLE "public"."chemical_class_groups" TO "anon";
GRANT ALL ON TABLE "public"."chemical_class_groups" TO "authenticated";
GRANT ALL ON TABLE "public"."chemical_class_groups" TO "service_role";
GRANT ALL ON TABLE "public"."chemical_class_groups" TO "prisma";



GRANT ALL ON TABLE "public"."chemical_group_kind" TO "anon";
GRANT ALL ON TABLE "public"."chemical_group_kind" TO "authenticated";
GRANT ALL ON TABLE "public"."chemical_group_kind" TO "service_role";
GRANT ALL ON TABLE "public"."chemical_group_kind" TO "prisma";



GRANT ALL ON TABLE "public"."log_load_still" TO "anon";
GRANT ALL ON TABLE "public"."log_load_still" TO "authenticated";
GRANT ALL ON TABLE "public"."log_load_still" TO "service_role";
GRANT ALL ON TABLE "public"."log_load_still" TO "prisma";



GRANT ALL ON SEQUENCE "public"."distillation_loading_log_loading_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."distillation_loading_log_loading_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."distillation_loading_log_loading_id_seq" TO "service_role";
GRANT ALL ON SEQUENCE "public"."distillation_loading_log_loading_id_seq" TO "prisma";



GRANT ALL ON TABLE "public"."distillation_pending_assignment" TO "anon";
GRANT ALL ON TABLE "public"."distillation_pending_assignment" TO "authenticated";
GRANT ALL ON TABLE "public"."distillation_pending_assignment" TO "service_role";
GRANT ALL ON TABLE "public"."distillation_pending_assignment" TO "prisma";



GRANT ALL ON SEQUENCE "public"."distillation_pending_assignments_pending_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."distillation_pending_assignments_pending_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."distillation_pending_assignments_pending_id_seq" TO "service_role";
GRANT ALL ON SEQUENCE "public"."distillation_pending_assignments_pending_id_seq" TO "prisma";



GRANT ALL ON TABLE "public"."distillation_record" TO "anon";
GRANT ALL ON TABLE "public"."distillation_record" TO "authenticated";
GRANT ALL ON TABLE "public"."distillation_record" TO "service_role";
GRANT ALL ON TABLE "public"."distillation_record" TO "prisma";



GRANT ALL ON SEQUENCE "public"."distillation_records_record_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."distillation_records_record_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."distillation_records_record_id_seq" TO "service_role";
GRANT ALL ON SEQUENCE "public"."distillation_records_record_id_seq" TO "prisma";



GRANT ALL ON TABLE "public"."distillation_schedule" TO "anon";
GRANT ALL ON TABLE "public"."distillation_schedule" TO "authenticated";
GRANT ALL ON TABLE "public"."distillation_schedule" TO "service_role";
GRANT ALL ON TABLE "public"."distillation_schedule" TO "prisma";



GRANT ALL ON TABLE "public"."distillation_schedule_items" TO "anon";
GRANT ALL ON TABLE "public"."distillation_schedule_items" TO "authenticated";
GRANT ALL ON TABLE "public"."distillation_schedule_items" TO "service_role";
GRANT ALL ON TABLE "public"."distillation_schedule_items" TO "prisma";



GRANT ALL ON SEQUENCE "public"."distillation_schedules_details_details_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."distillation_schedules_details_details_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."distillation_schedules_details_details_id_seq" TO "service_role";
GRANT ALL ON SEQUENCE "public"."distillation_schedules_details_details_id_seq" TO "prisma";



GRANT ALL ON SEQUENCE "public"."distillation_schedules_distillation_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."distillation_schedules_distillation_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."distillation_schedules_distillation_id_seq" TO "service_role";
GRANT ALL ON SEQUENCE "public"."distillation_schedules_distillation_id_seq" TO "prisma";



GRANT ALL ON TABLE "public"."log_start_distillation" TO "anon";
GRANT ALL ON TABLE "public"."log_start_distillation" TO "authenticated";
GRANT ALL ON TABLE "public"."log_start_distillation" TO "service_role";
GRANT ALL ON TABLE "public"."log_start_distillation" TO "prisma";



GRANT ALL ON SEQUENCE "public"."distillation_start_log_start_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."distillation_start_log_start_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."distillation_start_log_start_id_seq" TO "service_role";
GRANT ALL ON SEQUENCE "public"."distillation_start_log_start_id_seq" TO "prisma";



GRANT ALL ON TABLE "public"."log_transport_drum" TO "anon";
GRANT ALL ON TABLE "public"."log_transport_drum" TO "authenticated";
GRANT ALL ON TABLE "public"."log_transport_drum" TO "service_role";
GRANT ALL ON TABLE "public"."log_transport_drum" TO "prisma";



GRANT ALL ON SEQUENCE "public"."distillation_transport_log_transport_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."distillation_transport_log_transport_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."distillation_transport_log_transport_id_seq" TO "service_role";
GRANT ALL ON SEQUENCE "public"."distillation_transport_log_transport_id_seq" TO "prisma";



GRANT ALL ON TABLE "public"."drum_order_details" TO "anon";
GRANT ALL ON TABLE "public"."drum_order_details" TO "authenticated";
GRANT ALL ON TABLE "public"."drum_order_details" TO "service_role";
GRANT ALL ON TABLE "public"."drum_order_details" TO "prisma";



GRANT ALL ON TABLE "public"."drum_status_transition" TO "anon";
GRANT ALL ON TABLE "public"."drum_status_transition" TO "authenticated";
GRANT ALL ON TABLE "public"."drum_status_transition" TO "service_role";
GRANT ALL ON TABLE "public"."drum_status_transition" TO "prisma";



GRANT ALL ON TABLE "public"."drums" TO "anon";
GRANT ALL ON TABLE "public"."drums" TO "authenticated";
GRANT ALL ON TABLE "public"."drums" TO "service_role";
GRANT ALL ON TABLE "public"."drums" TO "prisma";



GRANT ALL ON SEQUENCE "public"."drums_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."drums_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."drums_id_seq" TO "service_role";
GRANT ALL ON SEQUENCE "public"."drums_id_seq" TO "prisma";



GRANT ALL ON TABLE "public"."log_drum_decommission" TO "anon";
GRANT ALL ON TABLE "public"."log_drum_decommission" TO "authenticated";
GRANT ALL ON TABLE "public"."log_drum_decommission" TO "service_role";
GRANT ALL ON TABLE "public"."log_drum_decommission" TO "prisma";



GRANT ALL ON SEQUENCE "public"."log_drum_decommission_decommission_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."log_drum_decommission_decommission_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."log_drum_decommission_decommission_id_seq" TO "service_role";
GRANT ALL ON SEQUENCE "public"."log_drum_decommission_decommission_id_seq" TO "prisma";



GRANT ALL ON TABLE "public"."log_drum_scan" TO "anon";
GRANT ALL ON TABLE "public"."log_drum_scan" TO "authenticated";
GRANT ALL ON TABLE "public"."log_drum_scan" TO "service_role";
GRANT ALL ON TABLE "public"."log_drum_scan" TO "prisma";



GRANT ALL ON TABLE "public"."log_volume_transfer" TO "anon";
GRANT ALL ON TABLE "public"."log_volume_transfer" TO "authenticated";
GRANT ALL ON TABLE "public"."log_volume_transfer" TO "service_role";
GRANT ALL ON TABLE "public"."log_volume_transfer" TO "prisma";



GRANT ALL ON SEQUENCE "public"."log_volume_transfers_transfer_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."log_volume_transfers_transfer_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."log_volume_transfers_transfer_id_seq" TO "service_role";
GRANT ALL ON SEQUENCE "public"."log_volume_transfers_transfer_id_seq" TO "prisma";



GRANT ALL ON TABLE "public"."stock_history" TO "anon";
GRANT ALL ON TABLE "public"."stock_history" TO "authenticated";
GRANT ALL ON TABLE "public"."stock_history" TO "service_role";
GRANT ALL ON TABLE "public"."stock_history" TO "prisma";



GRANT ALL ON TABLE "public"."material_consumption" TO "anon";
GRANT ALL ON TABLE "public"."material_consumption" TO "authenticated";
GRANT ALL ON TABLE "public"."material_consumption" TO "service_role";
GRANT ALL ON TABLE "public"."material_consumption" TO "prisma";



GRANT ALL ON TABLE "public"."notification" TO "anon";
GRANT ALL ON TABLE "public"."notification" TO "authenticated";
GRANT ALL ON TABLE "public"."notification" TO "service_role";
GRANT ALL ON TABLE "public"."notification" TO "prisma";



GRANT ALL ON SEQUENCE "public"."notifications_notification_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."notifications_notification_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."notifications_notification_id_seq" TO "service_role";
GRANT ALL ON SEQUENCE "public"."notifications_notification_id_seq" TO "prisma";



GRANT ALL ON TABLE "public"."order_detail" TO "anon";
GRANT ALL ON TABLE "public"."order_detail" TO "authenticated";
GRANT ALL ON TABLE "public"."order_detail" TO "service_role";
GRANT ALL ON TABLE "public"."order_detail" TO "prisma";



GRANT ALL ON TABLE "public"."product_prices" TO "anon";
GRANT ALL ON TABLE "public"."product_prices" TO "authenticated";
GRANT ALL ON TABLE "public"."product_prices" TO "service_role";
GRANT ALL ON TABLE "public"."product_prices" TO "prisma";



GRANT ALL ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";
GRANT ALL ON TABLE "public"."products" TO "service_role";
GRANT ALL ON TABLE "public"."products" TO "prisma";



GRANT ALL ON TABLE "public"."product_source_material" TO "anon";
GRANT ALL ON TABLE "public"."product_source_material" TO "authenticated";
GRANT ALL ON TABLE "public"."product_source_material" TO "service_role";
GRANT ALL ON TABLE "public"."product_source_material" TO "prisma";



GRANT ALL ON TABLE "public"."product_table" TO "anon";
GRANT ALL ON TABLE "public"."product_table" TO "authenticated";
GRANT ALL ON TABLE "public"."product_table" TO "service_role";
GRANT ALL ON TABLE "public"."product_table" TO "prisma";



GRANT ALL ON SEQUENCE "public"."products_product_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."products_product_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."products_product_id_seq" TO "service_role";
GRANT ALL ON SEQUENCE "public"."products_product_id_seq" TO "prisma";



GRANT ALL ON TABLE "public"."raw_drum_archives" TO "anon";
GRANT ALL ON TABLE "public"."raw_drum_archives" TO "authenticated";
GRANT ALL ON TABLE "public"."raw_drum_archives" TO "service_role";
GRANT ALL ON TABLE "public"."raw_drum_archives" TO "prisma";



GRANT ALL ON SEQUENCE "public"."raw_materials_raw_material_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."raw_materials_raw_material_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."raw_materials_raw_material_id_seq" TO "service_role";
GRANT ALL ON SEQUENCE "public"."raw_materials_raw_material_id_seq" TO "prisma";



GRANT ALL ON TABLE "public"."raw_stock_history" TO "anon";
GRANT ALL ON TABLE "public"."raw_stock_history" TO "authenticated";
GRANT ALL ON TABLE "public"."raw_stock_history" TO "service_role";
GRANT ALL ON TABLE "public"."raw_stock_history" TO "prisma";



GRANT ALL ON SEQUENCE "public"."raw_stock_history_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."raw_stock_history_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."raw_stock_history_id_seq" TO "service_role";
GRANT ALL ON SEQUENCE "public"."raw_stock_history_id_seq" TO "prisma";



GRANT ALL ON TABLE "public"."ref_materials" TO "anon";
GRANT ALL ON TABLE "public"."ref_materials" TO "authenticated";
GRANT ALL ON TABLE "public"."ref_materials" TO "service_role";
GRANT ALL ON TABLE "public"."ref_materials" TO "prisma";



GRANT ALL ON TABLE "public"."ref_stills" TO "anon";
GRANT ALL ON TABLE "public"."ref_stills" TO "authenticated";
GRANT ALL ON TABLE "public"."ref_stills" TO "service_role";
GRANT ALL ON TABLE "public"."ref_stills" TO "prisma";



GRANT ALL ON TABLE "public"."ref_suppliers" TO "anon";
GRANT ALL ON TABLE "public"."ref_suppliers" TO "authenticated";
GRANT ALL ON TABLE "public"."ref_suppliers" TO "service_role";
GRANT ALL ON TABLE "public"."ref_suppliers" TO "prisma";



GRANT ALL ON SEQUENCE "public"."scan_log_scan_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."scan_log_scan_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."scan_log_scan_id_seq" TO "service_role";
GRANT ALL ON SEQUENCE "public"."scan_log_scan_id_seq" TO "prisma";



GRANT ALL ON TABLE "public"."session_settings" TO "anon";
GRANT ALL ON TABLE "public"."session_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."session_settings" TO "service_role";
GRANT ALL ON TABLE "public"."session_settings" TO "prisma";



GRANT ALL ON SEQUENCE "public"."stills_still_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."stills_still_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."stills_still_id_seq" TO "service_role";
GRANT ALL ON SEQUENCE "public"."stills_still_id_seq" TO "prisma";



GRANT ALL ON TABLE "public"."stock_drum" TO "anon";
GRANT ALL ON TABLE "public"."stock_drum" TO "authenticated";
GRANT ALL ON TABLE "public"."stock_drum" TO "service_role";
GRANT ALL ON TABLE "public"."stock_drum" TO "prisma";



GRANT ALL ON TABLE "public"."stock_drum_new" TO "anon";
GRANT ALL ON TABLE "public"."stock_drum_new" TO "authenticated";
GRANT ALL ON TABLE "public"."stock_drum_new" TO "service_role";
GRANT ALL ON TABLE "public"."stock_drum_new" TO "prisma";



GRANT ALL ON SEQUENCE "public"."stock_drum_new_drum_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."stock_drum_new_drum_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."stock_drum_new_drum_id_seq" TO "service_role";
GRANT ALL ON SEQUENCE "public"."stock_drum_new_drum_id_seq" TO "prisma";



GRANT ALL ON SEQUENCE "public"."stock_drums_drum_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."stock_drums_drum_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."stock_drums_drum_id_seq" TO "service_role";
GRANT ALL ON SEQUENCE "public"."stock_drums_drum_id_seq" TO "prisma";



GRANT ALL ON TABLE "public"."stock_history_analysis" TO "anon";
GRANT ALL ON TABLE "public"."stock_history_analysis" TO "authenticated";
GRANT ALL ON TABLE "public"."stock_history_analysis" TO "service_role";
GRANT ALL ON TABLE "public"."stock_history_analysis" TO "prisma";



GRANT ALL ON SEQUENCE "public"."stock_history_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."stock_history_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."stock_history_id_seq" TO "service_role";
GRANT ALL ON SEQUENCE "public"."stock_history_id_seq" TO "prisma";



GRANT ALL ON TABLE "public"."stock_new" TO "anon";
GRANT ALL ON TABLE "public"."stock_new" TO "authenticated";
GRANT ALL ON TABLE "public"."stock_new" TO "service_role";
GRANT ALL ON TABLE "public"."stock_new" TO "prisma";



GRANT ALL ON SEQUENCE "public"."stock_new_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."stock_new_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."stock_new_id_seq" TO "service_role";
GRANT ALL ON SEQUENCE "public"."stock_new_id_seq" TO "prisma";



GRANT ALL ON TABLE "public"."stock_order" TO "anon";
GRANT ALL ON TABLE "public"."stock_order" TO "authenticated";
GRANT ALL ON TABLE "public"."stock_order" TO "service_role";
GRANT ALL ON TABLE "public"."stock_order" TO "prisma";



GRANT ALL ON SEQUENCE "public"."stock_order_details_detail_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."stock_order_details_detail_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."stock_order_details_detail_id_seq" TO "service_role";
GRANT ALL ON SEQUENCE "public"."stock_order_details_detail_id_seq" TO "prisma";



GRANT ALL ON SEQUENCE "public"."stock_orders_order_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."stock_orders_order_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."stock_orders_order_id_seq" TO "service_role";
GRANT ALL ON SEQUENCE "public"."stock_orders_order_id_seq" TO "prisma";



GRANT ALL ON TABLE "public"."stock_repro" TO "anon";
GRANT ALL ON TABLE "public"."stock_repro" TO "authenticated";
GRANT ALL ON TABLE "public"."stock_repro" TO "service_role";
GRANT ALL ON TABLE "public"."stock_repro" TO "prisma";



GRANT ALL ON SEQUENCE "public"."stock_repro_drum_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."stock_repro_drum_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."stock_repro_drum_id_seq" TO "service_role";
GRANT ALL ON SEQUENCE "public"."stock_repro_drum_id_seq" TO "prisma";



GRANT ALL ON TABLE "public"."supplier_analysis" TO "anon";
GRANT ALL ON TABLE "public"."supplier_analysis" TO "authenticated";
GRANT ALL ON TABLE "public"."supplier_analysis" TO "service_role";
GRANT ALL ON TABLE "public"."supplier_analysis" TO "prisma";



GRANT ALL ON TABLE "public"."supplier_material" TO "anon";
GRANT ALL ON TABLE "public"."supplier_material" TO "authenticated";
GRANT ALL ON TABLE "public"."supplier_material" TO "service_role";
GRANT ALL ON TABLE "public"."supplier_material" TO "prisma";



GRANT ALL ON SEQUENCE "public"."suppliers_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."suppliers_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."suppliers_id_seq" TO "service_role";
GRANT ALL ON SEQUENCE "public"."suppliers_id_seq" TO "prisma";



GRANT ALL ON TABLE "public"."user_profiles" TO "anon";
GRANT ALL ON TABLE "public"."user_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_profiles" TO "service_role";
GRANT ALL ON TABLE "public"."user_profiles" TO "prisma";



GRANT ALL ON TABLE "public"."user_roles" TO "anon";
GRANT ALL ON TABLE "public"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_roles" TO "service_role";
GRANT ALL ON TABLE "public"."user_roles" TO "prisma";



GRANT ALL ON TABLE "public"."vw_active_drums" TO "anon";
GRANT ALL ON TABLE "public"."vw_active_drums" TO "authenticated";
GRANT ALL ON TABLE "public"."vw_active_drums" TO "service_role";
GRANT ALL ON TABLE "public"."vw_active_drums" TO "prisma";



GRANT ALL ON TABLE "public"."vw_current_inventory" TO "anon";
GRANT ALL ON TABLE "public"."vw_current_inventory" TO "authenticated";
GRANT ALL ON TABLE "public"."vw_current_inventory" TO "service_role";
GRANT ALL ON TABLE "public"."vw_current_inventory" TO "prisma";



GRANT ALL ON TABLE "public"."vw_goods_inwards" TO "anon";
GRANT ALL ON TABLE "public"."vw_goods_inwards" TO "authenticated";
GRANT ALL ON TABLE "public"."vw_goods_inwards" TO "service_role";
GRANT ALL ON TABLE "public"."vw_goods_inwards" TO "prisma";



GRANT ALL ON TABLE "public"."vw_order_drum_details" TO "anon";
GRANT ALL ON TABLE "public"."vw_order_drum_details" TO "authenticated";
GRANT ALL ON TABLE "public"."vw_order_drum_details" TO "service_role";
GRANT ALL ON TABLE "public"."vw_order_drum_details" TO "prisma";



GRANT ALL ON TABLE "public"."vw_order_history" TO "anon";
GRANT ALL ON TABLE "public"."vw_order_history" TO "authenticated";
GRANT ALL ON TABLE "public"."vw_order_history" TO "service_role";
GRANT ALL ON TABLE "public"."vw_order_history" TO "prisma";



GRANT ALL ON TABLE "public"."vw_pending_assignments" TO "anon";
GRANT ALL ON TABLE "public"."vw_pending_assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."vw_pending_assignments" TO "service_role";
GRANT ALL ON TABLE "public"."vw_pending_assignments" TO "prisma";



GRANT ALL ON TABLE "public"."vw_recent_order_details" TO "anon";
GRANT ALL ON TABLE "public"."vw_recent_order_details" TO "authenticated";
GRANT ALL ON TABLE "public"."vw_recent_order_details" TO "service_role";
GRANT ALL ON TABLE "public"."vw_recent_order_details" TO "prisma";



GRANT ALL ON TABLE "public"."worker_passcodes" TO "anon";
GRANT ALL ON TABLE "public"."worker_passcodes" TO "authenticated";
GRANT ALL ON TABLE "public"."worker_passcodes" TO "service_role";
GRANT ALL ON TABLE "public"."worker_passcodes" TO "prisma";



GRANT ALL ON TABLE "temp"."temp_data" TO "anon";
GRANT ALL ON TABLE "temp"."temp_data" TO "authenticated";
GRANT ALL ON TABLE "temp"."temp_data" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "inventory" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "inventory" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "inventory" GRANT ALL ON SEQUENCES  TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "inventory" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "inventory" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "inventory" GRANT ALL ON FUNCTIONS  TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "inventory" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "inventory" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "inventory" GRANT ALL ON TABLES  TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "prisma";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "prisma";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "prisma";






























RESET ALL;
