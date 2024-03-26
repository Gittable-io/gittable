import "./InformationPanel.css";

export type InformationPanelProps = {
  gitReady: boolean;
};

export function InformationPanel({
  gitReady,
}: InformationPanelProps): JSX.Element {
  return (
    <div className="information-panel">
      {!gitReady && (
        <div className="required-action">
          <h3>One step left : Configure your Author Identity</h3>
          <p>
            You need to setup your user name and email to identify you correctly
            as the author of your contributions and facilitate collaboration
            with your team.
          </p>
          <p>
            <em>Unsure about which name and email to use?</em>
            <br />
            It&apos;s generally best to use your professional name and email
            address associated with your company account.
          </p>
          <p>
            <em>Still uncertain?</em>
            <br />
            Consult you Git administrator or IT department for the recommended{" "}
            <code>user.name</code> and &nbsp;
            <code>user.email</code> Git configuration.
          </p>
        </div>
      )}
    </div>
  );
}
