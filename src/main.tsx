import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from './lib/providers';
import { initializeServices } from './lib/appwrite/init';
import { Toaster } from './components/ui/toaster';
import App from './App';
import './index.css';

async function initializeApplication() {
  try {
    console.log('Initializing application...');
    await initializeServices();
    
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <App />
          <Toaster />
        </ThemeProvider>
      </StrictMode>
    );
    console.log('Application initialized successfully');
  } catch (error) {
    console.error('Failed to initialize application:', error);
    
    const root = document.getElementById('root');
    if (root) {
      root.innerHTML = `
        <div style="
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          padding: 20px;
          text-align: center;
          font-family: system-ui, -apple-system, sans-serif;
        ">
          <h1 style="color: #ef4444; margin-bottom: 16px;">Unable to Initialize Application</h1>
          <p style="color: #666; max-width: 500px;">
            We're having trouble connecting to our services. Please check your internet connection and try again.
            If the problem persists, contact support.
          </p>
          <button 
            onclick="window.location.reload()" 
            style="
              margin-top: 20px;
              padding: 8px 16px;
              background: #2563eb;
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
            "
          >
            Retry
          </button>
        </div>
      `;
    }
  }
}

initializeApplication();