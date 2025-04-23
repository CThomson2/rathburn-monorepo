

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


CREATE SCHEMA IF NOT EXISTS "auth_ext";


ALTER SCHEMA "auth_ext" OWNER TO "postgres";


CREATE SCHEMA IF NOT EXISTS "config";


ALTER SCHEMA "config" OWNER TO "postgres";


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






CREATE SCHEMA IF NOT EXISTS "inventory";


ALTER SCHEMA "inventory" OWNER TO "postgres";


CREATE SCHEMA IF NOT EXISTS "logs";


ALTER SCHEMA "logs" OWNER TO "postgres";


CREATE EXTENSION IF NOT EXISTS "pgsodium";






CREATE SCHEMA IF NOT EXISTS "production";


ALTER SCHEMA "production" OWNER TO "postgres";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE SCHEMA IF NOT EXISTS "ui";


ALTER SCHEMA "ui" OWNER TO "postgres";


CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "wrappers" WITH SCHEMA "extensions";






CREATE TYPE "inventory"."action_type" AS ENUM (
    'context_get',
    'context_set',
    'transport',
    'location_set'
);


ALTER TYPE "inventory"."action_type" OWNER TO "postgres";


COMMENT ON TYPE "inventory"."action_type" IS 'Type of barcode scan actions. Sets temporary context in device_context table, to link a still with drum being loaded. Context_get retrieves information on active context (or lack thereof). Both of these actions are for QR code scans. Transport and still_[...] actions are on barcodes. Location_set is used for confirming location of transferred items (drums, bottles, batches etc.). Locations and sub-locations e.g. aisles in a warehouse will have individual QR codes linked to `inventory.locations` table.';



CREATE TYPE "inventory"."batch_type" AS ENUM (
    'new',
    'repro'
);


ALTER TYPE "inventory"."batch_type" OWNER TO "postgres";


COMMENT ON TYPE "inventory"."batch_type" IS 'Raw stock material; Reprocessing material';



CREATE TYPE "inventory"."drum_status" AS ENUM (
    'in_stock',
    'reserved',
    'in_production',
    'empty',
    'lost'
);


ALTER TYPE "inventory"."drum_status" OWNER TO "postgres";


CREATE TYPE "production"."context_type" AS ENUM (
    'distillation',
    'warehouse'
);


ALTER TYPE "production"."context_type" OWNER TO "postgres";


COMMENT ON TYPE "production"."context_type" IS 'Type for business context related to scanning logic.';



CREATE TYPE "production"."job_status" AS ENUM (
    'scheduled',
    'confirmed',
    'in_progress',
    'paused',
    'completed',
    'failed',
    'cancelled'
);


ALTER TYPE "production"."job_status" OWNER TO "postgres";


COMMENT ON TYPE "production"."job_status" IS '1 Enumerated types for well-defined string value constraints based on business logic';



CREATE TYPE "production"."op_status" AS ENUM (
    'pending',
    'active',
    'completed',
    'error'
);


ALTER TYPE "production"."op_status" OWNER TO "postgres";


CREATE TYPE "production"."op_type" AS ENUM (
    'distillation',
    'decanting',
    'qc',
    'split',
    'packaging'
);


ALTER TYPE "production"."op_type" OWNER TO "postgres";


CREATE TYPE "production"."qc_grade" AS ENUM (
    'HPLC',
    'LCMS',
    'GlassDist',
    'HPLC S',
    'PeptideSynth',
    'FailedSpec'
);


ALTER TYPE "production"."qc_grade" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "inventory"."fn_update_batch_volume"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE inventory.batches
    SET total_volume = total_volume + NEW.volume_added,
        updated_at   = now()
  WHERE batch_id = NEW.batch_id;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "inventory"."fn_update_batch_volume"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "inventory"."fn_update_drum_volume"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE inventory.drums
    SET current_volume = current_volume + NEW.volume_added,
        updated_at     = now()
  WHERE drum_id = NEW.drum_id;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "inventory"."fn_update_drum_volume"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "inventory"."receive_delivery"("p_po_id" "uuid", "p_item_id" "uuid", "p_qty" numeric) RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  b_id UUID;
BEGIN
  -- find or create batch for this PO‑line
  
  INSERT INTO inventory.batches(item_id, batch_type, po_id)
    VALUES ((SELECT item_id FROM inventory.items WHERE item_id = p_item_id),
            'new', p_po_id)
    ON CONFLICT (po_id, item_id)
    DO UPDATE SET updated_at = now()
    RETURNING batch_id INTO b_id;

  -- record the input
  INSERT INTO inventory.batch_inputs(batch_id, source_type, source_id, volume_added)
    VALUES (b_id, 'supplier', p_po_id, p_qty);

  RETURN b_id;
END;
$$;


ALTER FUNCTION "inventory"."receive_delivery"("p_po_id" "uuid", "p_item_id" "uuid", "p_qty" numeric) OWNER TO "postgres";


COMMENT ON FUNCTION "inventory"."receive_delivery"("p_po_id" "uuid", "p_item_id" "uuid", "p_qty" numeric) IS 'Call this from your Next.js server action so all logic (batch creation, volume roll‑up, audit) lives in one place';



CREATE OR REPLACE FUNCTION "inventory"."validate_barcode"("barcode" "text") RETURNS "uuid"
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
DECLARE
  inst inventory.items%ROWTYPE;
  drum_id UUID;
BEGIN
  FOR inst IN
    SELECT * FROM inventory.items
    WHERE barcode_regex IS NOT NULL AND barcode ~ inst.barcode_regex
  LOOP
    SELECT drum_id INTO drum_id
      FROM inventory.drums
      WHERE serial_number = barcode;
    RETURN drum_id;  -- could be NULL if drum not yet registered
  END LOOP;
  RETURN NULL;
END;
$$;


