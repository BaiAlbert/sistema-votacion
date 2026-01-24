import React from 'react';
import './App.css';
import { Header } from './components/Header.jsx';
import { Body } from './pages/Body.jsx';
import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';

function App() {
	return (
		<Routes>
			<Route
				path="/"
				element={
					<>
						<Header titulo="Sistema de Votación"></Header>
						<Body />
					</>
				}
			/>
			<Route path="/login" element={<Login />} />
			<Route path="/register" element={<Register />} />
		</Routes>
	);
}

export default App;
