import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/core/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/core/ui/select";
import { Checkbox } from "@/components/core/ui/checkbox";
import { Input } from "@/components/core/ui/input";
import { Button } from "@/components/core/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/core/ui/table";

/**
 * Types for database schema and query operations
 */
interface TableColumn {
  name: string;
  type: string;
}

interface TableSchema {
  name: string;
  columns: TableColumn[];
}

interface JoinableTable {
  name: string;
  columns: TableColumn[];
  joinColumn: string; // Column that can be used for joining with the main table
}

interface QueryResult {
  columns: string[];
  rows: any[];
}

// Sample database schema - would typically come from an API
const MAIN_TABLE: TableSchema = {
  name: "inventory",
  columns: [
    { name: "id", type: "integer" },
    { name: "product_name", type: "string" },
    { name: "quantity", type: "integer" },
    { name: "last_updated", type: "date" },
    { name: "category_id", type: "integer" },
    { name: "supplier_id", type: "integer" },
  ],
};

// Tables that can be joined with the main table
const JOINABLE_TABLES: JoinableTable[] = [
  {
    name: "categories",
    columns: [
      { name: "id", type: "integer" },
      { name: "name", type: "string" },
      { name: "description", type: "string" },
    ],
    joinColumn: "category_id",
  },
  {
    name: "suppliers",
    columns: [
      { name: "id", type: "integer" },
      { name: "name", type: "string" },
      { name: "contact", type: "string" },
      { name: "address", type: "string" },
    ],
    joinColumn: "supplier_id",
  },
];

// Comparison operators for WHERE clauses
const OPERATORS = [
  "=",
  ">",
  "<",
  ">=",
  "<=",
  "LIKE",
  "IN",
  "BETWEEN",
  "IS NULL",
  "IS NOT NULL",
];

/**
 * SQLQueryBuilder Component
 *
 * A comprehensive visual SQL query builder that allows users to construct SQL queries
 * through an intuitive UI without writing raw SQL code.
 *
 * Purpose:
 * - Enables non-technical users to create complex SQL queries
 * - Provides a visual interface for database exploration and reporting
 * - Reduces errors in SQL syntax by using a structured approach
 *
 * Potential Applications:
 * - Business intelligence dashboards
 * - Admin panels for data management
 * - Custom reporting tools for end users
 * - Data exploration interfaces for analysts
 * - Educational tools for teaching SQL concepts
 *
 * Features:
 * - SELECT clause with column selection
 * - JOIN support for related tables
 * - WHERE conditions with multiple operators
 * - ORDER BY for result sorting
 * - LIMIT for pagination
 * - Real-time SQL query generation
 * - Query execution and result display
 *
 * @returns {JSX.Element} A form-based interface for building and executing SQL queries
 */