ALTER FUNCTION "inventory"."validate_barcode"("barcode" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "logs"."fn_apply_context_to_drum"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$-- Now, whenever we insert a logs.drum_scan (i.e. a drum label scan), we will look for an unexpired device_context. If found, we:

DECLARE
  v_ctx_type production.context_type;
  v_ctx_id   UUID;
  v_expires  TIMESTAMPTZ;
BEGIN
  -- grab the current context for this device
  SELECT context_type, context_id, expires_at
    INTO v_ctx_type, v_ctx_id, v_expires
  FROM production.device_context
  WHERE device_id = NEW.device_id;

  -- if we have a live, unexpired context, use it
  IF FOUND AND v_expires > now() THEN
    INSERT INTO production.operation_drums (
      op_id, drum_id, scan_id, volume_transferred, assigned_at
    ) VALUES (
      v_ctx_id, NEW.drum_id, NEW.scan_id, NULL, now()
    );

    -- mark the scan as “assigned” (optional)
    UPDATE logs.drum_scan
      SET action_type = 'context_set'
      WHERE scan_id = NEW.scan_id;

    -- consume the context so it won’t apply again
    DELETE FROM production.device_context
      WHERE device_id = NEW.device_id;
  END IF;

  RETURN NEW;
END;$$;


ALTER FUNCTION "logs"."fn_apply_context_to_drum"() OWNER TO "postgres";


COMMENT ON FUNCTION "logs"."fn_apply_context_to_drum"() IS 'Now, whenever we insert a logs.drum_scan (i.e. a drum label scan), we will look for an unexpired device_context. If found, we:
- Insert into production.operation_drums.
- Optionally update the scan’s action_type to e.g. "assigned".
- Delete the context row (so each context only applies once)';



CREATE OR REPLACE FUNCTION "logs"."fn_set_context"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
declare
  _ctx production.device_context;
  _id uuid;
BEGIN
  -- 1. Map your high‑level QR type to our enum
  IF NEW.context_type = 'still' THEN
    _ctx := 'distillation';
    _id  := NEW.raw_qr_code::UUID;    -- assume QR is the still_id UUID
  ELSIF NEW.context_type = 'location' THEN
    _ctx := 'warehouse';
    _id  := NEW.raw_qr_code::UUID;    -- or however you encode location
  ELSE
    RETURN NEW;  -- unsupported context
  END IF;

  INSERT INTO production.device_context(device_id, context_type, context_id, created_at, expires_at)
    VALUES (NEW.device_id, _ctx, _id, now(), now() + INTERVAL '1 minute')
  ON CONFLICT (device_id)
    DO UPDATE SET
      context_type = EXCLUDED.context_type,
      context_id   = EXCLUDED.context_id,
      created_at   = now(),
      expires_at   = now() + INTERVAL '1 minute';

  RETURN NEW;
END;
$$;


ALTER FUNCTION "logs"."fn_set_context"() OWNER TO "postgres";


COMMENT ON FUNCTION "logs"."fn_set_context"() IS 'Function to Refresh Context. Checks for valid context_type, then upserts context to `device_context`. Only one context can be active at once.';



CREATE OR REPLACE FUNCTION "logs"."set_detected_drum"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.detected_drum := inventory.validate_barcode(NEW.raw_barcode);
  RETURN NEW;
END;
$$;


ALTER FUNCTION "logs"."set_detected_drum"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "logs"."update_drum_location"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  loc_id UUID;
BEGIN
  IF NEW.status = 'success' AND NEW.action_type = 'putaway' THEN
    -- assume metadata contains {"location_id": "<uuid>"}
    loc_id := (NEW.metadata ->> 'location_id')::UUID;
    UPDATE inventory.drums
      SET current_location = loc_id,
          updated_at = now()
      WHERE drum_id = NEW.detected_drum;
  END IF;
  RETURN NULL;
END;
$$;


ALTER FUNCTION "logs"."update_drum_location"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "production"."fn_set_volume_transferred"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- 1a) if caller didn’t supply a value, use the drum’s current full volume
  IF NEW.volume_transferred IS NULL THEN
    SELECT current_volume
      INTO NEW.volume_transferred
    FROM inventory.drums
    WHERE drum_id = NEW.drum_id
    FOR UPDATE;   -- lock the row so our subsequent UPDATE is safe
  END IF;

  -- 2) subtract that amount from the drum
  UPDATE inventory.drums
    SET
      current_volume = current_volume - NEW.volume_transferred,
      updated_at     = now()
  WHERE drum_id = NEW.drum_id;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "production"."fn_set_volume_transferred"() OWNER TO "postgres";


CREATE FOREIGN DATA WRAPPER "s3_wrapper" HANDLER "extensions"."s3_fdw_handler" VALIDATOR "extensions"."s3_fdw_validator";



SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "auth_ext"."session_settings" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "device_type" "text" NOT NULL,
    "session_duration_seconds" integer NOT NULL,
    "inactivity_timeout_seconds" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "auth_ext"."session_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "auth_ext"."user_profiles" (
    "id" "uuid" NOT NULL,
    "full_name" "text",
    "email" "text",
    "avatar_url" "text"
);


ALTER TABLE "auth_ext"."user_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "auth_ext"."user_queries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "query_name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "last_executed_at" timestamp with time zone DEFAULT "now"(),
    "execution_count" integer DEFAULT 1,
    "selected_table" "text",
    "selected_columns" "jsonb" DEFAULT '[]'::"jsonb",
    "filters" "jsonb" DEFAULT '[]'::"jsonb",
    "sorts" "jsonb" DEFAULT '[]'::"jsonb",
    "join_table" "text",
    "join_type" "text",
    "join_condition" "jsonb",
    "generated_sql" "text",
    "tags" "text"[] DEFAULT '{}'::"text"[]
);


ALTER TABLE "auth_ext"."user_queries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "auth_ext"."user_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "role" "text" DEFAULT 'user'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "auth_ext"."user_roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "auth_ext"."worker_passcodes" (
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


ALTER TABLE "auth_ext"."worker_passcodes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "config"."drum_status_transitions" (
    "current_status" "text" NOT NULL,
    "next_status" "text" NOT NULL,
    "requires_admin" boolean DEFAULT false,
    "requires_reason" boolean DEFAULT false
);


