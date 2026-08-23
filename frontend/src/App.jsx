import { Routes, Route } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import History from "./pages/History";
import About from "./pages/About";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/history" element={<History />} />
      <Route path="/about" element={<About />} />
    </Routes>
  );
}

export default App;