import { IconAndText, List, ListItem, MaterialSymbol } from "gittable-editor";
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

  const getMaterialSymbol = (version: Version): string => {
    if (version.type === "published") {
      if (version.newest) return "box";
      else return "inventory_2";
    } else {
      return "box_edit";
    }
  };

  return (
    <div className="version-selector">
      <div className="input" onClick={toggleMenu}>
        <div className="value">
          <IconAndText
            materialSymbol={getMaterialSymbol(selectedVersion)}
            text={selectedVersion.name}
          />
        </div>
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
                materialSymbol={getMaterialSymbol(version)}
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
