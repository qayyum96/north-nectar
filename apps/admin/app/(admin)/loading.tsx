/** "Dashboard · Loading" from the mockup: grey skeleton blocks while data loads. */
function Bar({ className }: { className: string }) {
  return <span className={`block animate-pulse rounded-[6px] bg-[#ececea] ${className}`} />;
}

export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="border-admin-line bg-admin-panel sticky top-14 z-[15] border-b">
        <div className="mx-auto max-w-[1320px] px-4 pt-[14px] pb-5 md:px-8 md:pt-[18px]">
          <Bar className="h-4 w-32" />
          <Bar className="mt-3 h-7 w-48" />
          <Bar className="mt-2 h-4 w-72" />
        </div>
      </div>
      <div className="mx-auto max-w-[1320px] px-4 md:px-8">
        <div className="flex flex-col gap-4 pt-4 md:pt-5">
          <div className="border-admin-line grid grid-cols-2 gap-px overflow-hidden rounded-[12px] border bg-white md:grid-cols-5">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="flex flex-col gap-2 px-5 py-[18px]">
                <Bar className="h-4 w-24" />
                <Bar className="h-7 w-32" />
                <Bar className="h-4 w-20" />
              </div>
            ))}
          </div>
          <div className="border-admin-line rounded-[12px] border bg-white p-5">
            <Bar className="h-4 w-40" />
            <Bar className="mt-4 h-[180px] w-full md:h-[260px]" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {[0, 1].map((k) => (
              <div
                key={k}
                className="border-admin-line flex flex-col gap-4 rounded-[12px] border bg-white p-5"
              >
                {Array.from({ length: 4 }, (_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Bar className="size-10 shrink-0" />
                    <div className="flex flex-1 flex-col gap-2">
                      <Bar className="h-4 w-3/4" />
                      <Bar className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
