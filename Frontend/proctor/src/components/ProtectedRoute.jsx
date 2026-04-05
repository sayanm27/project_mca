import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectToken } from "../store/authSlice";

const ProtectedRoute = () => {
  const token = useSelector(selectToken);
  return token ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;