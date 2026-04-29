import React, { useEffect, useState } from 'react';
import "@repo/ui";
import { Header } from '@repo/ui';
import { Navigate, useNavigate } from 'react-router-dom';


const domain = window.location.hostname;

export function Login() {
    const [error, setError] = useState("")

    const navigate = useNavigate();
        useEffect ( ()=> {
        const saved = localStorage.getItem("username");

        if (!saved)
            return ;
        
        const response = fetch(`http://${domain}:8899/api/auth/refresh`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ user: saved  })
        }).then( response => {
            if (response.ok)
                navigate(`/auth/user/${saved}`);
        })
    }, [])



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
                    <input className="logininput" style={{ fontSize:'medium', minHeight: 20, textAlign: 'center' }}></input>
                </div>
                <br></br><br></br>
                <p style={{ margin: 'auto', textAlign:'center', fontSize:'large'}}>Password:</p>
                <div style={{ margin: 'auto', width: 'fit-content' }}>
                    <input className="logininput" style={{ WebkitTextSecurity:'disc', fontSize:'medium', minHeight: 20, textAlign: 'center'}}></input>
                </div>
                <br></br><br></br>
                <div className='smallbutton biggerbutton' style={{ margin: 'auto', textAlign:'center', fontSize:'large', padding: 10, width:'fit-content', height:'fit-content'}}>LOGIN</div>
                <br></br>
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