import Button from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  page: number;
  hasNext: boolean;
  disabled?: boolean;
  onPrev: () => void;
  onNext: () => void;
};

const ObjectListPagination = ({
  page,
  hasNext,
  disabled,
  onPrev,
  onNext,
}: Props) => {
  if (page === 0 && !hasNext) {
    return null;
  }

  return (
    <div className="flex shrink-0 flex-row items-center justify-between gap-2 px-2 py-3">
      <span className="text-sm text-base-content/60">Page {page + 1}</span>

      <div className="flex flex-row items-center gap-2">
        <Button
          size="sm"
          color="ghost"
          icon={ChevronLeft}
          disabled={page === 0 || disabled}
          onClick={onPrev}
        >
          Previous
        </Button>
        <Button
          size="sm"
          color="ghost"
          icon={ChevronRight}
          disabled={!hasNext || disabled}
          onClick={onNext}
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default ObjectListPagination;
