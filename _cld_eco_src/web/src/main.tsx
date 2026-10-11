import { createRoot } from "react-dom/client";
import App from "./App";
import { installStaticApi } from "./lib/staticApi";
import "./index.css";

installStaticApi(import.meta.env.BASE_URL);

createRoot(document.getElementById("root")!).render(<App />);
