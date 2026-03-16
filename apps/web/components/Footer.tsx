'use client';

export default function Footer() {
  return (
    <footer className="bg-neutral-950 text-gray-400 text-center py-4">
      <p>&copy; {new Date().getFullYear()} Online Exhibit. All rights reserved.</p>
    </footer>
  );
}
