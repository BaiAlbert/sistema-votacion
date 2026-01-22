/*
import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
*/
import { useEffect, useState } from 'react';

function App() {
	const [usuarios, setUsuarios] = useState([]);

	useEffect(() => {
		// Aquí pedimos los datos a tu backend PHP
		// Nota: Asumimos que PHP correrá en el puerto 8000
		fetch('http://localhost:8000/api.php')
			.then((response) => response.json())
			.then((data) => setUsuarios(data))
			.catch((error) => console.error('Error:', error));
	}, []);

	return (
		<div style={{ padding: '20px' }}>
			<h1>Lista de Usuarios desde PHP</h1>
			<ul>
				{usuarios.map((usuario) => (
					<li key={usuario.id}>
						<strong>{usuario.nombre}</strong> - {usuario.rol}
					</li>
				))}
			</ul>
		</div>
	);
}

export default App;