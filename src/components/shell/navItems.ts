import type { StaticImageData } from "next/image";
import ClassroomIcon from "../../../public/images/myclassroom.png";
import DemoIcon from "../../../public/images/examsactive.png";
import HomeIcon from "../../../public/images/home.png";

export interface NavItem {
  href: string;
  label: string;
  icon: StaticImageData;
}

/** What a teacher who is signed in sees. */
export const TEACHER_NAV: NavItem[] = [
  { href: "/classes", label: "My Classes", icon: ClassroomIcon },
  { href: "/demo", label: "Demo", icon: DemoIcon },
];

/** What a visitor trying the demo sees. */
export const GUEST_NAV: NavItem[] = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/demo", label: "Demo", icon: DemoIcon },
];

export function isActive(href: string, pathname: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
