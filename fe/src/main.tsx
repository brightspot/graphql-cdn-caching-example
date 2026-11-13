import React from 'react';
import ReactDOM from 'react-dom/client';
import { ApolloProvider } from '@apollo/client';
import { BrowserRouter } from 'react-router-dom';

import '@fontsource-variable/fraunces';
import '@fontsource-variable/inter';
import '@fontsource-variable/source-serif-4';

import { client } from './apollo';
import App from './App';
import './styles.css';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Missing #root element');
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <ApolloProvider client={client}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ApolloProvider>
  </React.StrictMode>,
);
