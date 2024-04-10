import { useState } from "react";
import "./NewDraftForm.css";
import { InputAndValidation, MaterialSymbolButton } from "gittable-editor";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, AppRootState } from "@renderer/store/store";
import { repoActions } from "@renderer/store/repoSlice";
import { CredentialsInputModal } from "../source-control/CredentialsInputModal";

export function NewDraftForm(): JSX.Element {
  const dispatch = useDispatch<AppDispatch>();

  const versions = useSelector((state: AppRootState) => state.repo.versions)!;
  const createDraftProgress = useSelector(
    (state: AppRootState) => state.repo.progress.createDraftProgress,
  );

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
        disabled={error != null || draftName === ""}
        onClick={() =>
          dispatch(repoActions.createAndSwitchToDraft({ draftName }))
        }
      />
      {(createDraftProgress === "REQUESTING_CREDENTIALS" ||
        createDraftProgress === "AUTH_ERROR") && (
        <CredentialsInputModal
          authError={createDraftProgress === "AUTH_ERROR"}
          onConfirm={(credentials) =>
            dispatch(
              repoActions.createAndSwitchToDraft({ draftName, credentials }),
            )
          }
          onCancel={() => dispatch(repoActions.cancelNewDraft())}
        />
      )}
    </div>
  );
}
