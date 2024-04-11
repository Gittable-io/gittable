import { RepositoryContentItem } from "../RepositoryContentItem";
import { List, Spinner } from "gittable-editor";
import "./RepositoryContent.css";
import { SidebarSection } from "@renderer/components/ui-components/SidebarSection";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, AppRootState } from "@renderer/store/store";
import { repoActions } from "@renderer/store/repoSlice";

export function RepositoryContent(): JSX.Element {
  const dispatch = useDispatch<AppDispatch>();

  const tables = useSelector(
    (state: AppRootState) => state.repo.currentVersionContent?.tables,
  )!;

  return (
    <SidebarSection id="repository-content">
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
  );
}
