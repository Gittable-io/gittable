import Versions from "./components/Versions";
import { TableManager } from "./TableManager";
import { useEffect, useState } from "react";

function App(): JSX.Element {
  const [data, setData] = useState(null);

  const loadTable = async (): Promise<void> => {
    const testTableData = await window.api.get_table();
    setData(testTableData);
  };

  useEffect(() => {
    loadTable();
  }, []);

  return (
    <div className="container">
      <Versions></Versions>
      {data !== null && <TableManager initialTable={data} />}
    </div>
  );
}

export default App;
