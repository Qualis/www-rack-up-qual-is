type Props = {
  markup: string;
};

export function WorkoutIllustration({ markup }: Props) {
  return (
    <div
      aria-hidden="true"
      data-testid="workout-illustration"
      className="shrink-0 rounded-md border border-primary/10 bg-white p-1 [&>svg]:h-auto [&>svg]:w-full [&>svg]:max-w-[180px]"
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}
