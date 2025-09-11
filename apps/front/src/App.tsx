import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import { StyledEngineProvider } from '@mui/material/styles';
import App from './Checkout';

import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import { GlobalContextProvider } from './GlobalContext';

// import { useEffect } from 'react';

export default function Main() {
  // const handleSend = () => {
  //   const data = window.electronAPI.sendToBackend(1);
  // };

  // React.useEffect(() => {
  //   window.electronAPI?.onResponse?.((data) => {
  //     console.log("📥 Received from backend:", data);
  //   });
  // }, []);

  return (
    <React.StrictMode>
      <GlobalContextProvider>
        <StyledEngineProvider injectFirst>
          <App />
        </StyledEngineProvider>
      </GlobalContextProvider>
    </React.StrictMode>
  );
}



