import React from 'react';
import './App.css';
import { Header } from './components/Header.jsx';
import { Body } from './pages/Body.jsx';
import { Landing } from './pages/Landing.jsx';
import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import AdminArea from './pages/AdminArea.jsx';
import { useAuth } from './context/AuthContext.jsx';

function App() {
	const { user } = useAuth();

	return (
		<Routes>
			<Route
				path="/"
				element={
					user ? (
						<>
							<Header titulo="Sistema de Votación"></Header>
							<Body />
						</>
					) : (
						<Landing />
					)
				}
			/>
			<Route path="/login" element={<Login />} />
			<Route path="/register" element={<Register />} />
			<Route path="/admin" element={<AdminArea />} />
		</Routes>
	);
}

export default App;
