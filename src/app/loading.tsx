import { LogoMark } from "@/components/layout/Logo";

export default function Loading() {
  return (
    <div className="grid min-h-[80svh] place-items-center" role="status" aria-label="Loading">
      <LogoMark className="glow-pulse size-16" />
    </div>
  );
}
