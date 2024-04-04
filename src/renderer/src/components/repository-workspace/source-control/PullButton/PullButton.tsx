import { MaterialSymbolButton } from "gittable-editor";
import { useState } from "react";

export type PullButtonProps = {
  repositoryId: string;
};

export function PullButton({ repositoryId }: PullButtonProps): JSX.Element {
  const [pullInProgress, setPullInProgress] = useState<boolean>(false);

  const pull = async (): Promise<void> => {
    setPullInProgress(true);
    const response = await window.api.pull({ repositoryId });
    if (response.status === "error") {
      console.error(`[PullButton] Error pulling`);
    } else {
      console.debug(`[PullButton] Fetch success`);
    }

    setPullInProgress(false);
  };

  return (
    <MaterialSymbolButton
      symbol="cloud_download"
      label="Pull changes"
      onClick={pull}
      tooltip
      loading={pullInProgress}
    />
  );
}
