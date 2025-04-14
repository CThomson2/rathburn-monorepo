import { ReactNode } from 'react';

interface DataExplorerLayoutProps {
  children: ReactNode;
}

export default function DataExplorerLayout({ children }: DataExplorerLayoutProps) {
  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Data Explorer</h1>
          <p className="text-muted-foreground mt-2">
            Explore and analyze your data with advanced query capabilities.
          </p>
        </div>
        <div className="bg-card rounded-lg border shadow-sm p-6">
          {children}
        </div>
      </div>
    </div>
  );
} 