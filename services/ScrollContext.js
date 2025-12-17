import React, { createContext, useContext, useState } from "react";

const ScrollContext = createContext();

export const ScrollProvider = ({ children }) => {
  const [isScrolling, setIsScrolling] = useState(false);

  return (
    <ScrollContext.Provider value={{ isScrolling, setIsScrolling }}>
      {children}
    </ScrollContext.Provider>
  );
};

export const useScroll = () => {
  const context = useContext(ScrollContext);
  if (!context) {
    throw new Error("useScroll must be used within a ScrollProvider");
  }
  return context;
};








