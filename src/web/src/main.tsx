import '@fontsource/nunito/400.css';
import '@fontsource/nunito/600.css';
import '@fontsource/nunito/800.css';
import './styles.css';
import { createRoot } from 'react-dom/client';
import { App } from './App';

const root = document.getElementById('root');

if (!root) {
  throw new Error('No se encontró el elemento raíz de la aplicación.');
}

createRoot(root).render(<App />);
