import "./InformationPanel.css";

export function InformationPanel(): JSX.Element {
  return (
    <div className="information-panel">
      <div className="required-action">
        <h2>One step left : Configure your Author Identity</h2>
        <p>
          You need to setup your user name and email that will be used to
          identify you as the author of your contributions and facilitate
          collaboration with your team.
        </p>
        <p>
          Unsure about which name and email to use? It&apos;s generally best to
          use your professional name and the email address associated with your
          company account.
        </p>
        <p>
          If you&apos;re still uncertain, consult you Git administrator or IT
          department for the recommended user.name and user.email Git
          configuration.
        </p>
      </div>
    </div>
  );
}
