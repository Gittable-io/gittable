import Versions from "./components/Versions";
import testTable from "./test.table.json";
import { TableManager } from "./TableManager";
import { useEffect } from "react";

function App(): JSX.Element {
  const func = async (): Promise<void> => {
    console.log(`Renderer: Set ping to main `);
    const response = await window.api.get_ping();
    console.log(`Renderer: Received from main ${response}`);
  };

  useEffect(() => {
    func();
  });

  return (
    <div className="container">
      <Versions></Versions>
      <TableManager initialTable={testTable} />
    </div>
  );
}

export default App;
