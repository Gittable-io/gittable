import { RepositoryContentItem } from "../RepositoryContentItem";
import { List, Spinner } from "gittable-editor";
import "./RepositoryContent2.css";
import { SidebarSection } from "@renderer/components/ui-components/SidebarSection";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, AppRootState } from "@renderer/store/store";
import { repoActions } from "@renderer/store/repoSlice";

export function RepositoryContent2(): JSX.Element {
  const dispatch = useDispatch<AppDispatch>();

  const content = useSelector(
    (state: AppRootState) => state.repo.checkedOutContent,
  )!;

  return (
    <SidebarSection id="repository-content">
      {content ? (
        <List>
          {content.tables.map((tableMetadata) => (
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
