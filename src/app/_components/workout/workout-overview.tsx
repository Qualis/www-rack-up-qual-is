import cn from "classnames";
import { Program } from "@/interfaces/program";

type Props = {
  program: Program;
};

export function WorkoutOverview({ program }: Props) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <section
        aria-labelledby="schedule-heading"
        className="rounded-lg border border-primary/15 p-4"
      >
        <h2 id="schedule-heading" className="text-xl font-bold">
          Weekly schedule
        </h2>
        <table className="mt-3 w-full text-left text-sm">
          <thead>
            <tr className="text-accent-3/60 dark:text-accent-1/60">
              <th scope="col" className="pb-2 font-medium">
                Day
              </th>
              <th scope="col" className="pb-2 font-medium">
                Session
              </th>
            </tr>
          </thead>
          <tbody>
            {program.schedule.map((entry) => (
              <tr key={entry.day} className="border-t border-primary/10">
                <th scope="row" className="py-2 font-medium">
                  {entry.day}
                </th>
                <td
                  className={cn("py-2", {
                    "text-accent-3/60 dark:text-accent-1/60":
                      entry.type === "rest",
                  })}
                >
                  {entry.session}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section
        aria-labelledby="notes-heading"
        className="rounded-lg border border-primary/15 p-4"
      >
        <h2 id="notes-heading" className="text-xl font-bold">
          Notes
        </h2>
        <dl className="mt-3 space-y-3 text-sm">
          {Object.entries(program.notes).map(([topic, note]) => (
            <div key={topic}>
              <dt className="font-medium capitalize">
                {topic.replace(/([A-Z])/g, " $1").toLowerCase()}
              </dt>
              <dd className="text-accent-3/70 dark:text-accent-1/70">{note}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
