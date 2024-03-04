import "./Tab.css";

// * The structure of this component is inspired by Headless UI Tabs component : https://headlessui.com/react/tabs

export type TabGroupProps = {
  children: React.ReactNode;
};

function Group({ children }: TabGroupProps): JSX.Element {
  return <div className="tab-group">{children}</div>;
}

export type TabListProps = {
  children: React.ReactNode;
};
function List({ children }: TabListProps): JSX.Element {
  return <div className="tab-list">{children}</div>;
}

export type TabLabelProps = {
  children: React.ReactNode;
};

function Label({ children }: TabLabelProps): JSX.Element {
  return <div className="tab-label">{children}</div>;
}

export type TabPanelProps = {
  children: React.ReactNode;
};

function Panel({ children }: TabPanelProps): JSX.Element {
  return <div className="tab-Panel">{children}</div>;
}

export const Tab = {
  Group,
  List,
  Label,
  Panel,
};
