import { IconAndText } from "gittable-editor";
import { Version } from "@sharedTypes/index";
import { getVersionMaterialSymbol } from "@renderer/utils/utils";
import Select, { ActionMeta, MultiValue, SingleValue } from "react-select";

type OptionType = {
  value: Version;
  label: string;
};

// see https://stackoverflow.com/a/56171762/471461
const formatOptionLabel = ({ value, label }): JSX.Element => (
  <IconAndText materialSymbol={getVersionMaterialSymbol(value)} text={label} />
);

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
  const onChange = (
    newValue: SingleValue<OptionType> | MultiValue<OptionType>,
    _actionMeta: ActionMeta<OptionType>,
  ): void => {
    const newSingleValue = newValue as SingleValue<OptionType>;
    if (newSingleValue) {
      onVersionChange(newSingleValue.value);
    } else {
      // Handle the case where no value is selected (e.g., cleared selection)
      // This depends on your application logic. Here, you might want to set a default or clear an existing selection.
      // onVersionChange(someDefaultValue); // Uncomment or modify as needed.
    }
  };

  const options = versions.map((version) => ({
    value: version,
    label: version.name,
  }));

  return (
    <Select
      className="version-selector"
      options={options}
      value={{ value: selectedVersion, label: selectedVersion.name }}
      isClearable={false}
      isSearchable={true}
      onChange={onChange}
      formatOptionLabel={formatOptionLabel}
    />
  );
}
