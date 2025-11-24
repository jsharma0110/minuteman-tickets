"use client";

import Image from "next/image";
import BuySellFilter from "./BuySellFilter";

type EventCardProps = {
  id: string;
  title: string;
  date: string;
  location: string;
  imageUrl: string;
};

export default function EventCard({
  id,
  title,
  date,
  location,
  imageUrl,
}: EventCardProps) {
  return (
    <div className="mb-8">
      <BuySellFilter eventId={id} />

      <div className="overflow-hidden rounded-lg border border-gray-200 shadow-md">
        <Image
          src={imageUrl}
          alt={title}
          width={500}
          height={300}
          className="w-full object-cover"
        />
        <div className="p-3 text-sm">
          <p className="font-semibold">
            {title} @ {location}
          </p>
          <p className="text-gray-500">{date}</p>
        </div>
      </div>
    </div>
  );
}
