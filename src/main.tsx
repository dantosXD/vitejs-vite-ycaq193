import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from './lib/providers';
import { initializeServices } from './lib/appwrite';
import { Toaster } from './components/ui/toaster';
import App from './App';
import './index.css';

const root = document.getElementById('root');
if (!root) {
  throw new Error('Root element not found');
}

function renderErrorState(error: unknown) {
  const message = error instanceof Error ? error.message : 'Unknown error occurred';
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
        ${message}
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

// Initialize and render application
initializeServices()
  .then(() => {
    createRoot(root).render(
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
  })
  .catch(renderErrorState);