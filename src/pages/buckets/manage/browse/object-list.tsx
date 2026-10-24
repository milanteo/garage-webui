import { Alert, Loading, Table } from "react-daisyui";
import { useBrowseObjects } from "./hooks";
import { dayjs, readableBytes } from "@/lib/utils";
import mime from "mime/lite";
import { Object } from "./types";
import { API_URL } from "@/lib/api";
import {
  CircleXIcon,
  FileArchive,
  FileIcon,
  FileType,
  Folder,
  Search,
  X,
} from "lucide-react";
import { useBucketContext } from "../context";
import ObjectActions from "./object-actions";
import GotoTopButton from "@/components/ui/goto-top-btn";
import Input from "@/components/ui/input";
import { useRef, useState } from "react";
import ObjectListPagination from "./object-list-pagination";
import { useDebounce } from "@/hooks/useDebounce";

const PAGE_SIZE = 100;

type Props = {
  prefix?: string;
  onPrefixChange?: (prefix: string) => void;
};

const ObjectList = ({ prefix, onPrefixChange }: Props) => {
  const { bucketName } = useBucketContext();
  const containerRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [tokens, setTokens] = useState<Array<string | undefined>>([undefined]);

  const applySearch = useDebounce((value: string) => {
    setQuery(value);
    setPage(0);
    setTokens([undefined]);
  }, 300);

  const onSearchChange = (value: string) => {
    const sanitized = value.replace(/\//g, "");
    setSearch(sanitized);
    applySearch(sanitized.trim());
  };

  const { data, error, isLoading, isFetching } = useBrowseObjects(bucketName, {
    prefix,
    search: query,
    next: tokens[page],
    limit: PAGE_SIZE,
  });

  const scrollToListTop = () => {
    containerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const onPrevPage = () => {
    if (page === 0) return;
    setPage((current) => Math.max(0, current - 1));
    scrollToListTop();
  };

  const onNextPage = () => {
    if (!data?.nextToken || isFetching) return;

    const nextToken = data.nextToken;
    setTokens((current) => {
      const next = current.slice(0, page + 1);
      next[page + 1] = nextToken;
      return next;
    });
    setPage((current) => current + 1);
    scrollToListTop();
  };

  const onObjectClick = (object: Object) => {
    window.open(API_URL + object.url + "?view=1", "_blank");
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col" ref={containerRef}>
      <div className="flex shrink-0 flex-row justify-end px-2 pb-2">
        <div className="relative w-full sm:w-72">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50"
          />
          <Input
            className="w-full pl-9 pr-9"
            placeholder="Search in this folder..."
            aria-label="Search objects by name"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {search && (
            <button
              type="button"
              aria-label="Clear search"
              className="btn btn-ghost btn-circle btn-xs absolute right-2 top-1/2 -translate-y-1/2"
              onClick={() => onSearchChange("")}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <Table>
          <Table.Head className="[&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:bg-base-100">
            <span>Name</span>
            <span>Size</span>
            <span>Last Modified</span>
            <span className="sr-only">Actions</span>
          </Table.Head>

          <Table.Body>
            {isLoading ? (
              <tr>
                <td colSpan={3}>
                  <div className="h-[320px] flex items-center justify-center">
                    <Loading />
                  </div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={3}>
                  <Alert status="error" icon={<CircleXIcon />}>
                    <span>{error.message}</span>
                  </Alert>
                </td>
              </tr>
            ) : !data?.prefixes?.length && !data?.objects?.length ? (
              <tr>
                <td className="text-center py-16" colSpan={3}>
                  {query ? "No objects found" : "No objects"}
                </td>
              </tr>
            ) : null}

            {data?.prefixes.map((prefix) => (
              <tr
                key={prefix}
                className="hover:bg-neutral/60 hover:text-neutral-content group"
              >
                <td
                  className="cursor-pointer"
                  role="button"
                  onClick={() => onPrefixChange?.(prefix)}
                >
                  <span className="flex items-center gap-2 font-normal">
                    <Folder size={20} className="text-primary" />
                    {prefix
                      .substring(0, prefix.lastIndexOf("/"))
                      .split("/")
                      .pop()}
                  </span>
                </td>
                <td colSpan={2} />
                <ObjectActions object={{ objectKey: prefix, url: "" }} />
              </tr>
            ))}

            {data?.objects.map((object, idx) => {
              const extIdx = object.objectKey.lastIndexOf(".");
              const filename =
                extIdx >= 0
                  ? object.objectKey.substring(0, extIdx)
                  : object.objectKey;
              const ext = extIdx >= 0 ? object.objectKey.substring(extIdx) : null;

              return (
                <tr
                  key={object.objectKey}
                  className="hover:bg-neutral/60 hover:text-neutral-content group"
                >
                  <td
                    className="cursor-pointer"
                    role="button"
                    onClick={() => onObjectClick(object)}
                  >
                    <span className="flex items-center font-normal w-full">
                      <FilePreview ext={ext?.substring(1)} object={object} />
                      <span className="truncate max-w-[40vw]">{filename}</span>
                      {ext && (
                        <span className="text-base-content/60">{ext}</span>
                      )}
                    </span>
                  </td>
                  <td className="whitespace-nowrap">
                    {readableBytes(object.size)}
                  </td>
                  <td className="whitespace-nowrap">
                    {dayjs(object.lastModified).fromNow()}
                  </td>
                  <ObjectActions
                    prefix={data.prefix}
                    object={object}
                    end={
                      idx >= data.objects.length - 2 && data.objects.length > 5
                    }
                  />
                </tr>
              );
            })}
          </Table.Body>
        </Table>
      </div>

      <ObjectListPagination
        page={page}
        hasNext={!!data?.nextToken}
        disabled={isFetching}
        onPrev={onPrevPage}
        onNext={onNextPage}
      />

      <GotoTopButton />
    </div>
  );
};

type FilePreviewProps = {
  ext?: string | null;
  object: Object;
};

const FilePreview = ({ ext, object }: FilePreviewProps) => {
  const type = mime.getType(ext || "")?.split("/")[0];
  let Icon = FileIcon;

  if (
    ["zip", "rar", "7z", "iso", "tar", "gz", "bz2", "xz"].includes(ext || "")
  ) {
    Icon = FileArchive;
  }

  if (type === "image") {
    const thumbnailSupport = ["jpg", "jpeg", "png", "gif"].includes(ext || "");
    return (
      <img
        src={API_URL + object.url + (thumbnailSupport ? "?thumb=1" : "?view=1")}
        alt={object.objectKey}
        className="size-5 object-cover overflow-hidden mr-2"
      />
    );
  }

  if (type === "text") {
    Icon = FileType;
  }

  return (
    <Icon
      size={20}
      className="text-base-content/60 group-hover:text-neutral-content/80 mr-2"
    />
  );
};

export default ObjectList;
