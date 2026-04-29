import React from 'react';
import "@repo/ui";
import { Navigate, useNavigate } from 'react-router-dom';

const domain = window.location.hostname;

export async function Login() {
    const saved = localStorage.getItem("username");
    const response = await fetch(`http://${domain}:8899/api/auth/refresh`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ user: saved  })
	});

    let navigate = useNavigate();

    if (response.ok)
        navigate(`/auth/user/?${saved}`);

    return (<div><p>Hello? HelloHello?!, Is this thing even working?!?!</p></div>)
}