import { SupplierOptions } from "@/constants/categories"

export function Categories() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <h2 className="text-3xl font-bold">Suppliers for every part of the day</h2>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        From the venue to the last giveaway, find the people who make an event run.
      </p>
      <ul className="mt-8 flex flex-wrap gap-2">
        {SupplierOptions.map((option) => (
          <li
            key={option.value}
            className="rounded-full border bg-card px-4 py-2 text-sm font-medium transition-colors hover:border-primary hover:text-primary"
          >
            {option.label}
          </li>
        ))}
      </ul>
    </section>
  )
}
