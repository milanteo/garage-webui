import Button from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Home, LucideIcon } from "lucide-react";
import { Fragment } from "react/jsx-runtime";

type Props = {
  curPrefix: number;
  setCurPrefix: React.Dispatch<React.SetStateAction<number>>;
  prefixHistory: string[];
  actions?: React.ReactNode;
};

const ObjectListNavigator = ({
  curPrefix,
  setCurPrefix,
  prefixHistory,
  actions,
}: Props) => {
  const onGoBack = () => {
    if (curPrefix >= 0) setCurPrefix(curPrefix - 1);
  };

  const onGoForward = () => {
    if (curPrefix < prefixHistory.length - 1) setCurPrefix(curPrefix + 1);
  };

  return (
    <div className="flex shrink-0 flex-row items-center gap-2 p-2">
      <div className="flex shrink-0 flex-row items-center">
        <Button
          icon={ChevronLeft}
          color="ghost"
          size="sm"
          aria-label="Back"
          disabled={curPrefix < 0}
          onClick={onGoBack}
        />
        <Button
          icon={ChevronRight}
          color="ghost"
          size="sm"
          aria-label="Forward"
          disabled={curPrefix >= prefixHistory.length - 1}
          onClick={onGoForward}
        />
      </div>

      <div className="flex h-9 min-w-0 flex-1 flex-row items-center overflow-x-auto rounded-lg bg-base-200 px-2">
        <HistoryItem
          icon={Home}
          isActive={curPrefix === -1}
          onClick={() => setCurPrefix(-1)}
        />

        {prefixHistory.map((prefix, i) => (
          <Fragment key={prefix}>
            <ChevronRight className="shrink-0" size={18} />
            <HistoryItem
              title={prefix
                .substring(0, prefix.lastIndexOf("/"))
                .split("/")
                .pop()}
              isActive={i === curPrefix}
              onClick={() => setCurPrefix(i)}
            />
          </Fragment>
        ))}
      </div>

      <div className="flex shrink-0 flex-row items-center justify-end">
        {actions}
      </div>
    </div>
  );
};

type HistoryItemProps = {
  icon?: LucideIcon;
  title?: string;
  isActive: boolean;
  onClick: () => void;
};

const HistoryItem = ({
  icon: Icon,
  title,
  isActive,
  onClick,
}: HistoryItemProps) => {
  if (!title && !Icon) {
    return null;
  }

  return (
    <a
      href="#"
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={cn(
        "px-2 rounded-md shrink-0 max-w-[150px] truncate",
        isActive && "bg-neutral",
        Icon ? "py-1" : null
      )}
    >
      {Icon ? <Icon size={18} /> : null}
      {title}
    </a>
  );
};

export default ObjectListNavigator;
