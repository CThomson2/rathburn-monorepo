import * as React from "react";

// Fix for React 19 bigint issue with React 18
declare global {
  namespace React {
    interface ReactNode {
      _reactNode?: never;
    }
  }
}
