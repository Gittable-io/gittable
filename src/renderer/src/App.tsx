import { WelcomePage } from "./components/WelcomePage";
import { Footer } from "./components/Footer";
import "./App.css";

function App(): JSX.Element {
  return (
    <div className="app-container">
      <div className="main-container">
        <WelcomePage />
      </div>
      <Footer />
    </div>
  );
}

export default App;
