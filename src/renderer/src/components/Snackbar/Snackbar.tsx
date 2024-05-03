import { SnackbarNotification, appActions } from "@renderer/store/appSlice";
import "./Snackbar.css";
import { MaterialSymbolButton } from "gittable-editor";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@renderer/store/store";

export type SnackbarProps = {
  snackbar: SnackbarNotification;
};

export function Snackbar({ snackbar }: SnackbarProps): JSX.Element {
  const dispatch = useDispatch<AppDispatch>();

  return (
    <div className={`snackbar ${snackbar.type}`}>
      <div className="snackbar-message">{snackbar.message}</div>
      <MaterialSymbolButton
        symbol="close"
        onClick={() => dispatch(appActions.removeSnackbar(snackbar.id))}
      />
    </div>
  );
}
