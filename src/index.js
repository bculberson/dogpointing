import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import { HashRouter, Route } from 'react-router-dom';


ReactDOM.render((<HashRouter><Route exact path="/" component={App} />
</HashRouter>), document.getElementById('root'));
