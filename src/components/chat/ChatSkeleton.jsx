export default function ChatSkeleton() {
  return (
    <div className="w-full h-[calc(100vh-9.5rem)] lg:h-[calc(100vh-5.5rem)] bg-zm-card rounded-2xl border border-zm-border overflow-hidden flex animate-pulse">
      <div className="w-full sm:w-80 border-r border-zm-border flex flex-col shrink-0">
        <div className="p-3 border-b border-zm-border">
          <div className="h-5 w-24 rounded bg-zm-hover mb-3" />
          <div className="h-9 rounded-full bg-zm-hover" />
        </div>
        <div className="flex-1 flex flex-col">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2.5">
              <div className="w-12 h-12 rounded-full bg-zm-hover shrink-0" />
              <div className="min-w-0 flex-1 flex flex-col gap-2">
                <div className="h-3 w-24 rounded bg-zm-hover" />
                <div className="h-2.5 w-32 rounded bg-zm-hover" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="hidden sm:flex flex-1 flex-col min-w-0">
        <div className="flex items-center gap-3 px-4 h-16 border-b border-zm-border shrink-0">
          <div className="w-10 h-10 rounded-full bg-zm-hover shrink-0" />
          <div className="flex flex-col gap-2">
            <div className="h-3 w-28 rounded bg-zm-hover" />
            <div className="h-2.5 w-16 rounded bg-zm-hover" />
          </div>
        </div>

        <div className="flex-1 p-4 flex flex-col gap-3 bg-zm-bg/40">
          <div className="h-9 w-1/3 rounded-2xl bg-zm-hover self-start" />
          <div className="h-9 w-1/4 rounded-2xl bg-zm-hover self-end" />
          <div className="h-9 w-2/5 rounded-2xl bg-zm-hover self-start" />
        </div>

        <div className="p-3 border-t border-zm-border">
          <div className="h-10 rounded-full bg-zm-hover" />
        </div>
      </div>
    </div>
  );
}
