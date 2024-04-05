import { AppRootState } from "@renderer/store/store";
import "./RepositoryWorkspace2";
import { useSelector } from "react-redux";

export function RepositoryWorkspace2(): JSX.Element {
  const repository = useSelector(
    (state: AppRootState) => state.repo!.repository,
  )!;

  return <div>{`RepositoryWorkspace2 : ${repository.name}`}</div>;
}
