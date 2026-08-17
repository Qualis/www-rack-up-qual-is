import { WorkoutApp } from "@/app/_components/workout/workout-app";
import { programContainer } from "@/infrastructure/di/programContainer";

export default function Index() {
  return (
    <main id="main">
      <WorkoutApp program={programContainer.getProgramService().getProgram()} />
    </main>
  );
}
