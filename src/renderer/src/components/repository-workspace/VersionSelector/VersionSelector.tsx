import { List, ListItem, MaterialSymbol } from "gittable-editor";
import "./VersionSelector.css";
import { useState } from "react";

export type VersionSelectorProps = {
  versions: string[];
  selectedVersion: string;
  onVersionChange: (version: string) => void;
};

export function VersionSelector({
  versions,
  selectedVersion,
  onVersionChange,
}: VersionSelectorProps): JSX.Element {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = (): void => {
    setMenuOpen((open) => !open);
  };

  const selectVersion = (version): void => {
    if (version !== selectVersion) {
      onVersionChange(version);
    }
    toggleMenu();
  };

  return (
    <div className="version-selector" onClick={toggleMenu}>
      <div className="value">{selectedVersion}</div>
      <div className="menu-toggle">
        <MaterialSymbol symbol="arrow_drop_down"></MaterialSymbol>
      </div>
      {menuOpen && (
        <div className="menu">
          <List>
            {versions.map((version) => (
              <ListItem
                key={version}
                text={version}
                onClick={() => selectVersion(version)}
              ></ListItem>
            ))}
          </List>
        </div>
      )}
    </div>
  );
}
