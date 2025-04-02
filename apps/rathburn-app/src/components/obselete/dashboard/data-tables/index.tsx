"use client";
import Breadcrumb from "../breadcrumbs/breadcrumb";
import DataTableTwo from "./data-table-two";
import React from "react";

const DataTables: React.FC = () => {
  return (
    <>
      <Breadcrumb pageName="Data Tables" />

      <div className="flex flex-col gap-5 md:gap-7 2xl:gap-10">
        {/* <DataTable /> */}
        <DataTableTwo />
      </div>
    </>
  );
};

export default DataTables;
