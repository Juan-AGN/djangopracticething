import React from 'react';
import logo from './logo.svg';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Login } from "./login/login";

function App() {
  return (
    <BrowserRouter> 
      <Routes>
        <Route path="/auth/" element={<User/>}/>
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/register" element={<Register />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
