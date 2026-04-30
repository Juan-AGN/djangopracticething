import React, { useCallback, useEffect, useState } from 'react';
import "@repo/ui";
import { Header, useInit } from '@repo/ui';
import { Navigate, useNavigate } from 'react-router-dom';


const domain = window.location.hostname;

export function Login() {
    const [error, setError] = useState("");
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");

    const navigate = useNavigate();

    useInit ( ()=> {
        const saved = localStorage.getItem("username");
        console.log(saved);

        if (!saved)
            return ;
        
        const response = fetch(`http://${domain}:8899/api/auth/refresh`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ user: saved  })
        }).then( response => {
            if (response.ok)
                navigate(`/auth/user/${saved}`);
        });
        console.log("REFRESH CALLED");
    });

	const handleChange = (e: any) => {
		const { name, value } = e.target;

        if (name == "logininp")
            setName(value);
        else if (name == "passwordinp")
            setPassword(value);
	};

	const handleSubmit = async () => {
        if (name === "" || password === "")
            return ;

        const response = await fetch(`http://${domain}:8899/api/auth/log`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ user: name, password: password  })
        });
            
        if (response.ok)
        {
            localStorage.setItem("username", name);
            navigate(`/auth/user/${name}`);
        }
        else
        {
            const data = await response.json();
            if (!data.message)
                setError("Invalid credentials");
            else
                setError(data.message);
        }
	};


    return (
        <div className='gradiant' style={{ height:'100%', alignContent:'center', padding: 0, margin: 0 }}>
            <Header></Header>
            <div style={{ height:'85vh', alignContent:'center' }}>
            <div className="typicaldiv lonediv logindiv" style={{ height:'fit-content', padding: '10px', margin:'auto' }}>
                <br></br><br></br>
                <p className='title'>LOGIN</p>
                <br></br>
                
                <p style={{ margin: 'auto', textAlign:'center', fontSize:'large'}}>Username:</p>
                <div style={{ margin: 'auto', width: 'fit-content' }}>
                    <input name="logininp" onChange={handleChange} className="logininput" style={{ fontSize:'medium', minHeight: 20, textAlign: 'center' }}></input>
                </div>
                <br></br><br></br>
                <p style={{ margin: 'auto', textAlign:'center', fontSize:'large'}}>Password:</p>
                <div style={{ margin: 'auto', width: 'fit-content' }}>
                    <input name="passwordinp" onChange={handleChange} className="logininput" style={{ WebkitTextSecurity:'disc', fontSize:'medium', minHeight: 20, textAlign: 'center'}}></input>
                </div>
                <br></br><br></br>
                <div onClick={handleSubmit} className='smallbutton biggerbutton' style={{ margin: 'auto', textAlign:'center', fontSize:'large', padding: 10, width:'fit-content', height:'fit-content'}}>LOGIN</div>
                {error !== "" && 
                    <>
                    <p style={{ textAlign: 'center', color:'red'}}>ERROR: {error}</p>
                    </>
                }
                <br></br>
            </div>
            </div>
        </div>
        )
}