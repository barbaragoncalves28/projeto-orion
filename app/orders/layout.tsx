import { DashboardShell } from "@/components/sidebar/DashboardShell";

export default function OrdersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell>{children}</DashboardShell>;
}
