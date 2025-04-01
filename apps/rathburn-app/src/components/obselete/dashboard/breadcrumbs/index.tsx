"use client";
import Breadcrumb from "./breadcrumb";
import BreadcrumbOne from "./breadcrumb-one";
import BreadcrumbTwo from "./breadcrumb-two";
import BreadcrumbThree from "./breadcrumb-three";

const Breadcrumbs: React.FC = () => {
  return (
    <>
      <Breadcrumb pageName="Breadcrumb" />

      <div className="flex flex-col gap-7.5">
        <BreadcrumbOne />
        <BreadcrumbTwo />
        <BreadcrumbThree />
      </div>
    </>
  );
};

export default Breadcrumbs;
