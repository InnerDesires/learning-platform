// Instant skeleton shown while an article renders — mirrors the PostHero layout.
export default function Loading() {
  return (
    <article className="animate-pulse pb-16">
      <div className="container py-14">
        <div className="mx-auto max-w-4xl">
          <div className="mb-4 flex gap-1.5">
            <div className="h-6 w-24 rounded-full bg-muted" />
            <div className="h-6 w-20 rounded-full bg-muted/60" />
          </div>
          <div className="mb-3 h-10 w-4/5 rounded bg-muted" />
          <div className="mb-5 h-10 w-3/5 rounded bg-muted" />
          <div className="mb-8 mt-5 flex items-center gap-6">
            <div className="h-4 w-28 rounded bg-muted/60" />
            <div className="h-4 w-24 rounded bg-muted/60" />
          </div>
          <div className="aspect-video w-full rounded-2xl bg-muted/50" />
        </div>
      </div>
      <div className="container pt-2">
        <div className="mx-auto max-w-4xl space-y-3">
          <div className="h-4 w-full rounded bg-muted/50" />
          <div className="h-4 w-full rounded bg-muted/50" />
          <div className="h-4 w-11/12 rounded bg-muted/50" />
          <div className="h-4 w-3/5 rounded bg-muted/50" />
        </div>
      </div>
    </article>
  )
}
