"use client";

export default function SearchBar() {
  return (
    <div className="my-4">
      <input
        type="text"
        placeholder="Search"
        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
      />
    </div>
  );
}