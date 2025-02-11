// src/components/ui/card.js
import React from "react";

// Card component
export const Card = ({ children, className }) => (
  <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
    {children}
  </div>
);

// CardHeader component
export const CardHeader = ({ children, className }) => (
  <div className={`border-b pb-3 mb-4 ${className}`}>
    {children}
  </div>
);

// CardTitle component
export const CardTitle = ({ children, className }) => (
  <h2 className={`text-xl font-semibold ${className}`}>
    {children}
  </h2>
);

// CardContent component
export const CardContent = ({ children, className }) => (
  <div className={`mt-4 ${className}`}>
    {children}
  </div>
);