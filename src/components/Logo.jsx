import Link from 'next/link';

export default function Logo({ href = '/', onClick, subtitle = '', className = '', scroll = true }) {
  let subtitleBadge = null;
  if (subtitle) {
    subtitleBadge = (
      <span className="hidden sm:inline-block ml-1 px-2.5 py-1 rounded-full bg-neutral-900 text-white text-[10px] font-semibold tracking-wider uppercase">
        {subtitle}
      </span>
    );
  }

  return (
    <Link href={href} scroll={scroll} onClick={onClick} className={`group inline-flex items-center gap-2.5 shrink-0 ${className}`}>
      <img
        src="/images/logo.png"
        alt="FITFOUND"
        className="h-7 md:h-8 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
      />
      <span className="font-bold tracking-[0.2em] text-neutral-900 text-base md:text-lg uppercase">FITFOUND</span>
      {subtitleBadge}
    </Link>
  );
}