ALTER TABLE "config"."drum_status_transitions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "config"."labs" (
    "lab_id" integer NOT NULL,
    "name" character varying(100) NOT NULL,
    "site" character(3) NOT NULL,
    "description" "text",
    CONSTRAINT "labs_site_check" CHECK (("site" = ANY (ARRAY['Old'::"bpchar", 'New'::"bpchar"])))
);


ALTER TABLE "config"."labs" OWNER TO "postgres";


ALTER TABLE "config"."labs" ALTER COLUMN "lab_id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "config"."labs_lab_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "config"."products" (
    "product_id" integer NOT NULL,
    "name" character varying(50) NOT NULL,
    "sku" character varying(20) NOT NULL,
    "grade" character varying(10) NOT NULL,
    "material_code" "text"
);


ALTER TABLE "config"."products" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "config"."products_product_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "config"."products_product_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "config"."products_product_id_seq" OWNED BY "config"."products"."product_id";



CREATE TABLE IF NOT EXISTS "config"."stills" (
    "still_id" integer NOT NULL,
    "code" character(1) NOT NULL,
    "max_capacity" numeric(2,1) NOT NULL,
    "power_rating_kw" integer NOT NULL,
    "lab_id" integer NOT NULL,
    "is_vacuum" boolean NOT NULL,
    "is_operational" boolean NOT NULL,
    "notes" "text"
);


ALTER TABLE "config"."stills" OWNER TO "postgres";


ALTER TABLE "config"."stills" ALTER COLUMN "still_id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "config"."stills_still_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "inventory"."batch_inputs" (
    "input_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "batch_id" "uuid" NOT NULL,
    "source_type" "text" NOT NULL,
    "source_id" "uuid" NOT NULL,
    "volume_added" numeric NOT NULL,
    "recorded_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "batch_code" "text",
    CONSTRAINT "batch_inputs_source_type_check" CHECK (("source_type" = ANY (ARRAY['supplier'::"text", 'distillation'::"text"]))),
    CONSTRAINT "ck_volume_positive" CHECK (("volume_added" > (0)::numeric))
);


ALTER TABLE "inventory"."batch_inputs" OWNER TO "postgres";


COMMENT ON TABLE "inventory"."batch_inputs" IS 'add constraint on date recorded and source_id (one delivery on a given day is one batch_input record)';



COMMENT ON COLUMN "inventory"."batch_inputs"."source_id" IS 'source_id is an implicit dual foreign key, either referencing distillations or orders';



COMMENT ON COLUMN "inventory"."batch_inputs"."volume_added" IS 'add trigger before insert WHEN source_type is supplier: set volume to items.unit_weight * param:quantity (drums)';



CREATE TABLE IF NOT EXISTS "inventory"."batches" (
    "batch_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "item_id" "uuid" NOT NULL,
    "batch_type" "text" NOT NULL,
    "total_volume" numeric NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "po_id" "uuid",
    CONSTRAINT "batches_batch_type_check" CHECK (("batch_type" = ANY (ARRAY['new'::"text", 'repro'::"text"]))),
    CONSTRAINT "batches_po_id_required_if_new" CHECK ((("batch_type" <> 'new'::"text") OR ("po_id" IS NOT NULL))),
    CONSTRAINT "ck_total_nonnegative" CHECK (("total_volume" >= (0)::numeric))
);


ALTER TABLE "inventory"."batches" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "inventory"."drum_fills" (
    "fill_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "drum_id" "uuid" NOT NULL,
    "batch_id" "uuid" NOT NULL,
    "volume_added" numeric NOT NULL,
    "filled_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "inventory"."drum_fills" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "inventory"."drums" (
    "drum_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "batch_id" "uuid" NOT NULL,
    "serial_number" "text" NOT NULL,
    "current_volume" numeric DEFAULT 200 NOT NULL,
    "status" "text" DEFAULT 'in_stock'::"text" NOT NULL,
    "current_location" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "ck_drum_volume" CHECK (("current_volume" >= (0)::numeric))
);


ALTER TABLE "inventory"."drums" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "inventory"."items" (
    "item_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "barcode_regex" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "material_id" "uuid" NOT NULL,
    "is_repro" boolean DEFAULT false NOT NULL,
    "supplier_id" "uuid" NOT NULL
);


ALTER TABLE "inventory"."items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "inventory"."locations" (
    "location_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "parent_id" "uuid",
    "type" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "inventory"."locations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "inventory"."materials" (
    "material_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "chemical_group" "text" DEFAULT 'Gen Solvents'::"text" NOT NULL,
    "cas_number" "text" NOT NULL,
    "code" "text" NOT NULL,
    CONSTRAINT "materials_chemical_group_check" CHECK (("chemical_group" = ANY (ARRAY['Hydrocarbons'::"text", 'Aromatics'::"text", 'Gen Solvents'::"text"])))
);


ALTER TABLE "inventory"."materials" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "inventory"."purchase_order_lines" (
    "pol_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "po_id" "uuid" NOT NULL,
    "item_id" "uuid" NOT NULL,
    "quantity" numeric NOT NULL,
    CONSTRAINT "purchase_order_lines_quantity_check" CHECK (("quantity" > (0)::numeric))
);


ALTER TABLE "inventory"."purchase_order_lines" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "inventory"."purchase_orders" (
    "po_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "po_number" "text" NOT NULL,
    "supplier_id" "uuid" NOT NULL,
    "order_date" timestamp with time zone DEFAULT "now"() NOT NULL,
    "status" "text" NOT NULL,
    "eta_date" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT "purchase_orders_check" CHECK ((("eta_date" IS NULL) OR ("eta_date" > "order_date"))),
    CONSTRAINT "purchase_orders_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'partially_received'::"text", 'complete'::"text"])))
);


ALTER TABLE "inventory"."purchase_orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "inventory"."suppliers" (
    "supplier_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL
);


ALTER TABLE "inventory"."suppliers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "logs"."context_scan" (
    "context_scan_id" bigint NOT NULL,
    "scanned_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "device_id" "uuid" NOT NULL,
    "raw_qr_code" "text" NOT NULL,
    "context_type" "text" NOT NULL,
    "status" "text" DEFAULT 'success'::"text" NOT NULL,
    "error_code" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    CONSTRAINT "context_scan_context_type_check" CHECK (("context_type" = ANY (ARRAY['still'::"text", 'location'::"text"]))),
    CONSTRAINT "context_scan_status_check" CHECK (("status" = ANY (ARRAY['success'::"text", 'error'::"text"])))
);


