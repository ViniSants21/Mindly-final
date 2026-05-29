import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { rewardsService } from "../../services/rewardsService";
import { getIcon } from "../../lib/icons";
import { useToast } from "../../hooks/useToast";

const FILTERS = ["Tudo", "Mais XP", "Dicas", "Avatar"];

export default function Rewards() {
  const { session, user, refreshProfile } = useAuth();
  const userId = session?.user?.id;

  const [rewards, setRewards] = useState([]);
  const [owned, setOwned] = useState([]);
  const [filter, setFilter] = useState("Tudo");
  const { message, showToast } = useToast();

  const coins = user?.coins ?? 0;

  const load = useCallback(async () => {
    try {
      const [list, ownedIds] = await Promise.all([
        rewardsService.listRewards(),
        userId ? rewardsService.listOwned(userId) : Promise.resolve([]),
      ]);
      setRewards(list);
      setOwned(ownedIds);
    } catch (err) {
      console.error("Rewards:", err.message);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered =
    filter === "Tudo" ? rewards : rewards.filter((r) => r.category === filter);

  const handleBuy = async (item) => {
    if (!userId) return;
    if (owned.includes(item.id)) {
      showToast("Você já possui este item");
      return;
    }
    try {
      const res = await rewardsService.purchase(userId, item.id);
      showToast(res.message);
      if (res.success) {
        await refreshProfile();
        setOwned((prev) => [...prev, item.id]);
      }
    } catch (err) {
      showToast("Erro: " + err.message);
    }
  };

  return (
    <div className="section rewards-section">
      <div className="section-title">
        <div className="bar" />
        <h2>Recompensas</h2>
      </div>

      <div className="rewards-top">
        <div
          className="coins-box"
          style={{ display: "flex", alignItems: "center", gap: 8 }}
        >
          {getIcon("coins", { size: 20 })} {coins} moedas
        </div>
      </div>

      <div className="filters">
        {FILTERS.map((f) => (
          <span
            key={f}
            className={filter === f ? "active" : ""}
            onClick={() => setFilter(f)}
          >
            {f}
          </span>
        ))}
      </div>

      <hr />

      <div className="rewards-grid">
        {filtered.map((item) => {
          const isOwned    = owned.includes(item.id);
          const canAfford  = coins >= item.price;
          const isDisabled = isOwned || item.locked || !canAfford;
          const missing    = item.price - coins;

          let cardClass = "reward-card";
          if (item.locked)           cardClass += " locked-reward";
          else if (isOwned)          cardClass += " owned-reward";
          else if (!canAfford)       cardClass += " cant-afford";

          let btnLabel;
          if (isOwned)       btnLabel = "✓ Adquirido";
          else if (item.locked) btnLabel = "🔒 Bloqueado";
          else if (!canAfford)  btnLabel = `Faltam ${missing} moedas`;
          else                  btnLabel = `${item.price} moedas`;

          return (
            <div key={item.id} className={cardClass}>
              <div
                className="icon"
                style={{ display: "flex", justifyContent: "center", alignItems: "center" }}
              >
                {getIcon(item.icon, { size: 32 })}
              </div>
              <p>{item.name}</p>
              {!canAfford && !isOwned && !item.locked && (
                <span className="reward-missing">Você tem {coins} moedas</span>
              )}
              <button
                onClick={() => handleBuy(item)}
                disabled={isDisabled}
                className={!canAfford && !isOwned && !item.locked ? "btn-cant-afford" : ""}
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
