

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


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






CREATE SCHEMA IF NOT EXISTS "inventory";


ALTER SCHEMA "inventory" OWNER TO "postgres";


CREATE EXTENSION IF NOT EXISTS "pgsodium";






CREATE SCHEMA IF NOT EXISTS "production";


ALTER SCHEMA "production" OWNER TO "postgres";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "wrappers" WITH SCHEMA "extensions";






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



CREATE INDEX "idx_user_queries_query_name" ON "auth_ext"."user_queries" USING "gin" ("to_tsvector"('"english"'::"regconfig", "query_name"));



CREATE INDEX "idx_user_queries_selected_table" ON "auth_ext"."user_queries" USING "btree" ("selected_table");



CREATE INDEX "idx_user_queries_user_id" ON "auth_ext"."user_queries" USING "btree" ("user_id");



CREATE INDEX "idx_worker_passcodes_passcode" ON "auth_ext"."worker_passcodes" USING "btree" ("passcode");



CREATE UNIQUE INDEX "idx_worker_passcodes_unique_passcode" ON "auth_ext"."worker_passcodes" USING "btree" ("passcode") WHERE ("is_active" = true);



CREATE INDEX "user_roles_user_id_idx" ON "auth_ext"."user_roles" USING "btree" ("user_id");



CREATE UNIQUE INDEX "user_roles_user_id_role_idx" ON "auth_ext"."user_roles" USING "btree" ("user_id", "role");



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




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";





GRANT USAGE ON SCHEMA "inventory" TO "anon";
GRANT USAGE ON SCHEMA "inventory" TO "authenticated";
GRANT USAGE ON SCHEMA "inventory" TO "service_role";



REVOKE USAGE ON SCHEMA "public" FROM PUBLIC;
GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






























































































































































































































































































































GRANT ALL ON TABLE "auth_ext"."session_settings" TO "anon";
GRANT ALL ON TABLE "auth_ext"."session_settings" TO "authenticated";
GRANT ALL ON TABLE "auth_ext"."session_settings" TO "service_role";



GRANT ALL ON TABLE "auth_ext"."user_profiles" TO "anon";
GRANT ALL ON TABLE "auth_ext"."user_profiles" TO "authenticated";
GRANT ALL ON TABLE "auth_ext"."user_profiles" TO "service_role";



GRANT ALL ON TABLE "auth_ext"."user_queries" TO "anon";
GRANT ALL ON TABLE "auth_ext"."user_queries" TO "authenticated";
GRANT ALL ON TABLE "auth_ext"."user_queries" TO "service_role";



GRANT ALL ON TABLE "auth_ext"."user_roles" TO "anon";
GRANT ALL ON TABLE "auth_ext"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "auth_ext"."user_roles" TO "service_role";



GRANT ALL ON TABLE "auth_ext"."worker_passcodes" TO "anon";
GRANT ALL ON TABLE "auth_ext"."worker_passcodes" TO "authenticated";
GRANT ALL ON TABLE "auth_ext"."worker_passcodes" TO "service_role";



























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






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";





























RESET ALL;
