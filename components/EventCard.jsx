import Image from "next/image";
import BuySellFilter from "./BuySellFilter";

export default function EventCard({ title, date, location, imageUrl, id }) {
  const event = { title, date, location, imageUrl, id };
  return (
    <div className="mb-8">
      <BuySellFilter umassEvent={event} />
      <div className="rounded-lg overflow-hidden shadow-md border border-gray-200">
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