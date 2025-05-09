import React from "react";

export const renderIcon = (IconComponent: React.ElementType, props = {}) => {
  return React.createElement(IconComponent, props);
};
