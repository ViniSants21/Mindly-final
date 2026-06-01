import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { rewardsService } from "../../services/rewardsService";
import { getIcon } from "../../lib/icons";
import { useToast } from "../../hooks/useToast";

const FILTERS = ["Tudo", "Mais XP", "Dicas"];

/* ─── Contador regressivo para boost/shield ativos ─── */
function BoostTimer({ expiresAt, label, color = "#9b59b6" }) {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const calc = () => Math.max(0, Math.floor((new Date(expiresAt) - Date.now()) / 1000));
    setTimeLeft(calc());
    const iv = setInterval(() => {
      const t = calc();
      setTimeLeft(t);
      if (t <= 0) clearInterval(iv);
    }, 1000);
    return () => clearInterval(iv);
  }, [expiresAt]);

  if (timeLeft <= 0) return null;

  const m = Math.floor(timeLeft / 60);
  const s = timeLeft % 60;

  return (
    <div className="boost-active-pill" style={{ borderColor: color, color }}>
      <span style={{ fontSize: 16 }}>{label}</span>
      <span className="boost-active-time">
        {m}:{s.toString().padStart(2, "0")}
      </span>
    </div>
  );
}

export default function Rewards() {
  const { session, user, refreshProfile } = useAuth();
  const userId = session?.user?.id;

  const [rewards, setRewards] = useState([]);
  const [filter, setFilter] = useState("Tudo");
  const [activating, setActivating] = useState(null);
  const { message, showToast } = useToast(3500);

  const coins = user?.coins ?? 0;
  const hintsCount      = user?.hints_count ?? 0;
  const boostExpiresAt  = user?.xp_boost_expires_at ?? null;
  const shieldExpiresAt = user?.xp_shield_expires_at ?? null;

  const boostActive  = boostExpiresAt  && new Date(boostExpiresAt)  > Date.now();
  const shieldActive = shieldExpiresAt && new Date(shieldExpiresAt) > Date.now();

  const load = useCallback(async () => {
    try {
      const list = await rewardsService.listRewards();
      setRewards(list);
    } catch (err) {
      console.error("Rewards:", err.message);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const nonAvatar = rewards.filter((r) => r.category !== "Avatar");
  const filtered = filter === "Tudo" ? nonAvatar : nonAvatar.filter((r) => r.category === filter);

  /* ─── Ativa recompensa consumível (Dobra XP / Proteção / Dica) ─── */
  const handleActivate = async (item) => {
    if (!userId || activating) return;
    if (coins < item.price) {
      showToast(`Moedas insuficientes. Você tem ${coins} moedas.`);
      return;
    }
    setActivating(item.id);
    try {
      const res = await rewardsService.activate(userId, item.id);
      showToast(res.message);
      if (res.success) await refreshProfile();
    } catch (err) {
      showToast("Erro: " + err.message);
    } finally {
      setActivating(null);
    }
  };

  return (
    <div className="section rewards-section">
      <div className="section-title">
        <div className="bar" />
        <h2>Recompensas</h2>
      </div>

      {/* ── Saldo de moedas + contadores ativos ── */}
      <div className="rewards-top">
        <div className="coins-box" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {getIcon("coins", { size: 20 })} {coins} moedas
        </div>
        <div className="boost-indicators">
          {hintsCount > 0 && (
            <div className="boost-active-pill" style={{ borderColor: "#f59a3c", color: "#f59a3c" }}>
              💡 {hintsCount} {hintsCount === 1 ? "dica" : "dicas"}
            </div>
          )}
          {boostActive && (
            <BoostTimer expiresAt={boostExpiresAt} label="⚡ Dobra XP" color="#9b59b6" />
          )}
          {shieldActive && (
            <BoostTimer expiresAt={shieldExpiresAt} label="🛡️ Proteção" color="#3f7fe3" />
          )}
        </div>
      </div>

      <div className="filters">
        {FILTERS.map((f) => (
          <span key={f} className={filter === f ? "active" : ""} onClick={() => setFilter(f)}>
            {f}
          </span>
        ))}
      </div>

      <hr />

      <div className="rewards-grid">
        {filtered.map((item) => {
          const canAfford    = coins >= item.price;
          const missing      = item.price - coins;
          const isActivating = activating === item.id;

          /* ── Estado especial: boost/shield já ativo ── */
          let alreadyActive = false;
          if (item.name?.includes("Dobra") || item.name?.includes("XP")) alreadyActive = boostActive;
          if (item.name?.includes("Prote")) alreadyActive = shieldActive;

          let cardClass = "reward-card";
          if (item.locked)      cardClass += " locked-reward";
          else if (!canAfford)  cardClass += " cant-afford";
          if (alreadyActive)    cardClass += " boost-running";

          /* ── Label do botão ── */
          let btnLabel;
          if (item.locked)      btnLabel = "🔒 Bloqueado";
          else if (isActivating) btnLabel = "Ativando…";
          else if (alreadyActive) btnLabel = "✓ Ativo";
          else if (!canAfford)  btnLabel = `Faltam ${missing} moedas`;
          else                  btnLabel = `Ativar · ${item.price} moedas`;

          const isDisabled = item.locked || isActivating || alreadyActive || !canAfford;

          return (
            <div key={item.id} className={cardClass}>
              <div className="icon" style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                {getIcon(item.icon, { size: 32 })}
              </div>
              <h4 style={{ margin: "8px 0 4px", fontSize: 14, color: "var(--navy)" }}>{item.name}</h4>
              <p style={{ fontSize: 11, color: "var(--gray-soft)", marginBottom: 8, lineHeight: 1.4 }}>
                {item.name?.includes("Dobra") || item.name?.includes("XP")
                  ? "2× XP por 20 min"
                  : item.name?.includes("Prote")
                  ? "Sem perda de XP por 20 min"
                  : "Adiciona 1 dica ao inventário"}
              </p>
              {!canAfford && !item.locked && (
                <span className="reward-missing">Você tem {coins} moedas</span>
              )}
              <button
                onClick={() => handleActivate(item)}
                disabled={isDisabled}
                className={!canAfford && !item.locked && !alreadyActive ? "btn-cant-afford" : ""}
              >
                {btnLabel}
              </button>
            </div>
          );
        })}
      </div>

      {message && <div className="toast">{message}</div>}
    </div>
  );
}