ALTER TABLE "logs"."context_scan" OWNER TO "postgres";


COMMENT ON TABLE "logs"."context_scan" IS 'Every QR code scan (still‑QR, location‑QR, etc.) that drives a multi‑scan workflow';



CREATE SEQUENCE IF NOT EXISTS "logs"."context_scan_context_scan_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "logs"."context_scan_context_scan_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "logs"."context_scan_context_scan_id_seq" OWNED BY "logs"."context_scan"."context_scan_id";



CREATE TABLE IF NOT EXISTS "logs"."devices" (
    "device_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "hw_id" "text" NOT NULL,
    "model" "text",
    "os_version" "text",
    "last_seen" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "logs"."devices" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "logs"."drum_scan" (
    "scan_id" bigint NOT NULL,
    "scanned_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "device_id" "uuid" NOT NULL,
    "raw_barcode" "text" NOT NULL,
    "detected_drum" "uuid",
    "action_type" "inventory"."action_type" NOT NULL,
    "status" "text" NOT NULL,
    "error_code" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    CONSTRAINT "chk_status" CHECK (("status" = ANY (ARRAY['success'::"text", 'error'::"text"])))
);


ALTER TABLE "logs"."drum_scan" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "logs"."drum_scan_scan_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "logs"."drum_scan_scan_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "logs"."drum_scan_scan_id_seq" OWNED BY "logs"."drum_scan"."scan_id";



CREATE TABLE IF NOT EXISTS "production"."device_context" (
    "device_id" "uuid" NOT NULL,
    "context_type" "production"."context_type" NOT NULL,
    "context_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone DEFAULT ("now"() + '00:01:00'::interval) NOT NULL
);


ALTER TABLE "production"."device_context" OWNER TO "postgres";


COMMENT ON COLUMN "production"."device_context"."context_id" IS 'E.g. referencing op_id of distillation, transport_id or (scan_id, location_id) for future warehousing stage';



CREATE TABLE IF NOT EXISTS "production"."distillation_details" (
    "op_id" "uuid" NOT NULL,
    "still_id" integer NOT NULL,
    "raw_volume" numeric NOT NULL,
    "expected_yield" numeric,
    "details" "jsonb" DEFAULT '{}'::"jsonb",
    CONSTRAINT "distillation_details_raw_volume_check" CHECK (("raw_volume" > (0)::numeric))
);


ALTER TABLE "production"."distillation_details" OWNER TO "postgres";


COMMENT ON TABLE "production"."distillation_details" IS '3.2.1 A simple AFTER‑INSERT trigger on logs.drum_scan can look up your device’s current “distillation context” (see below), and auto‑populate this table whenever a drum is scanned under that context.';



CREATE TABLE IF NOT EXISTS "production"."jobs" (
    "job_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "item_id" "uuid" NOT NULL,
    "input_batch_id" "uuid" NOT NULL,
    "status" "production"."job_status" DEFAULT 'scheduled'::"production"."job_status" NOT NULL,
    "priority" integer DEFAULT 10 NOT NULL,
    "planned_start" timestamp with time zone,
    "planned_end" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "production"."jobs" OWNER TO "postgres";


COMMENT ON TABLE "production"."jobs" IS '2.1 A single “job” spans from raw material intake to finished‑goods batch creation';



COMMENT ON COLUMN "production"."jobs"."input_batch_id" IS '2.1.2 Input batch may be new stock or repro';



CREATE TABLE IF NOT EXISTS "production"."operation_drums" (
    "op_id" "uuid" NOT NULL,
    "drum_id" "uuid" NOT NULL,
    "scan_id" bigint NOT NULL,
    "volume_transferred" numeric NOT NULL,
    "assigned_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT "operation_drums_volume_transferred_check" CHECK (("volume_transferred" > (0)::numeric))
);


ALTER TABLE "production"."operation_drums" OWNER TO "postgres";


COMMENT ON TABLE "production"."operation_drums" IS 'Junction table, updated via context scan workflows.';



CREATE TABLE IF NOT EXISTS "production"."operations" (
    "op_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "job_id" "uuid" NOT NULL,
    "op_type" "production"."op_type" NOT NULL,
    "scheduled_start" timestamp with time zone,
    "started_at" timestamp with time zone,
    "ended_at" timestamp with time zone,
    "status" "production"."op_status" DEFAULT 'pending'::"production"."op_status" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "production"."operations" OWNER TO "postgres";


COMMENT ON TABLE "production"."operations" IS '2.2 Each job breaks into sequential or parallel operations';



CREATE TABLE IF NOT EXISTS "production"."orders" (
    "order_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text" NOT NULL,
    "item_id" "uuid" NOT NULL,
    "quantity" integer NOT NULL,
    "status" "text" DEFAULT 'planned'::"text" NOT NULL,
    "scheduled_start" timestamp with time zone,
    "scheduled_end" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "orders_quantity_check" CHECK (("quantity" > 0))
);


ALTER TABLE "production"."orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "production"."qc_results" (
    "qc_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "op_id" "uuid" NOT NULL,
    "tested_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "grade" "production"."qc_grade" NOT NULL,
    "volume" numeric NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    CONSTRAINT "qc_results_volume_check" CHECK (("volume" >= (0)::numeric))
);


ALTER TABLE "production"."qc_results" OWNER TO "postgres";


COMMENT ON TABLE "production"."qc_results" IS '4.1 Record each QC test and its pass/fail volumes';



COMMENT ON COLUMN "production"."qc_results"."metadata" IS '4.1.1 Contains data from standard UV and purity test result metrics';



CREATE TABLE IF NOT EXISTS "production"."split_operations" (
    "split_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "parent_op_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "production"."split_operations" OWNER TO "postgres";


COMMENT ON TABLE "production"."split_operations" IS '4.2.1 You can then link these splits back into `inventory.batches` via batch_inputs with source_type=`distillation_output`';



CREATE OR REPLACE VIEW "ui"."v_drums" AS
 SELECT "d"."drum_id",
    "d"."serial_number",
    "d"."status",
    "b"."batch_type",
    "i"."name" AS "item_name",
    "b"."total_volume",
    ( SELECT "f"."volume_added"
           FROM "inventory"."drum_fills" "f"
          WHERE ("f"."drum_id" = "d"."drum_id")
          ORDER BY "f"."filled_at" DESC
         LIMIT 1) AS "last_fill_vol"
   FROM (("inventory"."drums" "d"
     JOIN "inventory"."batches" "b" USING ("batch_id"))
     JOIN "inventory"."items" "i" USING ("item_id"));


ALTER TABLE "ui"."v_drums" OWNER TO "postgres";


ALTER TABLE ONLY "config"."products" ALTER COLUMN "product_id" SET DEFAULT "nextval"('"config"."products_product_id_seq"'::"regclass");



ALTER TABLE ONLY "logs"."context_scan" ALTER COLUMN "context_scan_id" SET DEFAULT "nextval"('"logs"."context_scan_context_scan_id_seq"'::"regclass");



ALTER TABLE ONLY "logs"."drum_scan" ALTER COLUMN "scan_id" SET DEFAULT "nextval"('"logs"."drum_scan_scan_id_seq"'::"regclass");



ALTER TABLE ONLY "auth_ext"."user_profiles"
    ADD CONSTRAINT "profiles_email_key" UNIQUE ("email");



ALTER TABLE ONLY "auth_ext"."user_profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth_ext"."session_settings"
    ADD CONSTRAINT "session_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth_ext"."user_queries"
    ADD CONSTRAINT "user_queries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth_ext"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth_ext"."worker_passcodes"
    ADD CONSTRAINT "worker_passcodes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "config"."drum_status_transitions"
    ADD CONSTRAINT "drum_status_transitions_pkey" PRIMARY KEY ("current_status", "next_status");



ALTER TABLE ONLY "config"."labs"
    ADD CONSTRAINT "labs_pkey" PRIMARY KEY ("lab_id");



ALTER TABLE ONLY "config"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("product_id");



ALTER TABLE ONLY "config"."stills"
    ADD CONSTRAINT "stills_pkey" PRIMARY KEY ("still_id");



ALTER TABLE ONLY "config"."stills"
    ADD CONSTRAINT "stills_still_code_key" UNIQUE ("code");



ALTER TABLE ONLY "inventory"."batch_inputs"
    ADD CONSTRAINT "batch_inputs_pkey" PRIMARY KEY ("input_id");



ALTER TABLE ONLY "inventory"."batches"
    ADD CONSTRAINT "batches_pkey" PRIMARY KEY ("batch_id");



ALTER TABLE ONLY "inventory"."drum_fills"
    ADD CONSTRAINT "drum_fills_pkey" PRIMARY KEY ("fill_id");



ALTER TABLE ONLY "inventory"."drums"
    ADD CONSTRAINT "drums_pkey" PRIMARY KEY ("drum_id");



ALTER TABLE ONLY "inventory"."drums"
    ADD CONSTRAINT "drums_serial_number_key" UNIQUE ("serial_number");



ALTER TABLE ONLY "inventory"."items"
    ADD CONSTRAINT "items_name_supplier_key" UNIQUE ("material_id", "supplier_id");



ALTER TABLE ONLY "inventory"."items"
    ADD CONSTRAINT "items_pkey" PRIMARY KEY ("item_id");



ALTER TABLE ONLY "inventory"."locations"
    ADD CONSTRAINT "locations_code_key" UNIQUE ("code");



ALTER TABLE ONLY "inventory"."locations"
    ADD CONSTRAINT "locations_pkey" PRIMARY KEY ("location_id");



ALTER TABLE ONLY "inventory"."materials"
    ADD CONSTRAINT "materials_cas_number_key" UNIQUE ("cas_number");



ALTER TABLE ONLY "inventory"."materials"
    ADD CONSTRAINT "materials_code_key" UNIQUE ("code");



ALTER TABLE ONLY "inventory"."materials"
    ADD CONSTRAINT "materials_name_key" UNIQUE ("name");



ALTER TABLE ONLY "inventory"."materials"
    ADD CONSTRAINT "materials_pkey" PRIMARY KEY ("material_id");



ALTER TABLE ONLY "inventory"."purchase_order_lines"
    ADD CONSTRAINT "purchase_order_lines_pkey" PRIMARY KEY ("pol_id");



ALTER TABLE ONLY "inventory"."purchase_order_lines"
    ADD CONSTRAINT "purchase_order_lines_po_id_item_id_key" UNIQUE ("po_id", "item_id");



ALTER TABLE ONLY "inventory"."purchase_orders"
    ADD CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("po_id");



ALTER TABLE ONLY "inventory"."purchase_orders"
    ADD CONSTRAINT "purchase_orders_po_number_key" UNIQUE ("po_number");



ALTER TABLE ONLY "inventory"."suppliers"
    ADD CONSTRAINT "suppliers_pkey" PRIMARY KEY ("supplier_id");



ALTER TABLE ONLY "logs"."context_scan"
    ADD CONSTRAINT "context_scan_pkey" PRIMARY KEY ("context_scan_id");



ALTER TABLE ONLY "logs"."devices"
    ADD CONSTRAINT "devices_hw_id_key" UNIQUE ("hw_id");



ALTER TABLE ONLY "logs"."devices"
    ADD CONSTRAINT "devices_pkey" PRIMARY KEY ("device_id");



ALTER TABLE ONLY "logs"."drum_scan"
    ADD CONSTRAINT "drum_scan_pkey" PRIMARY KEY ("scan_id");



ALTER TABLE ONLY "production"."device_context"
    ADD CONSTRAINT "device_context_pkey" PRIMARY KEY ("device_id");



ALTER TABLE ONLY "production"."distillation_details"
    ADD CONSTRAINT "distillation_details_pkey" PRIMARY KEY ("op_id");



ALTER TABLE ONLY "production"."jobs"
    ADD CONSTRAINT "jobs_pkey" PRIMARY KEY ("job_id");



ALTER TABLE ONLY "production"."operation_drums"
    ADD CONSTRAINT "operation_drums_pkey" PRIMARY KEY ("op_id", "drum_id");



ALTER TABLE ONLY "production"."operations"
    ADD CONSTRAINT "operations_pkey" PRIMARY KEY ("op_id");



ALTER TABLE ONLY "production"."orders"
    ADD CONSTRAINT "orders_code_key" UNIQUE ("code");



ALTER TABLE ONLY "production"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("order_id");



ALTER TABLE ONLY "production"."qc_results"
    ADD CONSTRAINT "qc_results_pkey" PRIMARY KEY ("qc_id");



ALTER TABLE ONLY "production"."split_operations"
    ADD CONSTRAINT "split_operations_pkey" PRIMARY KEY ("split_id");



CREATE INDEX "idx_user_queries_query_name" ON "auth_ext"."user_queries" USING "gin" ("to_tsvector"('"english"'::"regconfig", "query_name"));



CREATE INDEX "idx_user_queries_selected_table" ON "auth_ext"."user_queries" USING "btree" ("selected_table");



CREATE INDEX "idx_user_queries_user_id" ON "auth_ext"."user_queries" USING "btree" ("user_id");



CREATE INDEX "idx_worker_passcodes_passcode" ON "auth_ext"."worker_passcodes" USING "btree" ("passcode");



CREATE UNIQUE INDEX "idx_worker_passcodes_unique_passcode" ON "auth_ext"."worker_passcodes" USING "btree" ("passcode") WHERE ("is_active" = true);



CREATE INDEX "user_roles_user_id_idx" ON "auth_ext"."user_roles" USING "btree" ("user_id");



CREATE UNIQUE INDEX "user_roles_user_id_role_idx" ON "auth_ext"."user_roles" USING "btree" ("user_id", "role");



CREATE UNIQUE INDEX "idx_product_sku" ON "config"."products" USING "btree" ("sku");



CREATE UNIQUE INDEX "uq_inputs_po" ON "inventory"."batch_inputs" USING "btree" ("source_type", "source_id") WHERE ("source_type" = 'supplier'::"text");



CREATE OR REPLACE TRIGGER "trg_batch_input_after_insert" AFTER INSERT ON "inventory"."batch_inputs" FOR EACH ROW EXECUTE FUNCTION "inventory"."fn_update_batch_volume"();



CREATE OR REPLACE TRIGGER "trg_drum_fills_after_insert" AFTER INSERT ON "inventory"."drum_fills" FOR EACH ROW EXECUTE FUNCTION "inventory"."fn_update_drum_volume"();



CREATE OR REPLACE TRIGGER "trg_apply_context" AFTER INSERT ON "logs"."drum_scan" FOR EACH ROW EXECUTE FUNCTION "logs"."fn_apply_context_to_drum"();



CREATE OR REPLACE TRIGGER "trg_detected_drum" BEFORE INSERT ON "logs"."drum_scan" FOR EACH ROW EXECUTE FUNCTION "logs"."set_detected_drum"();



CREATE OR REPLACE TRIGGER "trg_set_context" AFTER INSERT ON "logs"."context_scan" FOR EACH ROW EXECUTE FUNCTION "logs"."fn_set_context"();



CREATE OR REPLACE TRIGGER "trg_update_location" AFTER INSERT ON "logs"."drum_scan" FOR EACH ROW EXECUTE FUNCTION "logs"."update_drum_location"();



CREATE OR REPLACE TRIGGER "trg_set_volume_transferred" BEFORE INSERT OR UPDATE ON "production"."operation_drums" FOR EACH ROW EXECUTE FUNCTION "production"."fn_set_volume_transferred"();



ALTER TABLE ONLY "auth_ext"."user_profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "auth_ext"."user_queries"
    ADD CONSTRAINT "user_queries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "auth_ext"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "auth_ext"."worker_passcodes"
    ADD CONSTRAINT "worker_passcodes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "auth_ext"."worker_passcodes"
    ADD CONSTRAINT "worker_passcodes_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "auth_ext"."worker_passcodes"
    ADD CONSTRAINT "worker_passcodes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "config"."products"
    ADD CONSTRAINT "products_material_code_fkey" FOREIGN KEY ("material_code") REFERENCES "inventory"."materials"("code");



ALTER TABLE ONLY "config"."stills"
    ADD CONSTRAINT "stills_lab_id_fkey" FOREIGN KEY ("lab_id") REFERENCES "config"."labs"("lab_id");



ALTER TABLE ONLY "inventory"."batch_inputs"
    ADD CONSTRAINT "batch_inputs_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "inventory"."batches"("batch_id");



ALTER TABLE ONLY "inventory"."batch_inputs"
    ADD CONSTRAINT "batch_inputs_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "inventory"."purchase_orders"("po_id") MATCH FULL DEFERRABLE INITIALLY DEFERRED NOT VALID;



ALTER TABLE ONLY "inventory"."batches"
    ADD CONSTRAINT "batches_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "inventory"."items"("item_id");



ALTER TABLE ONLY "inventory"."batches"
    ADD CONSTRAINT "batches_po_id_fkey" FOREIGN KEY ("po_id") REFERENCES "inventory"."purchase_orders"("po_id") ON UPDATE CASCADE;



ALTER TABLE ONLY "inventory"."drum_fills"
    ADD CONSTRAINT "drum_fills_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "inventory"."batches"("batch_id");



ALTER TABLE ONLY "inventory"."drum_fills"
    ADD CONSTRAINT "drum_fills_drum_id_fkey" FOREIGN KEY ("drum_id") REFERENCES "inventory"."drums"("drum_id");



ALTER TABLE ONLY "inventory"."drums"
    ADD CONSTRAINT "drums_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "inventory"."batches"("batch_id");



ALTER TABLE ONLY "inventory"."drums"
    ADD CONSTRAINT "drums_current_location_fkey" FOREIGN KEY ("current_location") REFERENCES "inventory"."locations"("location_id") ON DELETE SET NULL;



ALTER TABLE ONLY "inventory"."items"
    ADD CONSTRAINT "items_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "inventory"."materials"("material_id");



ALTER TABLE ONLY "inventory"."items"
    ADD CONSTRAINT "items_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "inventory"."suppliers"("supplier_id");



ALTER TABLE ONLY "inventory"."locations"
    ADD CONSTRAINT "locations_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "inventory"."locations"("location_id") ON DELETE SET NULL;



ALTER TABLE ONLY "inventory"."purchase_order_lines"
    ADD CONSTRAINT "purchase_order_lines_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "inventory"."items"("item_id");



ALTER TABLE ONLY "inventory"."purchase_order_lines"
    ADD CONSTRAINT "purchase_order_lines_po_id_fkey" FOREIGN KEY ("po_id") REFERENCES "inventory"."purchase_orders"("po_id") ON DELETE CASCADE;



ALTER TABLE ONLY "inventory"."purchase_orders"
    ADD CONSTRAINT "purchase_orders_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "inventory"."suppliers"("supplier_id");



ALTER TABLE ONLY "logs"."context_scan"
    ADD CONSTRAINT "context_scan_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "logs"."devices"("device_id") ON DELETE RESTRICT;



ALTER TABLE ONLY "logs"."context_scan"
    ADD CONSTRAINT "context_scan_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "logs"."drum_scan"
    ADD CONSTRAINT "drum_scan_detected_drum_fkey" FOREIGN KEY ("detected_drum") REFERENCES "inventory"."drums"("drum_id");



ALTER TABLE ONLY "logs"."drum_scan"
    ADD CONSTRAINT "drum_scan_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "logs"."devices"("device_id") ON DELETE RESTRICT;



ALTER TABLE ONLY "logs"."drum_scan"
    ADD CONSTRAINT "drum_scan_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "production"."device_context"
    ADD CONSTRAINT "device_context_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "logs"."devices"("device_id");



ALTER TABLE ONLY "production"."distillation_details"
    ADD CONSTRAINT "distillation_details_op_id_fkey" FOREIGN KEY ("op_id") REFERENCES "production"."operations"("op_id");



ALTER TABLE ONLY "production"."distillation_details"
    ADD CONSTRAINT "distillation_details_still_id_fkey" FOREIGN KEY ("still_id") REFERENCES "config"."stills"("still_id");



ALTER TABLE ONLY "production"."jobs"
    ADD CONSTRAINT "jobs_input_batch_id_fkey" FOREIGN KEY ("input_batch_id") REFERENCES "inventory"."batches"("batch_id");



ALTER TABLE ONLY "production"."jobs"
    ADD CONSTRAINT "jobs_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "inventory"."items"("item_id");



ALTER TABLE ONLY "production"."operation_drums"
    ADD CONSTRAINT "operation_drums_drum_id_fkey" FOREIGN KEY ("drum_id") REFERENCES "inventory"."drums"("drum_id");



ALTER TABLE ONLY "production"."operation_drums"
    ADD CONSTRAINT "operation_drums_op_id_fkey" FOREIGN KEY ("op_id") REFERENCES "production"."operations"("op_id");



ALTER TABLE ONLY "production"."operation_drums"
    ADD CONSTRAINT "operation_drums_scan_id_fkey" FOREIGN KEY ("scan_id") REFERENCES "logs"."drum_scan"("scan_id");



ALTER TABLE ONLY "production"."operations"
    ADD CONSTRAINT "operations_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "production"."jobs"("job_id") ON DELETE CASCADE;



ALTER TABLE ONLY "production"."orders"
    ADD CONSTRAINT "orders_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "inventory"."items"("item_id") ON DELETE RESTRICT;



ALTER TABLE ONLY "production"."qc_results"
    ADD CONSTRAINT "qc_results_op_id_fkey" FOREIGN KEY ("op_id") REFERENCES "production"."operations"("op_id");



ALTER TABLE ONLY "production"."split_operations"
    ADD CONSTRAINT "split_operations_parent_op_id_fkey" FOREIGN KEY ("parent_op_id") REFERENCES "production"."operations"("op_id");



CREATE POLICY "Admins can insert passcodes" ON "auth_ext"."worker_passcodes" FOR INSERT WITH CHECK (("auth"."uid"() IN ( SELECT "user_roles"."user_id"
   FROM "auth_ext"."user_roles"
  WHERE ("user_roles"."role" = 'admin'::"text"))));



CREATE POLICY "Admins can insert roles" ON "auth_ext"."user_roles" FOR INSERT WITH CHECK (("auth"."uid"() IN ( SELECT "user_roles_1"."user_id"
   FROM "auth_ext"."user_roles" "user_roles_1"
  WHERE ("user_roles_1"."role" = 'admin'::"text"))));



CREATE POLICY "Admins can update passcodes" ON "auth_ext"."worker_passcodes" FOR UPDATE USING (("auth"."uid"() IN ( SELECT "user_roles"."user_id"
   FROM "auth_ext"."user_roles"
  WHERE ("user_roles"."role" = 'admin'::"text"))));



CREATE POLICY "Admins can update roles" ON "auth_ext"."user_roles" FOR UPDATE TO "authenticated" USING (("auth"."uid"() IN ( SELECT "user_roles_1"."user_id"
   FROM "auth_ext"."user_roles" "user_roles_1"
  WHERE ("user_roles_1"."role" = 'admin'::"text"))));



CREATE POLICY "Admins can view all passcodes" ON "auth_ext"."worker_passcodes" FOR SELECT TO "authenticated" USING (("auth"."uid"() IN ( SELECT "user_roles"."user_id"
   FROM "auth_ext"."user_roles"
  WHERE ("user_roles"."role" = 'admin'::"text"))));



CREATE POLICY "Admins can view all roles" ON "auth_ext"."user_roles" FOR SELECT TO "authenticated" USING (("auth"."uid"() IN ( SELECT "user_roles_1"."user_id"
   FROM "auth_ext"."user_roles" "user_roles_1"
  WHERE ("user_roles_1"."role" = 'admin'::"text"))));



CREATE POLICY "Public profiles are viewable by everyone." ON "auth_ext"."user_profiles" FOR SELECT USING (true);



CREATE POLICY "Users can insert their own profile" ON "auth_ext"."user_profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can update their own profile" ON "auth_ext"."user_profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view their own role" ON "auth_ext"."user_roles" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Workers can view their own passcodes" ON "auth_ext"."worker_passcodes" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



ALTER TABLE "auth_ext"."user_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "auth_ext"."user_roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "auth_ext"."worker_passcodes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "logs"."drum_scan" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "insert_drum_scan" ON "logs"."drum_scan" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text"));



CREATE POLICY "select_drum_scan" ON "logs"."drum_scan" FOR SELECT TO "anon", "service_role" USING (false);





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





















































































































































































































































































































GRANT ALL ON FUNCTION "inventory"."fn_update_batch_volume"() TO "anon";
GRANT ALL ON FUNCTION "inventory"."fn_update_batch_volume"() TO "authenticated";
GRANT ALL ON FUNCTION "inventory"."fn_update_batch_volume"() TO "service_role";



GRANT ALL ON FUNCTION "inventory"."fn_update_drum_volume"() TO "anon";
GRANT ALL ON FUNCTION "inventory"."fn_update_drum_volume"() TO "authenticated";
GRANT ALL ON FUNCTION "inventory"."fn_update_drum_volume"() TO "service_role";



GRANT ALL ON FUNCTION "inventory"."receive_delivery"("p_po_id" "uuid", "p_item_id" "uuid", "p_qty" numeric) TO "anon";
GRANT ALL ON FUNCTION "inventory"."receive_delivery"("p_po_id" "uuid", "p_item_id" "uuid", "p_qty" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "inventory"."receive_delivery"("p_po_id" "uuid", "p_item_id" "uuid", "p_qty" numeric) TO "service_role";



GRANT ALL ON FUNCTION "inventory"."validate_barcode"("barcode" "text") TO "anon";
GRANT ALL ON FUNCTION "inventory"."validate_barcode"("barcode" "text") TO "authenticated";
GRANT ALL ON FUNCTION "inventory"."validate_barcode"("barcode" "text") TO "service_role";












GRANT ALL ON TABLE "auth_ext"."session_settings" TO "anon";
GRANT ALL ON TABLE "auth_ext"."session_settings" TO "authenticated";
GRANT ALL ON TABLE "auth_ext"."session_settings" TO "service_role";
GRANT ALL ON TABLE "auth_ext"."session_settings" TO "prisma";



GRANT ALL ON TABLE "auth_ext"."user_profiles" TO "anon";
GRANT ALL ON TABLE "auth_ext"."user_profiles" TO "authenticated";
GRANT ALL ON TABLE "auth_ext"."user_profiles" TO "service_role";
GRANT ALL ON TABLE "auth_ext"."user_profiles" TO "prisma";



GRANT ALL ON TABLE "auth_ext"."user_queries" TO "anon";
GRANT ALL ON TABLE "auth_ext"."user_queries" TO "authenticated";
GRANT ALL ON TABLE "auth_ext"."user_queries" TO "service_role";
GRANT ALL ON TABLE "auth_ext"."user_queries" TO "prisma";



GRANT ALL ON TABLE "auth_ext"."user_roles" TO "anon";
GRANT ALL ON TABLE "auth_ext"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "auth_ext"."user_roles" TO "service_role";
GRANT ALL ON TABLE "auth_ext"."user_roles" TO "prisma";



GRANT ALL ON TABLE "auth_ext"."worker_passcodes" TO "anon";
GRANT ALL ON TABLE "auth_ext"."worker_passcodes" TO "authenticated";
GRANT ALL ON TABLE "auth_ext"."worker_passcodes" TO "service_role";
GRANT ALL ON TABLE "auth_ext"."worker_passcodes" TO "prisma";


















GRANT ALL ON TABLE "inventory"."batch_inputs" TO "anon";
GRANT ALL ON TABLE "inventory"."batch_inputs" TO "authenticated";
GRANT ALL ON TABLE "inventory"."batch_inputs" TO "service_role";



GRANT ALL ON TABLE "inventory"."batches" TO "anon";
GRANT ALL ON TABLE "inventory"."batches" TO "authenticated";
GRANT ALL ON TABLE "inventory"."batches" TO "service_role";



GRANT ALL ON TABLE "inventory"."drum_fills" TO "anon";
GRANT ALL ON TABLE "inventory"."drum_fills" TO "authenticated";
GRANT ALL ON TABLE "inventory"."drum_fills" TO "service_role";



GRANT ALL ON TABLE "inventory"."drums" TO "anon";
GRANT ALL ON TABLE "inventory"."drums" TO "authenticated";
GRANT ALL ON TABLE "inventory"."drums" TO "service_role";



GRANT ALL ON TABLE "inventory"."items" TO "anon";
GRANT ALL ON TABLE "inventory"."items" TO "authenticated";
GRANT ALL ON TABLE "inventory"."items" TO "service_role";



GRANT ALL ON TABLE "inventory"."locations" TO "anon";
GRANT ALL ON TABLE "inventory"."locations" TO "authenticated";
GRANT ALL ON TABLE "inventory"."locations" TO "service_role";



GRANT ALL ON TABLE "inventory"."materials" TO "anon";
GRANT ALL ON TABLE "inventory"."materials" TO "authenticated";
GRANT ALL ON TABLE "inventory"."materials" TO "service_role";



GRANT ALL ON TABLE "inventory"."purchase_order_lines" TO "anon";
GRANT ALL ON TABLE "inventory"."purchase_order_lines" TO "authenticated";
GRANT ALL ON TABLE "inventory"."purchase_order_lines" TO "service_role";



GRANT ALL ON TABLE "inventory"."purchase_orders" TO "anon";
GRANT ALL ON TABLE "inventory"."purchase_orders" TO "authenticated";
GRANT ALL ON TABLE "inventory"."purchase_orders" TO "service_role";



GRANT ALL ON TABLE "inventory"."suppliers" TO "anon";
GRANT ALL ON TABLE "inventory"."suppliers" TO "authenticated";
GRANT ALL ON TABLE "inventory"."suppliers" TO "service_role";












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
