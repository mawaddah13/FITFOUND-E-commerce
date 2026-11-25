import Link from 'next/link';
import { Instrument_Serif } from 'next/font/google';

const heroSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  display: 'swap',
});

export default function Hero() {
  return (
    <section className="w-full bg-(--abuhero) border-b border-neutral-200/80 overflow-hidden">
      <div className="w-full max-w-[1200px] mx-auto px-6 md:px-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 lg:h-[calc(100svh-5rem)] lg:min-h-[540px]">
        <div className="lg:col-span-7 self-center pt-12 lg:pt-0 lg:pb-10">
          <h1
            className={`${heroSerif.className} text-[56px] sm:text-7xl lg:text-[88px] font-normal uppercase leading-[0.9] tracking-tight text-neutral-950`}
          >
            Find Your Fit,
            <br />
            <span className="italic">Own</span> Your Style
          </h1>

          <p className="mt-7 text-[11px] sm:text-xs uppercase tracking-[0.18em] leading-relaxed text-neutral-600 max-w-md">
            Find Your Perfect Fit, Whatever Your Style
            <br />
            Discover styles for every part of your day
          </p>

          {/* tombol langsung ke All Products (HP n desktop sama) */}
          <Link
            href="/products"
            className="mt-8 inline-flex items-center gap-3 px-6 py-3 bg-neutral-950 text-white text-[11px] font-medium uppercase tracking-[0.18em] hover:bg-neutral-800 transition-colors duration-300"
          >
            Discover Collection →
          </Link>
        </div>

        <div className="lg:col-span-5 relative h-[460px] sm:h-[520px] lg:h-full overflow-hidden">
          <img
            src="/images/hero.png"
            alt="FITFOUND Fashion Collection"
            className="absolute top-4 left-1/2 -translate-x-1/2 h-[125%] w-auto max-w-none"
          />

          <span aria-hidden="true" className="absolute right-0 top-8 text-6xl md:text-7xl leading-none text-neutral-950">
            ✦
          </span>
          <span aria-hidden="true" className="absolute left-0 bottom-32 text-4xl md:text-5xl leading-none text-neutral-950">
            ✦
          </span>
        </div>
      </div>
    </section>
  );
}