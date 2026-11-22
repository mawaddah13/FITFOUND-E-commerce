'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LogoutButton from '@/components/LogoutButton';
import Logo from '@/components/Logo';

// isi halamanny dashboard, nav, sidebar, header
export default function DashboardShell({
  title = '',
  subtitle = '',
  links = [],
  groups = null,
  children,
  panelLabel = '',
  homeHref = '/',
  topAction = null,
  profile = null,
}) {
  const pathname = usePathname();

  let menuGroups = [{ title: '', links }];
  if (groups) {
    menuGroups = groups;
  }

  const allLinks = [];
  for (const groupItem of menuGroups) {
    for (const navLink of groupItem.links) {
      allLinks.push(navLink);
    }
  }

  // cek menu mana yg lagi aktif, pilih yg paling cocok sama url skrg
  function isActive(targetHref) {
    const matchesPath = pathname === targetHref || pathname.startsWith(`${targetHref}/`);
    if (!matchesPath) {
      return false;
    }

    const hasLongerMatch = allLinks.some(function findLongerRoute(otherLink) {
      const isLonger = otherLink.href.length > targetHref.length;
      const matchesOther =
        pathname === otherLink.href || pathname.startsWith(`${otherLink.href}/`);
      return isLonger && matchesOther;
    });

    return !hasLongerMatch;
  }

  let profileBox = null;
  if (profile) {
    let profileTargetHref = homeHref;
    if (profile.href) {
      profileTargetHref = profile.href;
    }

    let avatarElement = (
      <span className="w-9 h-9 rounded-full bg-neutral-900 text-white text-sm font-semibold flex items-center justify-center">
        {profile.name.charAt(0).toUpperCase()}
      </span>
    );
    if (profile.image) {
      avatarElement = (
        <img
          src={profile.image}
          alt={profile.name}
          className="w-9 h-9 rounded-full object-cover border border-neutral-200"
        />
      );
    }

    profileBox = (
      <Link
        href={profileTargetHref}
        className="flex items-center gap-2.5 pl-3 border-l border-neutral-200 group"
      >
        {avatarElement}
        <span className="hidden sm:block text-sm font-medium text-neutral-800 max-w-40 truncate group-hover:underline underline-offset-4">
          {profile.name}
        </span>
      </Link>
    );
  }

  let topBar = null;
  if (panelLabel) {
    topBar = (
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-4">
          <Logo href={homeHref} subtitle={panelLabel} />
          <div className="flex items-center gap-3">
            {topAction}
            {profileBox}
          </div>
        </div>
      </header>
    );
  }

  // bentuk satu link menu navigasi badge jumlah kalau ada
  function buildNavLink(navLink) {
    let linkClass =
      'group shrink-0 inline-flex items-center px-4 py-2.5 rounded-xl text-sm whitespace-nowrap transition-all duration-200 ';

    if (isActive(navLink.href)) {
      linkClass += 'bg-neutral-950 text-white font-medium shadow-sm';
    } else {
      linkClass += 'text-neutral-950 hover:bg-white hover:shadow-sm lg:hover:pl-5';
    }

    let badgeElement = null;
    if (navLink.badge) {
      badgeElement = (
        <span className="ml-2 inline-flex items-center justify-center min-w-5 h-5 px-1.5 text-[10px] font-semibold rounded-full bg-(--biru) text-white">
          {navLink.badge}
        </span>
      );
    }

    return (
      <Link key={navLink.href} href={navLink.href} className={linkClass}>
        {navLink.label}
        {badgeElement}
      </Link>
    );
  }

  let asideStickyClass = 'lg:sticky lg:top-40';
  if (panelLabel) {
    asideStickyClass = 'lg:sticky lg:top-24';
  }

  let titleBlock = null;
  if (title) {
    titleBlock = (
      <div className="mb-4 lg:mb-6">
        <p className="text-[11px] uppercase tracking-wider text-neutral-950">{subtitle}</p>
        <h1 className="text-lg font-semibold text-neutral-950 truncate">{title}</h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-(--abumuda)">
      {topBar}

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-10 grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6 lg:gap-10">
        <aside className={`self-start ${asideStickyClass}`}>
          {titleBlock}

          <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 -mx-4 px-4 lg:mx-0 lg:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {menuGroups.map(function buildMenuGroup(groupItem, groupIndex) {
              let groupKey = groupIndex;
              if (groupItem.title) {
                groupKey = groupItem.title;
              }

              let groupHeading = null;
              if (groupItem.title) {
                groupHeading = (
                  <p className="hidden lg:block px-4 pb-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-950 underline underline-offset-4 decoration-neutral-950 cursor-default select-none">
                    {groupItem.title}
                  </p>
                );
              }

              return (
                <div
                  key={groupKey}
                  className="flex lg:flex-col gap-1 lg:[&:not(:first-child)]:mt-4"
                >
                  {groupHeading}
                  {groupItem.links.map(buildNavLink)}
                </div>
              );
            })}

            <div className="shrink-0 lg:mt-4 lg:pt-4 lg:border-t lg:border-neutral-200">
              <LogoutButton className="w-full text-left px-4 py-2.5 rounded-xl text-sm text-red-600 hover:bg-red-50 lg:hover:pl-5 transition-all duration-200 cursor-pointer whitespace-nowrap" />
            </div>
          </nav>
        </aside>

        <main key={pathname} className="min-w-0 animate-page-in">
          {children}
        </main>
      </div>
    </div>
  );
}