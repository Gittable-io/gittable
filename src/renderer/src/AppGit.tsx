export default function AppGit(): JSX.Element {
  return (
    <ul>
      <li>
        <button
          onClick={() => {
            window.api.git_clone();
          }}
        >
          Clone
        </button>
      </li>
      <li>
        <button
          onClick={() => {
            window.api.git_status();
          }}
        >
          Status
        </button>
      </li>
      <li>
        <button
          onClick={() => {
            window.api.git_add();
          }}
        >
          Add
        </button>
      </li>
      <li>
        <button
          onClick={() => {
            window.api.git_commit();
          }}
        >
          Commit
        </button>
      </li>
      <li>
        <button
          onClick={() => {
            window.api.git_push();
          }}
        >
          Push
        </button>
      </li>
    </ul>
  );
}
