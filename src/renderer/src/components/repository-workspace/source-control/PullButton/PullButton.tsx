import { MaterialSymbolButton } from "gittable-editor";

export type PullButtonProps = {
  repositoryId: string;
};

export function PullButton({ repositoryId }: PullButtonProps): JSX.Element {
  const pull = async (): Promise<void> => {
    const response = await window.api.pull({ repositoryId });
    if (response.status === "error") {
      console.error(`[PullButton] Error pulling`);
    } else {
      console.debug(`[PullButton] Fetch success`);
    }
  };

  return (
    <MaterialSymbolButton
      symbol="cloud_download"
      label="Pull changes"
      onClick={pull}
      tooltip
    />
  );
}
