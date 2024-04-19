import { useState } from "react";
import "./NewDraftForm.css";
import {
  InputAndValidation,
  MaterialSymbolButton,
  Spinner,
} from "gittable-editor";
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
  const isCreateDraftInProgress: boolean = useSelector(
    (state: AppRootState) =>
      state.repo.remoteActionSequence?.action.type === "CREATE_DRAFT",
  );

  const createDraft = (): void => {
    setDraftName("");

    dispatch(
      repoActions.remoteAction({
        action: { type: "CREATE_DRAFT", draftName },
      }),
    );
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
      {!isCreateDraftInProgress ? (
        <MaterialSymbolButton
          symbol="check"
          label="Confirm new draft version"
          disabled={error != null || draftName === ""}
          onClick={createDraft}
        />
      ) : (
        <Spinner inline />
      )}
    </div>
  );
}
