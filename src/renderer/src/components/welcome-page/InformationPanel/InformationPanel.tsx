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
            Consult you Git administrator or IT department for the recommended
            <code>user.name</code> and &nbsp;
            <code>user.email</code> Git configuration.
          </p>
        </div>
      )}
      {gitReady && (
        <div className="required-action">
          <h3>
            Setup is done! You&apos;re ready to start working on your documents
          </h3>
          <p>
            Ask your Git administrator or IT department to create the Git
            Repository where your documents will be saved.
          </p>
          <p>
            Once it&apos;s done, ask them to provide you with the&nbsp;
            <code>Repository URL</code>&nbsp; to clone it.
          </p>
        </div>
      )}
    </div>
  );
}
