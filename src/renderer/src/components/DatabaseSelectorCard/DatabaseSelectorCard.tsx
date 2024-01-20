import { useState } from "react";

type DatabaseSelectorCardProps = {
  onFileSelect: (path: string) => void;
};

export function DatabaseSelectorCard({
  onFileSelect,
}: DatabaseSelectorCardProps): JSX.Element {
  const [path, setPath] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.currentTarget.files?.[0];
    if (file) {
      setPath(file.path);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept=".table.json"
        onChange={handleFileChange}
      ></input>
      <button
        {...(path === null
          ? { disabled: true }
          : { onClick: () => onFileSelect(path) })}
      >
        Validate
      </button>
    </div>
  );
}
