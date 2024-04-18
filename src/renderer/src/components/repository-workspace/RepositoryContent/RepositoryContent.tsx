import { RepositoryContentItem } from "../RepositoryContentItem";
import { List, MaterialSymbolButton, Spinner } from "gittable-editor";
import "./RepositoryContent.css";
import { SidebarSection } from "@renderer/components/ui-components/SidebarSection";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, AppRootState } from "@renderer/store/store";
import { repoActions } from "@renderer/store/repoSlice";
import { NewTableForm } from "../NewTableForm";

export function RepositoryContent(): JSX.Element {
  const dispatch = useDispatch<AppDispatch>();

  const tables = useSelector(
    (state: AppRootState) => state.repo.currentVersionContent?.tables,
  )!;
  const isDraft = useSelector(
    (state: AppRootState) => state.repo.currentVersion?.type === "draft",
  )!;
  const newTableInProgress = useSelector(
    (state: AppRootState) => state.repo.progress.addTable != null,
  )!;

  return (
    <div className="repository-content">
      {isDraft && (
        <div className="repository-content-toolbar">
          <MaterialSymbolButton
            symbol="note_add"
            label="Add table"
            tooltip
            onClick={() => {
              if (!newTableInProgress) {
                dispatch(repoActions.beginCreateTable());
              } else {
                dispatch(repoActions.cancelCreateTable());
              }
            }}
          />
        </div>
      )}
      {newTableInProgress && <NewTableForm />}
      <SidebarSection>
        {tables ? (
          <List>
            {tables.map((tableMetadata) => (
              <RepositoryContentItem
                key={tableMetadata.id}
                tableName={tableMetadata.name}
                onTableSelect={() =>
                  dispatch(
                    repoActions.openPanel({
                      type: "table",
                      table: tableMetadata,
                    }),
                  )
                }
              />
            ))}
          </List>
        ) : (
          <Spinner />
        )}
      </SidebarSection>
    </div>
  );
}
