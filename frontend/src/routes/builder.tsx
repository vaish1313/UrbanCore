import { createFileRoute } from "@tanstack/react-router";
import { RoleWorkspace } from "@/components/urbancore/role/RoleWorkspace";

export const Route = createFileRoute("/builder")({
  head: () => ({
    meta: [{ title: "UrbanCore — Builder Intelligence Workspace" }],
  }),
  component: BuilderRouteLayout,
});

function BuilderRouteLayout() {
  return <RoleWorkspace role="builder" onBack={() => window.history.back()} />;
}
