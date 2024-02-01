import { RepositoryCloneForm } from "../RepositoryCloneForm";
import "./NewRepoSection.css";

type NewRepoSectionProps = {
  onProjectCreate: (projectPath: string, alreadyExisting?: boolean) => void;
};

export function NewRepoSection({
  onProjectCreate,
}: NewRepoSectionProps): JSX.Element {
  return (
    <div className="new-repo-section">
      <RepositoryCloneForm onProjectCreate={onProjectCreate} />
    </div>
  );
}
