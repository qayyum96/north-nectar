"use client";

import { PlayIcon } from "@northnectar/ui";
import Image from "next/image";
import { useState } from "react";
import { images, videos } from "@/lib/images";

/**
 * Centre card of the story showcase: the flat-lay photo with label and play button (mockup), which
 * swaps to the story video on click. The video is only downloaded at that point.
 */
export function StoryPlayer({ label, title }: { label: string; title: string }) {
  const [playing, setPlaying] = useState(false);
  const poster = images.home.valleyFlatlay;

  if (playing) {
    return (
      // Silent footage with no speech to caption. Add a <track> if a narrated version is supplied.
      <video
        className="absolute inset-0 h-full w-full object-cover"
        src={videos.story.src}
        poster={videos.story.poster.src}
        controls
        autoPlay
        playsInline
        muted
      />
    );
  }

  return (
    <>
      <Image
        src={poster.src}
        alt={poster.alt}
        fill
        sizes="(min-width: 768px) 580px, 86vw"
        className="object-cover object-[center_38%]"
      />
      <span className="absolute top-4 left-1/2 -translate-x-1/2 rounded-full bg-white/[0.92] px-[14px] py-[6px] font-display text-[15px] leading-[23px] font-semibold tracking-[0.06em] whitespace-nowrap text-[#0f2a1a] uppercase">
        {label}
      </span>
      <button
        type="button"
        data-mag
        onClick={() => setPlaying(true)}
        className="absolute top-[52%] left-1/2 inline-flex size-[76px] -translate-1/2 cursor-pointer items-center justify-center rounded-full bg-[#f4a12e] text-[#1b1a12] shadow-[0_0_0_12px_rgba(244,161,46,0.25),0_16px_30px_rgba(0,0,0,0.3)] md:size-28"
      >
        <PlayIcon size={34} />
        <span className="sr-only">
          Play video: {title} ({videos.story.durationLabel})
        </span>
      </button>
    </>
  );
}
