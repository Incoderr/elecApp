import React from "react";
import { BrowserRouter, Routes, Route } from "react-router";

import Chat from "./pages/Chat";



function App() {
  return (
      <BrowserRouter>
          <Routes>
            <Route path="/" element={<Chat />} />
          </Routes>
      </BrowserRouter>
  );
}

export default App;