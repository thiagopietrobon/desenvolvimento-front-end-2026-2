import { carregarTarefas } from "./api.js";
import { renderizarEstado } from "./estados.js";
import { instalarEventosDoQuadro } from "./renderizacao.js";

const CHAVE_TAREFAS = "gerenciador-academico-tarefas";
const STATUS_LABELS = { "a-fazer": "A Fazer", "em-andamento": "Em Andamento", "em-revisao": "Em Revisão", concluida: "Concluída" };
const estado = { tarefas: [], busca: "", status: "todos", prioridade: "todas", ordenacao: "prazo-asc", carregamento: true, erro: null };
let temporizadorAviso;
function mostrarAviso(mensagem, tipo = "sucesso") {
    let aviso = document.getElementById("aviso-acoes");
    if (!aviso) { aviso = document.createElement("div"); aviso.id = "aviso-acoes"; aviso.setAttribute("role", "status"); aviso.setAttribute("aria-live", "polite"); Object.assign(aviso.style, { position: "fixed", right: "20px", bottom: "20px", zIndex: "10000", maxWidth: "min(420px, calc(100vw - 40px))", padding: "14px 18px", borderRadius: "12px", boxShadow: "0 8px 28px rgba(20, 30, 60, .18)", fontWeight: "700", background: "#fff", color: "#20243a", border: "1px solid #dfe4ef" }); document.body.append(aviso); }
    aviso.textContent = mensagem; aviso.style.borderLeft = tipo === "erro" ? "4px solid #d94b5b" : "4px solid #27966f"; aviso.hidden = false; clearTimeout(temporizadorAviso); temporizadorAviso = setTimeout(() => { aviso.hidden = true; }, 3500);
}
function obterTarefasDerivadas() {
    const termo = estado.busca.trim().toLocaleLowerCase("pt-BR");
    const filtradas = estado.tarefas.filter((t) => String(t.titulo ?? "").toLocaleLowerCase("pt-BR").includes(termo) && (estado.status === "todos" || t.status === estado.status) && (estado.prioridade === "todas" || t.prioridade === estado.prioridade));
    return [...filtradas].sort((a, b) => { const parse = (d) => { const n = d ? Date.parse(`${d}T00:00:00`) : NaN; return Number.isNaN(n) ? Number.POSITIVE_INFINITY : n; }; const delta = parse(a.prazo) - parse(b.prazo); return estado.ordenacao === "prazo-asc" ? delta : -delta; });
}
function atualizarProgresso() {
    const total = estado.tarefas.length, concluidas = estado.tarefas.filter((t) => t.status === "concluida").length, pct = total ? Math.round(concluidas / total * 100) : 0;
    const el = document.getElementById("progresso-percentual"), resumo = document.getElementById("progresso-resumo"), barra = document.getElementById("barra-progresso"), preenchimento = document.getElementById("barra-progresso-preenchimento");
    if (el) el.textContent = `${pct}%`; if (resumo) resumo.textContent = `${concluidas} de ${total} ${total === 1 ? "tarefa concluída" : "tarefas concluídas"}`; if (barra) barra.setAttribute("aria-valuenow", String(pct)); if (preenchimento) preenchimento.style.width = `${pct}%`;
    document.querySelectorAll("[data-progresso-status]").forEach((item) => { const n = obterTarefasDerivadas().filter((t) => t.status === item.dataset.progressoStatus).length; item.textContent = `${n} ${n === 1 ? "tarefa" : "tarefas"}${estado.status !== "todos" || estado.prioridade !== "todas" || estado.busca.trim() ? " visíveis" : ""}`; });
}
function atualizarChips() {
    const area = document.getElementById("filtros-ativos"); if (!area) return; area.replaceChildren(); const filtros = [];
    if (estado.busca.trim()) filtros.push(["busca", `Busca: ${estado.busca.trim()}`]); if (estado.status !== "todos") filtros.push(["status", `Status: ${STATUS_LABELS[estado.status] || estado.status}`]); if (estado.prioridade !== "todas") filtros.push(["prioridade", `Prioridade: ${estado.prioridade}`]);
    filtros.forEach(([tipo, texto]) => { const chip = document.createElement("span"); chip.className = "filtro-chip"; const span = document.createElement("span"); span.textContent = texto; const btn = document.createElement("button"); btn.type = "button"; btn.textContent = "×"; btn.setAttribute("aria-label", `Remover filtro ${texto}`); btn.addEventListener("click", () => { if (tipo === "busca") { estado.busca = ""; document.getElementById("busca-titulo").value = ""; } if (tipo === "status") { estado.status = "todos"; document.getElementById("status-todos").checked = true; } if (tipo === "prioridade") { estado.prioridade = "todas"; document.getElementById("prioridade-todas").checked = true; } renderizar(); }); chip.append(span, btn); area.append(chip); });
}
function renderizar() { renderizarEstado(estado, obterTarefasDerivadas()); atualizarProgresso(); atualizarChips(); }
function persistirTarefas() { try { localStorage.setItem(CHAVE_TAREFAS, JSON.stringify(estado.tarefas)); return true; } catch (erro) { console.error("Falha ao persistir tarefas", erro); return false; } }
function obterTarefasSalvas() { try { const raw = localStorage.getItem(CHAVE_TAREFAS); if (!raw) return null; const dados = JSON.parse(raw); return Array.isArray(dados) ? dados : null; } catch (erro) { console.error("Falha ao recuperar tarefas", erro); return null; } }
function salvarTarefa(atualizada) { const i = estado.tarefas.findIndex((t) => String(t.id) === String(atualizada.id)); if (i < 0) return; estado.tarefas[i] = { ...estado.tarefas[i], ...atualizada }; const ok = persistirTarefas(); renderizar(); mostrarAviso(ok ? "Alterações salvas neste navegador." : "Alterações aplicadas, mas não foi possível salvá-las neste navegador.", ok ? "sucesso" : "erro"); }
function excluirTarefa(id) { const n = estado.tarefas.length; estado.tarefas = estado.tarefas.filter((t) => String(t.id) !== String(id)); if (n === estado.tarefas.length) return; const ok = persistirTarefas(); renderizar(); mostrarAviso(ok ? "Tarefa excluída." : "Tarefa removida da tela, mas não foi possível salvar.", ok ? "sucesso" : "erro"); }
function instalarEventosFiltros() {
    const form = document.getElementById("form-filtros"), busca = document.getElementById("busca-titulo"), ordenacao = document.getElementById("ordenacao-prazo"), limpar = document.getElementById("btn-limpar"); if (!form) return;
    form.addEventListener("submit", (e) => e.preventDefault()); busca?.addEventListener("input", (e) => { estado.busca = e.target.value; renderizar(); });
    form.addEventListener("change", (e) => { const c = e.target; if (c.name === "status") estado.status = c.value; else if (c.name === "prioridade") estado.prioridade = c.value; else if (c.name === "ordenacao") estado.ordenacao = c.value; else return; renderizar(); });
    limpar?.addEventListener("click", () => { estado.busca = ""; estado.status = "todos"; estado.prioridade = "todas"; estado.ordenacao = "prazo-asc"; if (busca) busca.value = ""; if (ordenacao) ordenacao.value = "prazo-asc"; document.getElementById("status-todos").checked = true; document.getElementById("prioridade-todas").checked = true; renderizar(); busca?.focus(); });
}
function instalarNavegacaoMobile() {
    const menu = document.getElementById("btn-menu"), sidebar = document.getElementById("sidebar"), sombra = document.getElementById("sidebar-sombra");
    const fechar = () => { sidebar?.classList.remove("aberta"); sombra?.classList.remove("visivel"); if (sombra) sombra.hidden = true; menu?.setAttribute("aria-expanded", "false"); menu?.setAttribute("aria-label", "Abrir menu"); };
    menu?.addEventListener("click", () => { const aberto = sidebar.classList.toggle("aberta"); if (sombra) { sombra.hidden = !aberto; sombra.classList.toggle("visivel", aberto); } menu.setAttribute("aria-expanded", String(aberto)); menu.setAttribute("aria-label", aberto ? "Fechar menu" : "Abrir menu"); }); sombra?.addEventListener("click", fechar); sidebar?.querySelectorAll("a").forEach((a) => a.addEventListener("click", fechar));
    const abas = [...document.querySelectorAll("[data-aba]")], colunas = [...document.querySelectorAll("[data-coluna]")];
    const ativar = (status) => { abas.forEach((a) => { const on = a.dataset.aba === status; a.classList.toggle("ativa", on); a.setAttribute("aria-selected", String(on)); }); colunas.forEach((c) => c.classList.toggle("coluna--ativa", c.dataset.coluna === status)); };
    abas.forEach((a) => a.addEventListener("click", () => ativar(a.dataset.aba))); ativar("a-fazer");
}
async function iniciarApp() {
    const quadro = document.querySelector("[data-quadro]"); if (quadro) instalarEventosDoQuadro(quadro, obterTarefasDerivadas, salvarTarefa, excluirTarefa);
    instalarEventosFiltros(); instalarNavegacaoMobile(); estado.carregamento = true; renderizar();
    try { const originais = await carregarTarefas(); estado.tarefas = obterTarefasSalvas() ?? originais; }
    catch (erro) { estado.erro = erro; const salvas = obterTarefasSalvas(); if (salvas) { estado.tarefas = salvas; estado.erro = null; } }
    finally { estado.carregamento = false; renderizar(); }
}
iniciarApp();