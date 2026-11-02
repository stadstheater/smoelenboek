import Image from "next/image";

/** Logo volgens de huisstijl: wit in het donker thema, basis-paars in het licht thema */
export function Logo({ width, height }: { width: number; height: number }) {
  return (
    <>
      <Image src="/logo-stadstheater.svg" alt="Stadstheater Zoetermeer" width={width} height={height} priority className="bij-donker" />
      <Image src="/logo-stadstheater-paars.svg" alt="Stadstheater Zoetermeer" width={width} height={height} priority className="bij-licht" />
    </>
  );
}
