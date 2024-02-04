import { Repository } from "@sharedTypes/index";
import { RepositoryCloneForm } from "../RepositoryCloneForm";
import "./NewRepositorySection.css";

type NewRepositorySectionProps = {
  onRepositoryClone: (
    repository: Repository,
    alreadyExisting?: boolean,
  ) => void;
};

export function NewRepositorySection({
  onRepositoryClone,
}: NewRepositorySectionProps): JSX.Element {
  return (
    <div className="new-repository-section">
      <RepositoryCloneForm onRepositoryClone={onRepositoryClone} />
    </div>
  );
}
