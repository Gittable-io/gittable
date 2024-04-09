import { Version } from "@sharedTypes/index";

export const getVersionMaterialSymbol = (version: Version): string => {
  if (version.type === "published") {
    if (version.newest) return "box";
    else return "inventory_2";
  } else {
    return "box_edit";
  }
};
