import { RepositoryCloneForm } from "../RepositoryCloneForm";
import "./NewRepositorySection.css";

type NewRepositorySectionProps = {
  onProjectCreate: (projectPath: string, alreadyExisting?: boolean) => void;
};

export function NewRepositorySection({
  onProjectCreate,
}: NewRepositorySectionProps): JSX.Element {
  return (
    <div className="new-repository-section">
      <RepositoryCloneForm onProjectCreate={onProjectCreate} />
    </div>
  );
}
