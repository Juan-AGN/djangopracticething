import React from 'react';
import logo from './logo.svg';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Login } from "./login/login";

function App() {
  return (
    <BrowserRouter> 
      <Routes>
        <Route path="/auth/" element={<Navigate to="/auth/login" replace />}/>
        <Route path="/auth/login" element={<Login />} />

      </Routes>
    </BrowserRouter>
  );
}

/*        <Route path="/auth/user/:user" element={<User/>}/>
        
        <Route path="/auth/register" element={<Register />} /> */
export default App;
