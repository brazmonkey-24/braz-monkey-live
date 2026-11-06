export const DISCLAIMER_TITLE = "⚠️ OLHA AQUI, MEU PARÇA: O PAPO RETO DO MACACO";
export const DISCLAIMER_PARAGRAPHS = [
  "A fita que rola nessa plataforma é só pra te dar uma luz e clarear tua mente. É puramente informativo e educacional, sacou? Tudo o que a gente joga aqui é na maior boa intenção, de coração aberto. Mas ó, o papo é o seguinte: a gente não garante porra nenhuma sobre as informações estarem 100% certas, completas ou atualizadas.",
  "Se você seguir o que tá escrito aqui e der ruim, a culpa é toda sua, irmão. Se o pneu furar, a casa cair ou você perder uma grana, não vem chorar as pitangas no nosso pé de árvore. A gente se isenta de qualquer B.O., perda ou dano que você arrumar pra sua vida inventando de botar fé no nosso conteúdo.",
  "Usa por sua conta e risco, malandro! 🐒🍌",
] as const;

export function FooterDisclaimer() {
  return <aside className="footer-public-note" aria-labelledby="footer-disclaimer-title" lang="pt-BR">
    <h2 id="footer-disclaimer-title">{DISCLAIMER_TITLE}</h2>
    {DISCLAIMER_PARAGRAPHS.map((text) => <p key={text}>{text}</p>)}
    <p className="footer-privacy-note" lang="en">Site telemetry counts page views and STORE clicks in aggregate, without cookies or visitor profiles. No IP addresses, personal identifiers or full referrer URLs are stored. Do Not Track and Global Privacy Control are respected.</p>
  </aside>;
}
