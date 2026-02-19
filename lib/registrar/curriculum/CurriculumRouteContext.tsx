"use client";

import React from "react";

const defaultBasePath = "/registrar/curriculum";

const CurriculumRouteContext = React.createContext<string>(defaultBasePath);

export function CurriculumRouteProvider({
  basePath,
  children,
}: {
  basePath: string;
  children: React.ReactNode;
}) {
  return (
    <CurriculumRouteContext.Provider value={basePath}>
      {children}
    </CurriculumRouteContext.Provider>
  );
}

export function useCurriculumBasePath(): string {
  const base = React.useContext(CurriculumRouteContext);
  return base || defaultBasePath;
}
