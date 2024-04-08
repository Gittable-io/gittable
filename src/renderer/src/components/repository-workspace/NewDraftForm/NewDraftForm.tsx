import { useState } from "react";
import "./NewDraftForm.css";
import { InputAndValidation, MaterialSymbolButton } from "gittable-editor";
import { useSelector } from "react-redux";
import { AppRootState } from "@renderer/store/store";

export type NewDraftFormProps = {
  onNewDraft: (name: string) => void;
};

export function NewDraftForm({ onNewDraft }: NewDraftFormProps): JSX.Element {
  const versions = useSelector((state: AppRootState) => state.repo.versions)!;

  const [draftName, setDraftName] = useState<string>("");

  const versionExists = (draftName: string): boolean => {
    return versions.some((v) => v.name === draftName);
  };

  const error: string | null =
    draftName !== "" && versionExists(draftName)
      ? "A version of the same name already exists"
      : null;

  return (
    <div className="new-draft-form">
      <InputAndValidation
        value={draftName}
        placeholder="New draft version"
        {...(error ? { error } : {})}
        onChange={setDraftName}
      />
      <MaterialSymbolButton
        symbol="check"
        disabled={error != null}
        onClick={() => {
          onNewDraft(draftName);
        }}
      />
    </div>
  );
}
