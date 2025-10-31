import { type ReactNode } from "react";

type Props = {
  groupName: string;
  children: ReactNode;
  className?: string;
  inputType?: "checkbox" | "radio";
  inputName?: string;
};

function CollapsableGroup({
  groupName,
  children,
  className,
  inputType,
  inputName,
}: Props) {
  return (
    <div
      className={`collapse collapse-arrow border border-base-300 bg-base-100 rounded-box ${className}`}
    >
      <input type={inputType ?? "checkbox"} name={inputName} />
      <div className="collapse-title text-primary">{groupName}</div>
      <div className="collapse-content flex flex-wrap items-center gap-2 transition-transform duration-200">
        {children}
      </div>
    </div>
  );
}

export default CollapsableGroup;
