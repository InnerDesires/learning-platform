// Instant skeleton shown while a course overview renders — mirrors its layout.
export default function Loading() {
  return (
    <div className="animate-pulse pb-16">
      <div className="container max-w-5xl pb-12 pt-14">
        <div className="mb-4 h-6 w-28 rounded-full bg-muted" />
        <div className="mb-3 h-11 w-3/4 rounded bg-muted" />
        <div className="mb-2 h-4 w-2/3 rounded bg-muted/60" />
        <div className="mb-8 h-4 w-1/2 rounded bg-muted/60" />
        <div className="flex flex-wrap items-center gap-4">
          <div className="h-12 w-56 rounded-full bg-muted" />
          <div className="h-4 w-24 rounded bg-muted/60" />
          <div className="h-4 w-24 rounded bg-muted/60" />
        </div>
      </div>
      <div className="container max-w-5xl mt-8">
        <div className="mb-4 h-7 w-40 rounded bg-muted" />
        <div className="grid gap-2.5">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center gap-4 rounded-xl border border-line bg-card px-5 py-3.5"
            >
              <div className="h-9 w-9 flex-none rounded-full bg-muted" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-4 w-1/2 rounded bg-muted" />
                <div className="h-3 w-28 rounded bg-muted/60" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
