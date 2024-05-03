import { useSelector } from "react-redux";
import "./SnackbarContainer.css";
import { AppRootState } from "@renderer/store/store";
import { SnackbarNotification } from "@renderer/store/appSlice";
import { Snackbar } from "../Snackbar/Snackbar";

export function SnackbarContainer(): JSX.Element {
  const snackbars: SnackbarNotification[] = useSelector(
    (state: AppRootState) => state.app.snackbars,
  );

  return (
    <div className="snackbar-container">
      {snackbars.map((snack) => (
        <Snackbar key={snack.id} snackbar={snack} />
      ))}
    </div>
  );
}
