let s = "";
process.stdin.on("data", (d) => (s += d));
process.stdin.on("end", () => {
  const j = JSON.parse(s);
  for (const t of ["light", "dark"]) {
    const x = j[t];
    console.log(
      t,
      JSON.stringify({
        bodyBg: x.bodyBg,
        scroll: x.scrollW + "/" + x.clientW,
        ovf: x.horizontalOverflow,
        ovfs: x.overflowers.length,
        topOverflowers: x.overflowers.slice(0, 3).map((o) => o.tag + "." + o.cls.slice(0, 50)),
        cardBorder: x.cardBorder,
        hardShadow: x.hardShadowCount,
        thick: x.thickBorders,
        iconBtns: x.iconBtnVisible,
        wideSearch: x.wideSearchVisible,
        radiusZero: x.radiusZero,
      })
    );
  }
});
