import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  CalendarPlus,
  ListChecks,
  FileBarChart,
  Zap,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useEvents } from "@/lib/events-store";

const nav = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Novo evento", url: "/events/new", icon: CalendarPlus },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const isActive = (u: string) => (u === "/" ? pathname === "/" : pathname.startsWith(u));
  const events = useEvents();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-3">
          <img src="/logo-conexao.png" alt="Conexão VIP Logo" className="h-9 w-auto max-w-[140px] object-contain" />
          <div className="min-w-0 leading-tight group-data-[collapsible=icon]:hidden">
            <div className="truncate font-display text-xs font-semibold text-sidebar-foreground">
              Painel de Eventos
            </div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {nav.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link to={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {events.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Eventos recentes</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {events.slice(0, 6).map((e) => (
                  <SidebarMenuItem key={e.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname.includes(`/events/${e.id}`)}
                      tooltip={e.name}
                    >
                      <Link
                        to="/events/$id/checklist"
                        params={{ id: e.id }}
                        className="flex items-center gap-2"
                      >
                        <ListChecks className="h-4 w-4" />
                        <span className="truncate">{e.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <div className="px-2 pb-2 text-[11px] leading-relaxed text-sidebar-foreground/50 group-data-[collapsible=icon]:hidden">
          <div className="flex items-center gap-1">
            <FileBarChart className="h-3 w-3" />
            <span>Checklist operacional</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
