import React from 'react';
import './App.css';
import { Header } from './Header.jsx';
import { Body } from './Body.jsx';

function App() {
	return (
		<React.Fragment>
			<Header titulo="Sistema de Votación"></Header>
			<Body />
		</React.Fragment>
	);
}

export default App;
