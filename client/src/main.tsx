import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { installSpotlightPointer } from './components/ui/reactbits/spotlight-pointer';

installSpotlightPointer();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
