import { List, ListItem, MaterialSymbol } from "gittable-editor";
import "./VersionSelector.css";
import { useState } from "react";
import { Version } from "@sharedTypes/index";
import _ from "lodash";

export type VersionSelectorProps = {
  versions: Version[];
  selectedVersion: Version;
  onVersionChange: (version: Version) => void;
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

  const selectVersion = (version: Version): void => {
    if (!_.isEqual(version, selectVersion)) {
      onVersionChange(version);
    }
    toggleMenu();
  };

  return (
    <div className="version-selector">
      <div className="input" onClick={toggleMenu}>
        <div className="value">{selectedVersion.name}</div>
        <div className="menu-toggle">
          <MaterialSymbol symbol="arrow_drop_down"></MaterialSymbol>
        </div>
      </div>
      {menuOpen && (
        <div className="menu">
          <List>
            {versions.map((version) => (
              <ListItem
                key={version.name}
                text={version.name}
                onClick={() => selectVersion(version)}
              ></ListItem>
            ))}
          </List>
        </div>
      )}
    </div>
  );
}
