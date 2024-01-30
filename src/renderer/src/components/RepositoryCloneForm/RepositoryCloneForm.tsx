import "./RepositoryCloneForm.css";

export function RepositoryCloneForm(): JSX.Element {
  return (
    <div className="repository-clone-form">
      <h2>Connect to an existing database</h2>
      <input type="url"></input>
      <button>Connect</button>
    </div>
  );
}
