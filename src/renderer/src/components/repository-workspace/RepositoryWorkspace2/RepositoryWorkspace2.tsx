import { AppDispatch, AppRootState } from "@renderer/store/store";
import "./RepositoryWorkspace2";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";

export function RepositoryWorkspace2(): JSX.Element {
  const dispatch = useDispatch<AppDispatch>();

  const repository = useSelector(
    (state: AppRootState) => state.repo.repository!,
  )!;

  useEffect(() => {
    const initState = async (): Promise<void> => {
      // Fetch versions
    };

    initState();
  }, [dispatch]);

  return <div>{`RepositoryWorkspace2 : ${repository.name}`}</div>;
}
