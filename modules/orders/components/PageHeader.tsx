import Image from "next/image";

type PageHeaderProps = {
  title: string;
};

export function PageHeader({ title }: PageHeaderProps) {
  return (
    <header className="flex items-center gap-4 mb-8">
      <div className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-white shadow-lg ring-2 ring-slate-200">
        <Image
          src="/images/orion.png"
          alt="Logo Sistema Orion"
          fill
          className="object-cover"
          priority
        />
      </div>

      <div className="flex flex-col">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
          Sistema Orion
        </span>

        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          {title}
        </h1>
      </div>
    </header>
  );
}