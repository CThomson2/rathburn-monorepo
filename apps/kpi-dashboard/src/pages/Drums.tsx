
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Download, Filter, MoreHorizontal, Calendar, AlertCircle } from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { DrumDetailsModal } from "@/components/drums/DrumDetailsModal";
import { DrumFilterBar } from "@/components/drums/DrumFilterBar";

// Mock data for demonstration
const mockDrums = Array.from({ length: 20 }).map((_, i) => ({
  id: i + 1,
  material: ['Benzene', 'Toluene', 'Xylene', 'Ethanol', 'Methanol'][Math.floor(Math.random() * 5)],
  supplier: ['Chemco', 'ReactiveSupplies', 'OrganicChem', 'PetroChem'][Math.floor(Math.random() * 4)],
  batch_code: `B${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
  fill_level: Math.floor(Math.random() * 200),
  status: ['in_stock', 'in_use', 'empty', 'scheduled', 'in_transit'][Math.floor(Math.random() * 5)],
  created_at: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)).toISOString(),
}));

const statusColors = {
  in_stock: "bg-green-100 text-green-800 border-green-200",
  in_use: "bg-blue-100 text-blue-800 border-blue-200",
  empty: "bg-red-100 text-red-800 border-red-200",
  scheduled: "bg-purple-100 text-purple-800 border-purple-200",
  in_transit: "bg-yellow-100 text-yellow-800 border-yellow-200"
};

const DrumManagementPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDrum, setSelectedDrum] = useState(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const itemsPerPage = 10;

  // This will be replaced with actual Supabase query
  const { data: drums, isLoading, error } = useQuery({
    queryKey: ['drums'],
    queryFn: async () => {
      // Replace with actual Supabase query when ready
      // const { data, error } = await supabase
      //   .from('drum_stock')
      //   .select('*')
      //   .order('created_at', { ascending: false });
      
      // if (error) throw error;
      // return data;
      
      return mockDrums; // Using mock data for now
    }
  });

  // Filter drums based on search term
  const filteredDrums = drums?.filter(drum => 
    drum.material.toLowerCase().includes(searchTerm.toLowerCase()) ||
    drum.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
    drum.batch_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    drum.id.toString().includes(searchTerm)
  ) || [];

  // Pagination logic
  const totalPages = Math.ceil(filteredDrums.length / itemsPerPage);
  const paginatedDrums = filteredDrums.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleRowClick = (drum) => {
    setSelectedDrum(drum);
  };

  const handleDownloadLabel = (drumId) => {
    toast({
      title: "Label Downloaded",
      description: `Barcode label for Drum ID: ${drumId} has been downloaded.`,
    });
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Drum Management</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsFilterOpen(true)}>
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            <Button>
              <Calendar className="h-4 w-4 mr-2" />
              Schedule
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="p-4 border-b">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search drums by ID, material, supplier..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="p-12 text-center">Loading drums...</div>
          ) : error ? (
            <div className="p-12 text-center text-red-500 flex flex-col items-center">
              <AlertCircle className="h-10 w-10 mb-2" />
              <p>Error loading drums. Please try again later.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Drum ID</TableHead>
                      <TableHead>Material</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Batch Code</TableHead>
                      <TableHead>Fill Level (L)</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedDrums.map((drum) => (
                      <TableRow 
                        key={drum.id} 
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleRowClick(drum)}
                      >
                        <TableCell className="font-medium">{drum.id}</TableCell>
                        <TableCell>{drum.material}</TableCell>
                        <TableCell>{drum.supplier}</TableCell>
                        <TableCell>{drum.batch_code}</TableCell>
                        <TableCell>{drum.fill_level} L</TableCell>
                        <TableCell>
                          <Badge className={statusColors[drum.status] || "bg-gray-100"}>
                            {drum.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(drum.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadLabel(drum.id);
                              }}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-48" align="end">
                                <div className="flex flex-col gap-1">
                                  <Button 
                                    variant="ghost" 
                                    className="justify-start" 
                                    size="sm"
                                  >
                                    Mark as Lost
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    className="justify-start" 
                                    size="sm"
                                  >
                                    Decommission
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    className="justify-start" 
                                    size="sm"
                                  >
                                    Transfer Contents
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    className="justify-start" 
                                    size="sm"
                                  >
                                    Request Info
                                  </Button>
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="p-4 border-t">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                    
                    {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                      // Display a window of 5 pages centered on current page
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <PaginationItem key={i}>
                          <PaginationLink
                            onClick={() => handlePageChange(pageNum)}
                            isActive={currentPage === pageNum}
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Drum Details Modal */}
      {selectedDrum && (
        <DrumDetailsModal 
          drum={selectedDrum} 
          open={!!selectedDrum} 
          onClose={() => setSelectedDrum(null)} 
        />
      )}

      {/* Filter Sheet */}
      <DrumFilterBar
        open={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
      />
    </DashboardLayout>
  );
};

export default DrumManagementPage;
