import { RepositoryCloneForm } from "../RepositoryCloneForm";
import "./NewRepositorySection.css";

export function NewRepositorySection(): JSX.Element {
  return (
    <div className="new-repository-section">
      <RepositoryCloneForm />
    </div>
  );
}
