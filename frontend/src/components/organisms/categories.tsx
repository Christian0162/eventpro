import { SupplierOptions } from "@/constants/categories"

/** Example photos (Wikimedia Commons, free licences) in SupplierOptions order. */
const PHOTOS = Array.from({ length: 10 }, (_, i) => `/landing/c${i + 1}.jpg`)

export function Categories() {
  return (
    <section id="suppliers" className="mx-auto max-w-7xl scroll-mt-20 px-4 pb-20 sm:px-6">
      <div className="flex items-center gap-6">
        <h2 className="text-2xl font-extrabold uppercase">Suppliers for every part of the day</h2>
        <span className="h-px flex-1 bg-border" />
      </div>
      <ul className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {SupplierOptions.slice(0, 10).map((option, i) => (
          <li
            key={option.value}
            className="group relative flex aspect-[4/5] items-end overflow-hidden rounded-2xl bg-secondary p-4"
          >
            <img
              src={PHOTOS[i]}
              alt=""
              loading="lazy"
              className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <span className="relative text-sm font-bold uppercase leading-tight text-white transition-transform group-hover:-translate-y-1">
              {option.label}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
