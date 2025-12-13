import ReactDOM from 'react-dom/client';
import App from './auth/login';
import "@/pages/index.css"
const rootElement = document.getElementById("root")!;
const root = ReactDOM.createRoot(rootElement);

root.render(<App />);
