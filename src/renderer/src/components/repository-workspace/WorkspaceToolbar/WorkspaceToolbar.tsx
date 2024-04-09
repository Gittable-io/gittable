import { useDispatch, useSelector } from "react-redux";
import "./WorkspaceToolbar.css";
import { AppDispatch, AppRootState } from "@renderer/store/store";
import { IconAndText } from "gittable-editor";
import { getVersionMaterialSymbol } from "@renderer/utils/utils";

export function WorkspaceToolbar(): JSX.Element {
  const dispatch = useDispatch<AppDispatch>();

  const currentVersion = useSelector(
    (state: AppRootState) => state.repo.currentVersion,
  )!;

  return (
    <div className="workspace-toolbar">
      {currentVersion && (
        <IconAndText
          materialSymbol={getVersionMaterialSymbol(currentVersion)}
          text={`${currentVersion.type === "published" ? (currentVersion.newest ? "Viewing latest published" : "Viewing published") : "Editing draft"} version: ${currentVersion.name}`}
        />
      )}
    </div>
  );
}
