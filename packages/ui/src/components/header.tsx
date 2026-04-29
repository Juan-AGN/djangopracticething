import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

export function Header() {
    const navigate = useNavigate();
    return (
        <div id="header">
            <div></div>
            <div></div>
        </div>
    );
}