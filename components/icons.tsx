import React from "react";

type IconProps = React.SVGProps<SVGSVGElement>;

function base(children: React.ReactNode, props: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {children}
    </svg>
  );
}

export const IconDashboard = (p: IconProps) =>
  base(<><rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" /></>, p);

export const IconLeads = (p: IconProps) =>
  base(<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>, p);

export const IconPipeline = (p: IconProps) =>
  base(<><path d="M3 3h18v4l-7 7v6l-4-2v-4L3 7V3z" /></>, p);

export const IconFollowup = (p: IconProps) =>
  base(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></>, p);

export const IconIntegrations = (p: IconProps) =>
  base(<><rect x="2" y="9" width="6" height="6" rx="1" /><rect x="16" y="9" width="6" height="6" rx="1" /><path d="M8 12h8" /></>, p);

export const IconTeam = (p: IconProps) =>
  base(<><circle cx="9" cy="7" r="4" /><path d="M2 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2" /><path d="M17 3.5a4 4 0 0 1 0 7.5" /><path d="M21 21v-2a4 4 0 0 0-3-3.87" /></>, p);

export const IconLogout = (p: IconProps) =>
  base(<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></>, p);

export const IconPlus = (p: IconProps) => base(<><path d="M12 5v14M5 12h14" /></>, p);
export const IconSearch = (p: IconProps) => base(<><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></>, p);
export const IconClose = (p: IconProps) => base(<><path d="M18 6L6 18M6 6l12 12" /></>, p);
export const IconCheck = (p: IconProps) => base(<><path d="M20 6L9 17l-5-5" /></>, p);
export const IconChevronRight = (p: IconProps) => base(<><path d="M9 18l6-6-6-6" /></>, p);
export const IconPhone = (p: IconProps) => base(<><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></>, p);
export const IconSparkles = (p: IconProps) => base(<><path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3z" /><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z" /></>, p);
export const IconAlert = (p: IconProps) => base(<><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><path d="M12 9v4" /><path d="M12 17h.01" /></>, p);
export const IconTrash = (p: IconProps) => base(<><path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></>, p);
export const IconCopy = (p: IconProps) => base(<><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></>, p);
export const IconRefresh = (p: IconProps) => base(<><path d="M23 4v6h-6" /><path d="M1 20v-6h6" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></>, p);
export const IconChart = (p: IconProps) => base(<><path d="M3 3v18h18" /><rect x="7" y="12" width="3" height="6" /><rect x="12.5" y="8" width="3" height="10" /><rect x="18" y="5" width="3" height="13" /></>, p);
export const IconBolt = (p: IconProps) => base(<><path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" /></>, p);
export const IconWallet = (p: IconProps) => base(<><rect x="2" y="6" width="20" height="14" rx="2" /><path d="M2 10h20" /><circle cx="17" cy="14" r="1.5" /></>, p);
export const IconTruck = (p: IconProps) => base(<><rect x="1" y="7" width="14" height="10" rx="1" /><path d="M15 10h4l3 3v4h-7" /><circle cx="6" cy="19" r="2" /><circle cx="17" cy="19" r="2" /></>, p);
export const IconBell = (p: IconProps) => base(<><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></>, p);
export const IconHistory = (p: IconProps) => base(<><path d="M3 3v5h5" /><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" /><path d="M12 7v5l4 2" /></>, p);
export const IconChat = (p: IconProps) => base(<><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></>, p);
export const IconShield = (p: IconProps) =>
  base(<><path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z" /><path d="M9 12l2 2 4-4" /></>, p);
export const IconFile = (p: IconProps) =>
  base(<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M9 13h6" /><path d="M9 17h6" /></>, p);
export const IconBuilding = (p: IconProps) =>
  base(<><rect x="4" y="2" width="16" height="20" rx="1" /><path d="M9 6h1M14 6h1M9 10h1M14 10h1M9 14h1M14 14h1" /><path d="M10 22v-4h4v4" /></>, p);
