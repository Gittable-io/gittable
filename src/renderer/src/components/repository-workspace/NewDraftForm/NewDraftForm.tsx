import { useState } from "react";
import "./NewDraftForm.css";
import { InputAndValidation, MaterialSymbolButton } from "gittable-editor";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, AppRootState } from "@renderer/store/store";
import { DraftVersion } from "@sharedTypes/index";
import { repoActions } from "@renderer/store/repoSlice";

export function NewDraftForm(): JSX.Element {
  const dispatch = useDispatch<AppDispatch>();

  const repository = useSelector(
    (state: AppRootState) => state.repo.repository!,
  )!;
  const versions = useSelector((state: AppRootState) => state.repo.versions)!;

  const [draftName, setDraftName] = useState<string>("");

  const versionExists = (draftName: string): boolean => {
    return versions.some((v) => v.name === draftName);
  };

  const createDraft = async (): Promise<void> => {
    // 1. Create Draft version
    const createDraftResp = await window.api.create_draft({
      repositoryId: repository.id,
      name: draftName,
    });

    if (createDraftResp.status === "error") {
      console.error(`[NewDraftForm] Error creating draft`);
      return;
    }

    const newDraftVersion: DraftVersion = createDraftResp.version;

    // 2. If success: checkout and update versions
    const switchVersionResp = await window.api.switch_version({
      repositoryId: repository.id,
      version: newDraftVersion,
    });
    if (switchVersionResp.status === "error") {
      console.error(`[NewDraftForm] Error switching to new draft version`);
      return;
    }

    const versionsResp = await window.api.list_versions({
      repositoryId: repository.id,
    });

    const currentVersionResp = await window.api.get_current_version({
      repositoryId: repository.id,
    });

    if (
      versionsResp.status === "success" &&
      currentVersionResp.status === "success"
    ) {
      dispatch(
        repoActions.setVersions({
          versions: versionsResp.versions,
          checkedOutVersion: currentVersionResp.version,
        }),
      );
    } else {
      console.error(
        "[RepositoryWorkspace/initState] Couldn't retrieve versions or current version",
      );
      return;
    }

    // Get version content
    const contentResponse = await window.api.get_checked_out_content({
      repositoryId: repository.id,
    });
    if (contentResponse.status === "success") {
      dispatch(repoActions.completeCheckout(contentResponse.content));
    } else {
      console.error(
        "[RepositoryWorkspace/initState] Couldn't retrieve version content",
      );
      return;
    }
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
