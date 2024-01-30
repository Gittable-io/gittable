import { RepositoryCloneForm } from "../RepositoryCloneForm";
import "./NewRepoSection.css";

export function NewRepoSection(): JSX.Element {
  return (
    <div className="new-repo-section">
      <RepositoryCloneForm />
    </div>
  );
}
