import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { plannerService } from "../services/plannerService";
import { useToast } from "../hooks/useToast";
import "../styles/planner.css";

const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
const monthNames = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const formatDateKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export default function Planner() {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const { message: toastMsg, showToast } = useToast(3500);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [form, setForm] = useState({ time: "", subject: "", color: "#3b82f6" });
  const [editing, setEditing] = useState(null);

  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  // -------------------------------------------------------------------
  // Carrega todos os blocos do usuário (apenas na montagem / troca de userId)
  // -------------------------------------------------------------------
  const loadBlocks = useCallback(async () => {
    // BUG FIX: sempre finaliza o loading, mesmo sem userId
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await plannerService.listAll(userId);
      setBlocks(data);
    } catch (err) {
      console.error("[Planner] loadBlocks:", err);
      showToast(
        "Erro ao carregar horários: " +
          (err?.message ?? "verifique sua conexão e recarregue a página")
      );
    } finally {
      // BUG FIX: sempre chamado, nunca deixa o loading preso
      setLoading(false);
    }
  }, [userId, showToast]);

  useEffect(() => {
    loadBlocks();
  }, [loadBlocks]);

  // Timer da pausa
  useEffect(() => {
    if (!isRunning) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isRunning]);

  const selectedKey = formatDateKey(selectedDate);
  const todaySchedule = blocks
    .filter((b) => b.date === selectedKey)
    .sort((a, b) => a.time.localeCompare(b.time));

  // -------------------------------------------------------------------
  // Salvar (criar ou editar)
  //
  // BUG FIX PRINCIPAL: antes, handleSave chamava `await loadBlocks()`
  // ANTES de fechar o modal. Se o loadBlocks travasse (query pendente),
  // o modal ficava aberto e o loading nunca terminava — loading infinito.
  //
  // Correção: usamos atualização otimista de estado com o dado retornado
  // pelo próprio INSERT/UPDATE. O modal fecha imediatamente. Nenhuma
  // query extra é disparada, e o loading da lista não é tocado.
  // -------------------------------------------------------------------
  const handleSave = async () => {
    if (!form.time || !form.subject) return;

    // BUG FIX: feedback claro em vez de retorno silencioso
    if (!userId) {
      showToast("Sessão expirada. Saia e entre novamente.");
      return;
    }

    // Validação de conflito de horário — impede duas atividades no mesmo horário
    const conflict = todaySchedule.find(
      (b) => b.time === form.time && (!editing || b.id !== editing.id)
    );
    if (conflict) {
      showToast(
        `Conflito de horário: já existe "${conflict.subject}" às ${form.time}. Escolha outro horário.`
      );
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        const updated = await plannerService.update(editing.id, form);
        // Atualização otimista: troca o bloco antigo pelo atualizado
        setBlocks((prev) =>
          prev.map((b) => (b.id === editing.id ? updated : b))
        );
      } else {
        const created = await plannerService.create(userId, {
          date: selectedKey,
          ...form,
        });
        // Atualização otimista: insere o novo bloco diretamente no estado
        setBlocks((prev) => [...prev, created]);
      }

      // Fecha o modal IMEDIATAMENTE — sem dependência de query extra
      setShowAddModal(false);
      setForm({ time: "", subject: "", color: "#3b82f6" });
      setEditing(null);
      showToast("Horário salvo com sucesso!");
    } catch (err) {
      console.error("[Planner] handleSave:", err);
      const detail = err?.message ?? "erro desconhecido";

      // Mensagens amigáveis para os erros mais comuns do Supabase / Postgres
      if (detail.includes("row-level security")) {
        showToast(
          "Permissão negada (RLS). Verifique se o schema foi aplicado no Supabase."
        );
      } else if (detail.includes("foreign key") || detail.includes("violates")) {
        showToast(
          "Erro de integridade: perfil não encontrado. Execute o schema.sql no Supabase e tente novamente."
        );
      } else if (detail.includes("does not exist") || detail.includes("42P01")) {
        showToast(
          "Tabela não encontrada. Execute o schema.sql no Supabase SQL Editor."
        );
      } else if (detail.includes("Tempo esgotado")) {
        showToast(detail);
      } else {
        showToast("Erro ao salvar: " + detail);
      }
      // Modal permanece aberto para o usuário tentar novamente
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (block) => {
    setForm({ time: block.time, subject: block.subject, color: block.color });
    setEditing(block);
    setShowAddModal(true);
  };

  const handleDelete = async (block) => {
    try {
      await plannerService.remove(block.id);
      // Remoção otimista: remove do estado imediatamente
      setBlocks((prev) => prev.filter((b) => b.id !== block.id));
      showToast("Horário excluído.");
    } catch (err) {
      console.error("[Planner] handleDelete:", err);
      showToast("Erro ao excluir: " + (err?.message ?? "tente novamente"));
    }
  };

  const startPause = (minutes) => {
    setTimeLeft(minutes * 60);
    setIsRunning(true);
    setShowPauseModal(false);
  };

  const formatTime = (t) => {
    const m = Math.floor(t / 60);
    const s = t % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Geração do calendário
  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate();
  const firstDay = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  ).getDay();

  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);

  const isEnding = timeLeft <= 10;
  const todayKey = formatDateKey(new Date());

  return (
    <section className="planner">
      <div className="planner-container">
        <h1>Monte seu planejamento, organize seus horários</h1>

        <div className="planner-content">
          {/* CALENDÁRIO */}
          <div className="calendar-section">
            <div className="calendar-header">
              <button
                onClick={() =>
                  setCurrentDate(
                    new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)
                  )
                }
                className="nav-btn"
              >
                <ChevronLeft size={20} />
              </button>
              <h2>
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <button
                onClick={() =>
                  setCurrentDate(
                    new Date(currentDate.getFullYear(), currentDate.getMonth() + 1)
                  )
                }
                className="nav-btn"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            <div className="calendar-weekdays">
              {dayNames.map((d) => (
                <div key={d} className="weekday-name">
                  {d}
                </div>
              ))}
            </div>

            <div className="calendar-grid">
              {calendarDays.map((day, index) => {
                if (!day) return <div key={index} className="calendar-day empty" />;
                const key = formatDateKey(
                  new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
                );
                const hasSchedule = blocks.some((b) => b.date === key);
                const cls = [
                  "calendar-day",
                  key === selectedKey ? "selected" : "",
                  key === todayKey ? "today" : "",
                  hasSchedule ? "has-schedule" : "",
                ]
                  .filter(Boolean)
                  .join(" ");
                return (
                  <div
                    key={index}
                    className={cls}
                    onClick={() =>
                      setSelectedDate(
                        new Date(
                          currentDate.getFullYear(),
                          currentDate.getMonth(),
                          day
                        )
                      )
                    }
                  >
                    {day}
                    {hasSchedule && <div className="day-indicator">•</div>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* HORÁRIOS DO DIA */}
          <div className="schedule-section">
            <div className="schedule-header">
              <h3>
                {selectedDate.toLocaleDateString("pt-BR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </h3>
            </div>

            <div className="schedule-list">
              {loading ? (
                <p className="empty">Carregando…</p>
              ) : todaySchedule.length === 0 ? (
                <p className="empty">Nenhum horário cadastrado neste dia.</p>
              ) : (
                todaySchedule.map((item) => (
                  <div key={item.id} className="schedule-item">
                    <div className="schedule-time">{item.time}</div>
                    <div
                      className="schedule-subject"
                      style={{ backgroundColor: item.color }}
                    >
                      {item.subject}
                    </div>
                    <div className="schedule-actions">
                      <button className="btn-small" onClick={() => handleEdit(item)}>
                        Editar
                      </button>
                      <button
                        className="btn-small danger"
                        onClick={() => handleDelete(item)}
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="actions">
              <button onClick={() => setShowAddModal(true)} className="btn-add">
                + adicionar horário
              </button>
              <button onClick={() => setShowPauseModal(true)} className="btn-pause">
                Fazer pausa
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* TOAST — notificações de feedback para o usuário */}
      {toastMsg && <div className="planner-toast">{toastMsg}</div>}

      {/* TIMER FULLSCREEN */}
      {isRunning && (
        <div className="timer-overlay">
          <div className="timer-box">
            <h2>Pausa em andamento</h2>
            <span className={`timer-big ${isEnding ? "ending" : ""}`}>
              {formatTime(timeLeft)}
            </span>
            <button className="btn-stop" onClick={() => setIsRunning(false)}>
              Encerrar pausa
            </button>
          </div>
        </div>
      )}

      {/* MODAL ADICIONAR / EDITAR */}
      {showAddModal && !isRunning && (
        <div className="modal">
          <div className="modal-content">
            <h2>{editing ? "Editar horário" : "Adicionar horário"}</h2>
            <input
              type="time"
              value={form.time}
              onChange={(e) => setForm({ ...form, time: e.target.value })}
              disabled={saving}
            />
            <input
              placeholder="Disciplina"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              disabled={saving}
            />
            <input
              type="color"
              value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
              disabled={saving}
            />
            <div className="modal-buttons">
              <button onClick={handleSave} disabled={saving}>
                {saving ? "Salvando…" : "Salvar"}
              </button>
              <button
                disabled={saving}
                onClick={() => {
                  setShowAddModal(false);
                  setEditing(null);
                  setForm({ time: "", subject: "", color: "#3b82f6" });
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PAUSA */}
      {showPauseModal && !isRunning && (
        <div className="modal">
          <div className="modal-content">
            <h2>Tempo de pausa</h2>
            <div className="pause-options">
              <button onClick={() => startPause(5)}>5 min</button>
              <button onClick={() => startPause(10)}>10 min</button>
              <button onClick={() => startPause(15)}>15 min</button>
            </div>
            <button className="cancel-btn" onClick={() => setShowPauseModal(false)}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
