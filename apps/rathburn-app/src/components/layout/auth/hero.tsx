import { DatabaseBtn } from "../database-btn";
import AuthButton from "./header-auth";

export default function Hero() {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-8">
        {/* Left section - Empty */}
        <div className="flex-1"></div>

        {/* Center section - Database button */}
        <div className="flex items-center justify-center">
          <DatabaseBtn databasePath="https://supabase.com/dashboard/project/ppnulxweiiczciuxcypn" />
        </div>

        {/* Right section - Auth buttons */}
        <div className="flex-1 flex justify-end">
          <AuthButton />
        </div>
      </div>
    </div>
  );
}
