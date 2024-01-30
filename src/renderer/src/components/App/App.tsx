import { WelcomePage } from "../WelcomePage";
import { Footer } from "../Footer";
import "./App.css";

export function App(): JSX.Element {
  return (
    <div className="app-container">
      <div className="main-container">
        <WelcomePage />
      </div>
      <Footer />
    </div>
  );
}
