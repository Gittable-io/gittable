import { useState } from "react";
import "./NewDraftForm.css";
import { InputAndValidation, MaterialSymbolButton } from "gittable-editor";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, AppRootState } from "@renderer/store/store";
import { repoActions } from "@renderer/store/repoSlice";

export function NewDraftForm(): JSX.Element {
  const dispatch = useDispatch<AppDispatch>();

  const versions = useSelector((state: AppRootState) => state.repo.versions)!;

  const [draftName, setDraftName] = useState<string>("");

  const versionExists = (draftName: string): boolean => {
    return versions.some((v) => v.name === draftName);
  };

  const createDraft = async (): Promise<void> => {
    dispatch(repoActions.createAndSwitchToDraft(draftName));
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
        onClick={createDraft}
      />
    </div>
  );
}
