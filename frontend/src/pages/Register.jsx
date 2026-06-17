import React from 'react';
import { Navigate } from 'react-router-dom';

const Register = () => {
  return <Navigate to="/login?register=true" replace />;
};

export default Register;
