import { FooterNavigation } from "@/components/molecules/footer-navigation";

export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-8 text-sm text-muted-foreground sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <p className="max-w-xl">
            DigitalRCC helps students and community organizations build
            practical cybersecurity resilience.
          </p>
          <FooterNavigation />
        </div>
        <p className="text-xs">
          Customer Delivery Zone access is isolated from normal student access.
        </p>
      </div>
    </footer>
  );
}