const SQLQueryBuilder: React.FC = () => {
  // State for query building
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(true);
  const [joinTable, setJoinTable] = useState<string | null>(null);
  const [joinColumns, setJoinColumns] = useState<string[]>([]);
  const [whereConditions, setWhereConditions] = useState<
    Array<{
      column: string;
      operator: string;
      value: string;
    }>
  >([]);
  const [orderByColumn, setOrderByColumn] = useState<string | null>(null);
  const [orderDirection, setOrderDirection] = useState<"ASC" | "DESC">("ASC");
  const [limit, setLimit] = useState<number | null>(null);

  // State for results
  const [queryString, setQueryString] = useState<string>("");
  const [queryResults, setQueryResults] = useState<QueryResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // All available columns (main table + joined table if any)
  const [availableColumns, setAvailableColumns] = useState<string[]>(
    MAIN_TABLE.columns.map((col) => `${MAIN_TABLE.name}.${col.name}`)
  );

  /**
   * Updates available columns when join table changes
   * This ensures the UI only shows relevant columns based on the current join state
   */
  useEffect(() => {
    const mainTableColumns = MAIN_TABLE.columns.map(
      (col) => `${MAIN_TABLE.name}.${col.name}`
    );

    if (joinTable) {
      const joinTableData = JOINABLE_TABLES.find((t) => t.name === joinTable);
      if (joinTableData) {
        const joinTableColumns = joinTableData.columns.map(
          (col) => `${joinTable}.${col.name}`
        );
        setAvailableColumns([...mainTableColumns, ...joinTableColumns]);

        // If we previously had columns selected that are no longer available, reset them
        setSelectedColumns((prev) =>
          prev.filter(
            (col) =>
              mainTableColumns.includes(col) || joinTableColumns.includes(col)
          )
        );
        setJoinColumns(
          joinTableData.columns.map((col) => `${joinTable}.${col.name}`)
        );
      }
    } else {
      setAvailableColumns(mainTableColumns);
      setSelectedColumns((prev) =>
        prev.filter((col) => mainTableColumns.includes(col))
      );
      setJoinColumns([]);
    }
  }, [joinTable]);

  /**
   * Adds a new WHERE condition with default values
   */
  const addWhereCondition = () => {
    setWhereConditions([
      ...whereConditions,
      { column: availableColumns[0], operator: "=", value: "" },
    ]);
  };

  /**
   * Removes a WHERE condition at the specified index
   */
  const removeWhereCondition = (index: number) => {
    setWhereConditions(whereConditions.filter((_, i) => i !== index));
  };

  /**
   * Updates a specific field in a WHERE condition
   *
   * @param index - The index of the condition to update
   * @param field - The field to update (column, operator, or value)
   * @param value - The new value for the field
   */
  const updateWhereCondition = (
    index: number,
    field: "column" | "operator" | "value",
    value: string
  ) => {
    const newConditions = [...whereConditions];
    newConditions[index] = { ...newConditions[index], [field]: value };
    setWhereConditions(newConditions);
  };

  /**
   * Generates the SQL query string based on current selections
   * Handles different SQL clauses and formats them according to SQL syntax
   *
   * @returns {string} The formatted SQL query
   */
  const generateQuery = () => {
    // Start with the base SELECT
    let query = "SELECT ";

    // Add columns
    if (selectAll) {
      query += "* ";
    } else if (selectedColumns.length > 0) {
      query += selectedColumns.join(", ") + " ";
    } else {
      query += "* "; // Default to all columns if none selected
    }

    // Add FROM clause
    query += `FROM ${MAIN_TABLE.name} `;

    // Add JOIN if selected
    if (joinTable) {
      const joinTableData = JOINABLE_TABLES.find((t) => t.name === joinTable);
      if (joinTableData) {
        query += `JOIN ${joinTable} ON ${MAIN_TABLE.name}.${joinTableData.joinColumn} = ${joinTable}.id `;
      }
    }

    // Add WHERE conditions if any
    if (whereConditions.length > 0) {
      query += "WHERE ";
      query += whereConditions
        .map((condition) => {
          // Handle special operators that don't require values
          if (
            condition.operator === "IS NULL" ||
            condition.operator === "IS NOT NULL"
          ) {
            return `${condition.column} ${condition.operator}`;
          }
          // Handle BETWEEN operator
          else if (condition.operator === "BETWEEN") {
            const values = condition.value.split(",").map((v) => v.trim());
            if (values.length === 2) {
              return `${condition.column} BETWEEN ${values[0]} AND ${values[1]}`;
            }
            return `${condition.column} ${condition.operator} ${condition.value}`;
          }
          // Handle IN operator
          else if (condition.operator === "IN") {
            return `${condition.column} IN (${condition.value})`;
          }
          // Handle LIKE operator
          else if (condition.operator === "LIKE") {
            return `${condition.column} LIKE '%${condition.value}%'`;
          }
          // Handle regular operators
          else {
            return `${condition.column} ${condition.operator} '${condition.value}'`;
          }
        })
        .join(" AND ");
    }

    // Add ORDER BY if selected
    if (orderByColumn) {
      query += `ORDER BY ${orderByColumn} ${orderDirection} `;
    }

    // Add LIMIT if specified
    if (limit !== null && limit > 0) {
      query += `LIMIT ${limit}`;
    }

    return query.trim();
  };

  /**
   * Executes the generated SQL query by sending it to the API
   * Updates the UI with results or error messages
   */
  const executeQuery = async () => {
    const query = generateQuery();
    setQueryString(query);
    setIsLoading(true);
    setError(null);

    try {
      // This would be your actual API call
      // For demonstration, we're simulating an API response
      const response = await fetch("/api/execute-query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error("Failed to execute query");
      }

      const data = await response.json();
      setQueryResults(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      setQueryResults(null);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Toggles selection of a specific column
   * Used when "All columns" is unchecked
   */
  const toggleColumn = (column: string) => {
    if (selectedColumns.includes(column)) {
      setSelectedColumns(selectedColumns.filter((col) => col !== column));
    } else {
      setSelectedColumns([...selectedColumns, column]);
    }
  };

  /**
   * Handles the "Select All" checkbox toggle
   * When enabled, clears individual column selections
   */
  const handleSelectAllChange = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedColumns([]);
    }
  };

  return (
    <div className="space-y-6 p-4">
      <Card>
        <CardHeader>
          <CardTitle>SQL Query Builder</CardTitle>
        </CardHeader>
        <CardContent>
          {/* SELECT Clause */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <span className="font-bold">SELECT</span>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="select-all"
                  checked={selectAll}
                  onCheckedChange={handleSelectAllChange}
                />
                <label htmlFor="select-all">All columns (*)</label>
              </div>
            </div>

            {/* Column Selection (visible when "All columns" is unchecked) */}
            {!selectAll && (
              <div className="pl-6 space-y-2">
                <div className="text-sm font-medium">Select columns:</div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {availableColumns.map((column) => (
                    <div key={column} className="flex items-center space-x-2">
                      <Checkbox
                        id={`col-${column}`}
                        checked={selectedColumns.includes(column)}
                        onCheckedChange={() => toggleColumn(column)}
                      />
                      <label htmlFor={`col-${column}`} className="text-sm">
                        {column}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* FROM Clause */}
            <div className="flex items-center space-x-2">
              <span className="font-bold">FROM</span>
              <span>{MAIN_TABLE.name}</span>
            </div>

            {/* JOIN Clause */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="enable-join"
                  checked={joinTable !== null}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setJoinTable(JOINABLE_TABLES[0].name);
                    } else {
                      setJoinTable(null);
                    }
                  }}
                />
                <label htmlFor="enable-join">Enable JOIN</label>
              </div>

              {joinTable && (
                <div className="pl-6 space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold">JOIN</span>
                    <Select
                      value={joinTable}
                      onValueChange={(value) => setJoinTable(value)}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Select table" />
                      </SelectTrigger>
                      <SelectContent>
                        {JOINABLE_TABLES.map((table) => (
                          <SelectItem key={table.name} value={table.name}>
                            {table.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="font-bold">ON</span>
                    <span>
                      {MAIN_TABLE.name}.
                      {
                        JOINABLE_TABLES.find((t) => t.name === joinTable)
                          ?.joinColumn
                      }{" "}
                      = {joinTable}.id
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* WHERE Clause */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold">WHERE</span>
                <Button variant="outline" size="sm" onClick={addWhereCondition}>
                  Add Condition
                </Button>
              </div>

              {whereConditions.length > 0 && (
                <div className="pl-6 space-y-3">
                  {whereConditions.map((condition, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      {index > 0 && <span className="font-medium">AND</span>}

                      <Select
                        value={condition.column}
                        onValueChange={(value) =>
                          updateWhereCondition(index, "column", value)
                        }
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Column" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableColumns.map((column) => (
                            <SelectItem key={column} value={column}>
                              {column}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select
                        value={condition.operator}
                        onValueChange={(value) =>
                          updateWhereCondition(index, "operator", value)
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Operator" />
                        </SelectTrigger>
                        <SelectContent>
                          {OPERATORS.map((op) => (
                            <SelectItem key={op} value={op}>
                              {op}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {condition.operator !== "IS NULL" &&
                        condition.operator !== "IS NOT NULL" && (
                          <Input
                            value={condition.value}
                            onChange={(e) =>
                              updateWhereCondition(
                                index,
                                "value",
                                e.target.value
                              )
                            }
                            placeholder={
                              condition.operator === "BETWEEN"
                                ? "value1, value2"
                                : condition.operator === "IN"
                                  ? "value1, value2, ..."
                                  : "value"
                            }
                            className="w-40"
                          />
                        )}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeWhereCondition(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ORDER BY Clause */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="enable-orderby"
                  checked={orderByColumn !== null}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setOrderByColumn(availableColumns[0]);
                    } else {
                      setOrderByColumn(null);
                    }
                  }}
                />
                <label htmlFor="enable-orderby">Enable ORDER BY</label>
              </div>

              {orderByColumn && (
                <div className="pl-6 flex items-center space-x-2">
                  <span className="font-bold">ORDER BY</span>
                  <Select
                    value={orderByColumn}
                    onValueChange={setOrderByColumn}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Column" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableColumns.map((column) => (
                        <SelectItem key={column} value={column}>
                          {column}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={orderDirection}
                    onValueChange={(value: "ASC" | "DESC") =>
                      setOrderDirection(value)
                    }
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue placeholder="Direction" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ASC">ASC</SelectItem>
                      <SelectItem value="DESC">DESC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* LIMIT Clause */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="enable-limit"
                  checked={limit !== null}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setLimit(100);
                    } else {
                      setLimit(null);
                    }
                  }}
                />
                <label htmlFor="enable-limit">Enable LIMIT</label>
              </div>

              {limit !== null && (
                <div className="pl-6 flex items-center space-x-2">
                  <span className="font-bold">LIMIT</span>
                  <Input
                    type="number"
                    value={limit}
                    onChange={(e) => setLimit(parseInt(e.target.value) || 0)}
                    className="w-24"
                    min={1}
                  />
                </div>
              )}
            </div>

            {/* Execute Button */}
            <div className="pt-4">
              <Button onClick={executeQuery} disabled={isLoading}>
                {isLoading ? "Executing..." : "Execute Query"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generated Query - Shows the SQL that will be executed */}
      {queryString && (
        <Card>
          <CardHeader>
            <CardTitle>Generated SQL Query</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-100 p-3 rounded-md font-mono text-sm overflow-x-auto">
              {queryString}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display - Shows any errors that occurred during execution */}
      {error && (
        <Card className="bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-red-600">{error}</div>
          </CardContent>
        </Card>
      )}

      {/* Results Table - Displays query results in a tabular format */}
      {queryResults && (
        <Card>
          <CardHeader>
            <CardTitle>Query Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {queryResults.columns.map((column, index) => (
                      <TableHead key={index}>{column}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {queryResults.rows.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {queryResults.columns.map((column, colIndex) => (
                        <TableCell key={colIndex}>
                          {String(row[column] !== null ? row[column] : "NULL")}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SQLQueryBuilder;
