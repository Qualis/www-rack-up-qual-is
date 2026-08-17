type Props = {
  href: string;
  exerciseName: string;
};

export function DemoLink({ href, exerciseName }: Props) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-sm text-primary underline underline-offset-2 hover:no-underline dark:text-primary-dark"
    >
      Demo
      <span className="sr-only"> for {exerciseName}, opens in a new tab</span>
    </a>
  );
}
