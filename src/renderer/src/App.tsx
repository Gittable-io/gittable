import Versions from "./components/Versions";
import testTable from "./test.table.json";
import { TableManager } from "./TableManager";

function App(): JSX.Element {
  return (
    <div className="container">
      <Versions></Versions>
      <TableManager initialTable={testTable} />
    </div>
  );
}

export default App;
