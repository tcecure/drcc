type FAQAccordionProps = {
  items: {
    question: string;
    answer: string;
  }[];
};

export function FAQAccordion({ items }: FAQAccordionProps) {
  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <details
          key={item.question}
          className="group rounded-lg border bg-card p-5 text-card-foreground shadow-sm"
        >
          <summary className="cursor-pointer list-none font-medium outline-none marker:hidden">
            <span className="flex items-center justify-between gap-4">
              {item.question}
              <span className="text-xl leading-none text-muted-foreground group-open:rotate-45">
                +
              </span>
            </span>
          </summary>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            {item.answer}
          </p>
        </details>
      ))}
    </div>
  );
}
