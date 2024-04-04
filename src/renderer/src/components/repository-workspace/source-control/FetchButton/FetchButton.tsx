import { MaterialSymbolButton } from "gittable-editor";

export type FetchButtonProps = {
  repositoryId: string;
};

export function FetchButton({ repositoryId }: FetchButtonProps): JSX.Element {
  const fetch = async (): Promise<void> => {
    const response = await window.api.fetch({ repositoryId });
    if (response.status === "error") {
      console.error(`[FetchButton] Error fetching`);
    } else {
      console.debug(`[FetchButton] Fetch success`);
    }
  };

  return (
    <MaterialSymbolButton
      symbol="cloud_download"
      label="Fetch changes"
      onClick={fetch}
      tooltip
    />
  );
}
