import { useDispatch, useSelector } from "react-redux";
import "./WorkspaceToolbar.css";
import { AppDispatch, AppRootState } from "@renderer/store/store";
import { Button, IconAndText } from "gittable-editor";
import { getVersionMaterialSymbol } from "@renderer/utils/utils";
import { repoActions } from "@renderer/store/repoSlice";

export function WorkspaceToolbar(): JSX.Element {
  const dispatch = useDispatch<AppDispatch>();

  const currentVersion = useSelector(
    (state: AppRootState) => state.repo.currentVersion,
  )!;

  return (
    <div className="workspace-toolbar">
      {currentVersion && (
        <>
          <IconAndText
            materialSymbol={getVersionMaterialSymbol(currentVersion)}
            text={`${currentVersion.type === "published" ? (currentVersion.newest ? "Viewing latest published" : "Viewing published") : "Editing draft"} version: ${currentVersion.name}`}
          />
          {currentVersion.type === "draft" && (
            <Button
              text="Review version"
              variant="outlined"
              onClick={() =>
                dispatch(
                  repoActions.openPanel({ type: "review_current_version" }),
                )
              }
            />
          )}
        </>
      )}
    </div>
  );
}
