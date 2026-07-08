type PageHeaderProps = {
  title: string;
  description: string;
};

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <header className="border-b bg-muted/30">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-14 sm:px-6 lg:px-8">
        <h1 className="max-w-4xl text-4xl leading-tight font-semibold text-balance sm:text-5xl">
          {title}
        </h1>
        <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
          {description}
        </p>
      </div>
    </header>
  );
}
