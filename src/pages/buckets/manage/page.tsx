import { useParams } from "react-router-dom";
import { useBucket, useBucketCors } from "./hooks";
import Page from "@/context/page-context";
import TabView, { Tab } from "@/components/containers/tab-view";
import {
  ChartLine,
  CircleXIcon,
  FolderSearch,
  LockKeyhole,
} from "lucide-react";
import OverviewTab from "./overview/overview-tab";
import PermissionsTab from "./permissions/permissions-tab";
import MenuButton from "./components/menu-button";
import BrowseTab from "./browse/browse-tab";
import { BucketContext } from "./context";
import { Alert, Loading } from "react-daisyui";

const tabs: Tab[] = [
  {
    name: "overview",
    title: "Overview",
    icon: ChartLine,
    Component: OverviewTab,
  },
  {
    name: "permissions",
    title: "Permissions",
    icon: LockKeyhole,
    Component: PermissionsTab,
  },
  {
    name: "browse",
    title: "Browse",
    icon: FolderSearch,
    Component: BrowseTab,
  },
];

const ManageBucketPage = () => {
  const { id } = useParams();
  const { data, error, isLoading, refetch } = useBucket(id);
  const { data: cors, isLoading: corsLoading } = useBucketCors(
    data?.globalAliases[0]
  );

  const name = data?.globalAliases[0];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <Page
        title={name || "Manage Bucket"}
        prev="/buckets"
        actions={data ? <MenuButton /> : undefined}
      />

      {isLoading && (
        <div className="flex flex-1 items-center justify-center">
          <Loading size="lg" />
        </div>
      )}

      {error != null && (
        <Alert status="error" className="shrink-0" icon={<CircleXIcon />}>
          <span>{error.message}</span>
        </Alert>
      )}

      {data && !corsLoading && (
        <div className="container flex min-h-0 flex-1 flex-col">
          <BucketContext.Provider
            value={{
              bucket: data,
              cors: cors ?? {
                allowedMethods: [],
                allowedOrigins: [],
                allowedHeaders: [],
                exposeHeaders: [],
                maxAgeSeconds: null
              },
              refetch,
              bucketName: name || "",
            }}
          >
            <TabView
              tabs={tabs}
              className="bg-base-100 h-14 shrink-0 px-1.5"
              contentClassName="mt-4 flex min-h-0 flex-1 flex-col"
            />
          </BucketContext.Provider>
        </div>
      )}
    </div>
  );
};

export default ManageBucketPage;
