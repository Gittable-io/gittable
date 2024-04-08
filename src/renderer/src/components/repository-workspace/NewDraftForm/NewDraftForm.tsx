import { useState } from "react";
import "./NewDraftForm.css";
import { InputAndValidation, MaterialSymbolButton } from "gittable-editor";
import { useSelector } from "react-redux";
import { AppRootState } from "@renderer/store/store";

export function NewDraftForm(): JSX.Element {
  const [draftVersionName, setDraftVersionName] = useState<string>("");

  const versions = useSelector((state: AppRootState) => state.repo.versions);

  const versionExists = (draftName: string): boolean => {
    return versions.some((v) => v.name === draftName);
  };

  const error: string | null =
    draftVersionName !== "" && versionExists(draftVersionName)
      ? "A version of the same name already exists"
      : null;

  return (
    <div className="new-draft-form">
      <InputAndValidation
        value={draftVersionName}
        placeholder="New draft version"
        {...(error ? { error } : {})}
        onChange={setDraftVersionName}
      />
      <MaterialSymbolButton
        symbol="check"
        disabled={error != null}
        onClick={() => {}}
      />
    </div>
  );
}
