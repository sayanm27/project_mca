import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./store/store";
import ProtectedRoute from "./components/ProtectedRoute";

// Pages — swap Login with your existing component
import Login from "./pages/Login";
import Instructions from "./pages/Instructions";
// import Exam from "./pages/Exam"; // wire up next

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />

          {/* Protected — must have access_token in Redux */}
          <Route element={<ProtectedRoute />}>
            <Route path="/instructions" element={<Instructions />} />
            {/* <Route path="/exam" element={<Exam />} /> */}
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </Provider>
  );
}

export default App;