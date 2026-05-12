export function RecoveryRings() {
  return (
      <div className="relative flex h-[430px] w-[430px] items-center justify-center">
        {/* Outer circles */}
        <div className="absolute h-[400px] w-[400px] rounded-full border-[3px] border-[#91D3C8]/35" />
        <div className="absolute h-[320px] w-[320px] rounded-full border-[3px] border-[#BBB1E9]/35" />
        <div className="absolute h-[250px] w-[250px] rounded-full border-[3px] border-[#EFB4AD]/35" />
        <div className="absolute h-[170px] w-[170px] rounded-full border-[3px] border-[#91D3C8]/45" />

      {/* Center gradient orb */}
      <div className="absolute h-28 w-28 rounded-full bg-gradient-to-br from-[#76D9AD] to-[#5B9FDA] shadow-[0_20px_60px_rgba(76,154,180,0.35)]" />
    </div>
  );
}