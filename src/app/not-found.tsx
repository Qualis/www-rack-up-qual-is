import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <main id="main">
      <section className="pt-20 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-6xl md:text-8xl font-bold text-primary dark:text-primary-dark mb-4">
            404
          </h1>
          <p className="text-2xl text-accent-3 dark:text-accent-1 mb-8">
            This page could not be found.
          </p>
          <Link
            href="/"
            className="inline-block bg-primary hover:bg-highlight dark:hover:bg-highlight-dark hover:text-accent-3 border-2 border-primary text-white font-bold py-3 px-6 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-center"
          >
            Back to the workout
          </Link>
        </div>
      </section>
    </main>
  );
}
