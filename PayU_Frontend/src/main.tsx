import { createRoot } from 'react-dom/client'
import { Provider } from "react-redux";
import { store } from "./app/store.ts";
import './index.css'
import App from './App.tsx'
// import { LoadingProvider } from './context/loadingContext.tsx';
// import { Spinner } from './components/common/spinners.tsx';

createRoot(document.getElementById('root') as HTMLElement).render(
  // <LoadingProvider>
  //   <Spinner />
    <Provider store={store}>
      <App />
    </Provider>
  // </LoadingProvider>
)