import "./TitleBar.css";

export type TitleBarProps = {
  title: string;
};

export function TitleBar({ title }: TitleBarProps): JSX.Element {
  return (
    <div className="title-bar">
      <h1>{title}</h1>
    </div>
  );
}
