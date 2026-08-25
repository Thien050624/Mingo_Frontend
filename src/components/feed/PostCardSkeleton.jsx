export default function PostCardSkeleton() {
  return (
    <div className="relative bg-zm-card rounded-2xl border border-zm-border mb-5 overflow-hidden animate-pulse">
      <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-zm-border" />

      <div className="flex items-center gap-2.5 p-3 pb-2">
        <div className="w-10 h-10 rounded-full bg-zm-hover shrink-0" />
        <div className="flex flex-col gap-1.5">
          <div className="h-3 w-32 rounded bg-zm-hover" />
          <div className="h-2.5 w-20 rounded bg-zm-hover" />
        </div>
      </div>

      <div className="px-3 pb-3 flex flex-col gap-1.5">
        <div className="h-3 w-full rounded bg-zm-hover" />
        <div className="h-3 w-2/3 rounded bg-zm-hover" />
      </div>

      <div className="w-full h-64 bg-zm-hover" />

      <div className="px-3 pt-2 flex items-center justify-between">
        <div className="h-2.5 w-16 rounded bg-zm-hover" />
        <div className="h-2.5 w-20 rounded bg-zm-hover" />
      </div>

      <div className="mx-3 my-1.5 border-t border-zm-border" />

      <div className="px-2 pb-2 flex items-center gap-2">
        <div className="h-8 flex-1 rounded-lg bg-zm-hover" />
        <div className="h-8 flex-1 rounded-lg bg-zm-hover" />
        <div className="h-8 flex-1 rounded-lg bg-zm-hover" />
      </div>
    </div>
  );
}
