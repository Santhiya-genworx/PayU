import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./features/auth/pages/login";
import Dashboard from "./features/dashboard/pages/dashboard";
// import { useLoading } from "./context/loadingContext";

// import { useEffect } from "react";
// import { setupAxios } from "./lib/axios";

function App() {
  // const { startLoading, stopLoading } = useLoading();

  // useEffect(() => {
  //   setupAxios(startLoading, stopLoading);
  // }, [startLoading, stopLoading]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;