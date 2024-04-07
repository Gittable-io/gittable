import { RepositoryContentItem } from "../RepositoryContentItem";
import { List, Spinner } from "gittable-editor";
import "./RepositoryContent2.css";
import { SidebarSection } from "@renderer/components/ui-components/SidebarSection";
import { useSelector } from "react-redux";
import { AppRootState } from "@renderer/store/store";

export function RepositoryContent2(): JSX.Element {
  const completedCheckout = useSelector(
    (state: AppRootState) => state.repo.loading.completedCheckout,
  );

  const content = useSelector(
    (state: AppRootState) => state.repo.checkedOutContent,
  )!;

  return (
    <SidebarSection id="repository-content">
      {completedCheckout ? (
        <List>
          {content.tables.map((tableMetadata) => (
            <RepositoryContentItem
              key={tableMetadata.id}
              tableName={tableMetadata.name}
              onTableSelect={() => {}}
            />
          ))}
        </List>
      ) : (
        <Spinner />
      )}
    </SidebarSection>
  );
}
