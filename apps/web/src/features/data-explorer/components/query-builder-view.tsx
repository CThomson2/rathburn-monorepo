"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Button } from "@/components/core/ui/button";
import { Input } from "@/components/core/ui/input";
import { Checkbox } from "@/components/core/ui/checkbox";
import { Label } from "@/components/core/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/core/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/core/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/core/ui/select";
import {
  ChevronRight,
  PlusCircle,
  Database as DatabaseIcon,
  TableProperties,
  Filter,
  ArrowDownUp,
  Play,
  Save,
  X,
  Download,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/core/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/core/ui/table";
import { FilterCondition, SortSpec } from "../types";
import { availableTables, buildQuery } from "../constants/tables";
import { useColumns } from "../hooks/use-columns";
import type { Database } from "@/types/models/supabase";

type TableName = (typeof availableTables)[number]["name"];
type TableRecord<T extends TableName> = Database["public"]["Tables"][T]["Row"];
type QueryResult = Record<string, unknown>;

/**
 * A wizard-style component to build and execute a query.
 *
 * This component renders a step-by-step query builder that allows users to
 * select a table, choose columns, apply filters, and sort the results.
 * After the query is built, it can be executed and the results will be displayed.
 *
 * @returns A JSX element representing the query builder component.
 */
export default function QueryBuilderView() {
  // State for the query builder
  const [activeStep, setActiveStep] = useState<string>("table");
  const [selectedTable, setSelectedTable] = useState<TableName>("stock_drum");
  const [tableDescription, setTableDescription] = useState<string>("");
  const [filterConditions, setFilterConditions] = useState<FilterCondition[]>(
    []
  );
  const [sortSpecs, setSortSpecs] = useState<SortSpec[]>([]);
  const [queryResults, setQueryResults] = useState<QueryResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showResults, setShowResults] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // Use our custom hook to get columns
  const {
    columns: availableColumns,
    isLoading: columnsLoading,
    toggleColumn: handleColumnToggle,
    getSelectedColumns,
  } = useColumns(selectedTable);

  // Handle table selection
  const handleTableSelect = (tableName: string) => {
    setSelectedTable(tableName as TableName);
    const tableInfo = availableTables.find((t) => t.name === tableName);
    setTableDescription(tableInfo?.description || "");
    setFilterConditions([]);
    setSortSpecs([]);
    setQueryResults([]);
    setShowResults(false);
    setError(null);
    setActiveStep("columns");
  };

  // Add a new filter condition
  const addFilterCondition = () => {
    if (availableColumns.length === 0) return;

    const newCondition: FilterCondition = {
      id: `filter-${Date.now()}`,
      column: availableColumns[0]?.name || "",
      operator: "eq",
      value: "",
    };
    setFilterConditions((prev) => [...prev, newCondition]);
  };

  // Update a filter condition
  const updateFilterCondition = (
    id: string,
    field: keyof FilterCondition,
    value: string
  ) => {
    setFilterConditions((prev) =>
      prev.map((condition) =>
        condition.id === id ? { ...condition, [field]: value } : condition
      )
    );
  };

  // Remove a filter condition
  const removeFilterCondition = (id: string) => {
    setFilterConditions((prev) =>
      prev.filter((condition) => condition.id !== id)
    );
  };

  // Add a new sort specification
  const addSortSpec = () => {
    if (availableColumns.length === 0) return;

    const newSort: SortSpec = {
      id: `sort-${Date.now()}`,
      column: availableColumns[0]?.name || "",
      direction: "asc",
    };
    setSortSpecs((prev) => [...prev, newSort]);
  };

  // Update a sort specification
  const updateSortSpec = (id: string, field: keyof SortSpec, value: string) => {
    setSortSpecs((prev) =>
      prev.map((sort) => (sort.id === id ? { ...sort, [field]: value } : sort))
    );
  };

  // Remove a sort specification
  const removeSortSpec = (id: string) => {
    setSortSpecs((prev) => prev.filter((sort) => sort.id !== id));
  };

  // Export query results to CSV
  const exportResultsToCSV = () => {
    if (queryResults.length === 0) return;

    const columns = getSelectedColumns();

    // Create CSV content
    const headers = columns.join(",");
    const rows = queryResults.map((row) =>
      columns.map((col) => JSON.stringify(row[col] || "")).join(",")
    );
    const csvContent = `data:text/csv;charset=utf-8,${headers}\n${rows.join("\n")}`;

    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${selectedTable}-query-export.csv`);
    document.body.appendChild(link);

    // Trigger download and clean up
    link.click();
    document.body.removeChild(link);
  };

  // Execute the built query
  const executeQuery = async () => {
    if (!selectedTable) return;

    try {
      setIsLoading(true);
      setError(null);

      // Get the list of selected columns
      const selectedColumns = getSelectedColumns();

      if (selectedColumns.length === 0) {
        setError(new Error("Please select at least one column"));
        return;
      }

      const supabase = createBrowserClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      // Use the buildQuery utility from tables
      const query = buildQuery(selectedTable, {
        columns: selectedColumns,
        filters: filterConditions,
        sorts: sortSpecs,
        pagination: {
          page: 1,
          pageSize: 100,
        },
      });

      // Execute the query
      const { data, error } = await query;

      if (error) throw new Error(error.message);

      // Need to convert the data to our expected format
      const typedResults = (data || []) as unknown as QueryResult[];

      // Update state with the results
      setQueryResults(typedResults);
      setShowResults(true);
    } catch (err) {
      console.error("Error executing query:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      setQueryResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Save query for later use - MVP stub
  const saveQuery = () => {
    // In a real app, you would save the query configuration to a database
    alert("This feature would save your query for later use");
  };

  return (
    <div className="flex flex-col">
      <Tabs value={activeStep} onValueChange={setActiveStep} className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-3">
          <TabsTrigger value="table">
            <DatabaseIcon className="mr-2 h-4 w-4" />
            Select Table
          </TabsTrigger>
          <TabsTrigger value="columns" disabled={!selectedTable}>
            <TableProperties className="mr-2 h-4 w-4" />
            Select Columns
          </TabsTrigger>
          <TabsTrigger
            value="filter"
            disabled={!selectedTable || availableColumns.length === 0}
          >
            <Filter className="mr-2 h-4 w-4" />
            Filters & Sorting
          </TabsTrigger>
        </TabsList>

        <TabsContent value="table" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Select a Table</CardTitle>
              <CardDescription>
                Choose a table to query from the database
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableTables.map((table) => (
                  <Card
                    key={table.name}
                    className={`cursor-pointer transition-colors hover:bg-accent ${selectedTable === table.name ? "border-primary" : ""}`}
                    onClick={() => handleTableSelect(table.name)}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{table.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {table.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
            <CardFooter className="justify-end">
              <Button
                onClick={() => setActiveStep("columns")}
                disabled={!selectedTable}
              >
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="columns" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Select Columns</CardTitle>
              <CardDescription>
                Choose which columns to include in your query from
                <span className="font-medium"> {selectedTable}</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              {columnsLoading ? (
                <div className="text-center py-4 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                  Loading columns...
                </div>
              ) : availableColumns.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  No columns found for this table
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {availableColumns.map((column) => (
                    <div
                      key={column.name}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={`column-${column.name}`}
                        checked={column.selected}
                        onCheckedChange={() => handleColumnToggle(column.name)}
                      />
                      <Label
                        htmlFor={`column-${column.name}`}
                        className="cursor-pointer"
                      >
                        {column.name}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter className="justify-between">
              <Button variant="outline" onClick={() => setActiveStep("table")}>
                Back
              </Button>
              <Button
                onClick={() => setActiveStep("filter")}
                disabled={columnsLoading || getSelectedColumns().length === 0}
              >
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="filter" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Filters & Sorting</CardTitle>
              <CardDescription>
                Add conditions to filter the data and specify sort order
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex justify-between mb-4">
                  <h3 className="text-lg font-medium">Filters</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addFilterCondition}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Filter
                  </Button>
                </div>

                {filterConditions.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-2">
                    No filters defined. Data will not be filtered.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filterConditions.map((condition) => (
                      <div
                        key={condition.id}
                        className="flex flex-wrap gap-2 items-center bg-muted p-2 rounded-md"
                      >
                        <Select
                          value={condition.column}
                          onValueChange={(value) =>
                            updateFilterCondition(condition.id, "column", value)
                          }
                        >
                          <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Column" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableColumns.map((col) => (
                              <SelectItem key={col.name} value={col.name}>
                                {col.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Select
                          value={condition.operator}
                          onValueChange={(value) =>
                            updateFilterCondition(
                              condition.id,
                              "operator",
                              value
                            )
                          }
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Operator" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="eq">Equals</SelectItem>
                            <SelectItem value="neq">Not Equal</SelectItem>
                            <SelectItem value="gt">Greater Than</SelectItem>
                            <SelectItem value="gte">
                              Greater Than or Equal
                            </SelectItem>
                            <SelectItem value="lt">Less Than</SelectItem>
                            <SelectItem value="lte">
                              Less Than or Equal
                            </SelectItem>
                            <SelectItem value="like">Contains</SelectItem>
                            <SelectItem value="ilike">
                              Contains (case insensitive)
                            </SelectItem>
                            <SelectItem value="is">Is</SelectItem>
                            <SelectItem value="in">In</SelectItem>
                          </SelectContent>
                        </Select>

                        <Input
                          placeholder="Value"
                          className="w-[200px]"
                          value={condition.value}
                          onChange={(e) =>
                            updateFilterCondition(
                              condition.id,
                              "value",
                              e.target.value
                            )
                          }
                        />

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFilterCondition(condition.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div className="flex justify-between mb-4">
                  <h3 className="text-lg font-medium">Sorting</h3>
                  <Button variant="outline" size="sm" onClick={addSortSpec}>
                    <ArrowDownUp className="mr-2 h-4 w-4" />
                    Add Sort
                  </Button>
                </div>

                {sortSpecs.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-2">
                    No sorting defined. Data will be returned in default order.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sortSpecs.map((sort, index) => (
                      <div
                        key={sort.id}
                        className="flex flex-wrap gap-2 items-center bg-muted p-2 rounded-md"
                      >
                        <Badge variant="outline" className="mr-2">
                          {index + 1}
                        </Badge>

                        <Select
                          value={sort.column}
                          onValueChange={(value) =>
                            updateSortSpec(sort.id, "column", value)
                          }
                        >
                          <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Column" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableColumns.map((col) => (
                              <SelectItem key={col.name} value={col.name}>
                                {col.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Select
                          value={sort.direction}
                          onValueChange={(value) =>
                            updateSortSpec(
                              sort.id,
                              "direction",
                              value as "asc" | "desc"
                            )
                          }
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Direction" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="asc">Ascending</SelectItem>
                            <SelectItem value="desc">Descending</SelectItem>
                          </SelectContent>
                        </Select>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeSortSpec(sort.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="justify-between">
              <Button
                variant="outline"
                onClick={() => setActiveStep("columns")}
              >
                Back
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowResults(false);
                    setError(null);
                  }}
                >
                  Clear Results
                </Button>
                <Button onClick={executeQuery} disabled={isLoading}>
                  {isLoading ? (
                    <div className="flex items-center">
                      <Loader2 className="h-4 w-4 animate-spin text-primary mr-2" />
                      Running...
                    </div>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Run Query
                    </>
                  )}
                </Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      {error && (
        <div className="mt-4 p-4 bg-destructive/10 border border-destructive rounded-md text-destructive">
          <p>Error: {error.message}</p>
        </div>
      )}

      {showResults && (
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">
              Query Results ({queryResults.length} rows)
            </h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={saveQuery}>
                <Save className="mr-2 h-4 w-4" />
                Save Query
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportResultsToCSV}
                disabled={queryResults.length === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                Export Results
              </Button>
            </div>
          </div>

          <div className="border rounded-md overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {getSelectedColumns().map((column) => (
                      <TableHead key={column} className="whitespace-nowrap">
                        {column}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {queryResults.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={getSelectedColumns().length}
                        className="text-center py-8"
                      >
                        No results found
                      </TableCell>
                    </TableRow>
                  ) : (
                    queryResults.map((row, rowIndex) => (
                      <TableRow key={rowIndex}>
                        {getSelectedColumns().map((column) => (
                          <TableCell key={column} className="whitespace-nowrap">
                            {row[column]?.toString() || ""}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
