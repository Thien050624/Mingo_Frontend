import PostCardSkeleton from "../feed/PostCardSkeleton";

export default function ProfileSkeleton() {
  return (
    <div className="max-w-4xl mx-auto animate-pulse">
      <div className="bg-zm-card rounded-2xl border border-zm-border overflow-hidden mb-4">
        <div className="px-4 sm:px-8 pt-8 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full ring-4 ring-zm-card bg-zm-hover mx-auto sm:mx-0 shrink-0" />
            <div className="flex-1 flex flex-col gap-3 items-center sm:items-start">
              <div className="h-7 w-40 rounded bg-zm-hover" />
              <div className="flex gap-2">
                <div className="h-6 w-24 rounded-full bg-zm-hover" />
                <div className="h-6 w-24 rounded-full bg-zm-hover" />
                <div className="h-6 w-28 rounded-full bg-zm-hover" />
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="h-9 w-40 rounded-lg bg-zm-hover" />
              <div className="h-9 w-9 rounded-lg bg-zm-hover" />
            </div>
          </div>

          <div className="h-9 w-full max-w-md rounded-full bg-zm-hover mt-5 mx-auto sm:mx-0" />
        </div>
      </div>

      <div>
        <PostCardSkeleton />
        <PostCardSkeleton />
      </div>
    </div>
  );
}
