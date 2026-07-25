import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';

// 🔥 NOTE: Google Cloud Console se jo Client ID milega usko yahan daalna hai.
// Agar abhi naya generate nahi kiya hai, toh testing ke liye yeh dummy ID rehne de sakte ho:
const GOOGLE_CLIENT_ID ="654495666221-nm67fhefrr0div2pqi4u2c1ah7dfvj9b.apps.googleusercontent.com";

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </GoogleOAuthProvider>
  </StrictMode>,
);
