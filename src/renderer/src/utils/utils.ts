import { DraftVersion, PublishedVersion, Version } from "@sharedTypes/index";

export const getVersionMaterialSymbol = (version: Version): string => {
  if (version.type === "published") {
    if (version.newest) return "box";
    else return "inventory_2";
  } else {
    return "box_edit";
  }
};

// ! This function is duplicated in main/services/git/utils
export function isVersionEqual(
  v1: Version | null,
  v2: Version | null,
): boolean {
  if (v1 == null || v2 == null) {
    if (v1 == null && v2 != null) return false;
    if (v1 != null && v2 == null) return false;
    else return true;
  } else {
    if (v1.type !== v2.type) return false;
    if (v1.type === "draft") {
      const dv1 = v1 as DraftVersion;
      const dv2 = v2 as DraftVersion;
      return dv1.id === dv2.id && dv1.name === dv2.name;
    } else {
      const pv1 = v1 as PublishedVersion;
      const pv2 = v2 as PublishedVersion;
      return pv1.tag === pv2.tag;
    }
  }
}
