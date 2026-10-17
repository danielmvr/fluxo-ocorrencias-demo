/* Fluxo de Ocorrências Demo — repositório exclusivo deste navegador.
   Dados sintéticos, sem clientes de rede, credenciais ou integrações externas. */
(function () {
  "use strict";

  var KEY = "rotaDemo.ocorrencias.v1";
  var STATUS = {
    aberta: { id: "aberta", label: "Aberta", cor: "#3a6ea5", icone: "!", ordem: 1, ativo: true },
    em_rota: { id: "em_rota", label: "Socorro em rota", cor: "#7b4fb0", icone: ">", ordem: 2, ativo: true },
    em_atendimento: { id: "em_atendimento", label: "Em atendimento", cor: "#caa017", icone: "*", ordem: 3, ativo: true },
    aguardando: { id: "aguardando", label: "Aguardando", cor: "#c75c1e", icone: "~", ordem: 4, ativo: true },
    finalizada: { id: "finalizada", label: "Finalizada", cor: "#2e8b57", icone: "v", ordem: 5, ativo: false }
  };
  var STATUS_ATIVOS = ["aberta", "em_rota", "em_atendimento", "aguardando"];
  var URGENCIA = { ok: 30, atencao: 60, critico: 180 };
  var db;

  function uid() { return Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8); }
  function nowISO() { return new Date().toISOString(); }
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function pad(n) { return n < 10 ? "0" + n : String(n); }
  function ymdLocal(iso) { var d = new Date(iso); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function horaHM(iso) { var d = new Date(iso); return pad(d.getHours()) + ":" + pad(d.getMinutes()); }
  function montarInicio(d, h) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d || "") || !/^\d{2}:\d{2}$/.test(h || "")) return null;
    var ms = Date.parse(d + "T" + h + ":00");
    if (isNaN(ms) || ymdLocal(ms) !== d || horaHM(ms) !== h) return null;
    return new Date(ms).toISOString();
  }
  function montarFim(dataFim, horaFim, inicio, fimAtual) {
    var dia = dataFim || (fimAtual ? ymdLocal(fimAtual) : ymdLocal(inicio));
    var fim = montarInicio(dia, horaFim);
    if (!fim) return null;
    if (new Date(fim).getTime() < new Date(inicio).getTime()) {
      // Sem data explícita, uma hora menor corresponde ao dia seguinte.
      if (dataFim) throw new Error("O término deve ocorrer após a quebra.");
      var d = new Date(fim); d.setDate(d.getDate() + 1); fim = d.toISOString();
    }
    return fim;
  }
  function seedCadastros() {
    var seed = window.SEED || {}, cad = {};
    ["frota", "regionais", "gerentes", "localidades", "pontosApoio", "linhas"].forEach(function (key) {
      cad[key] = clone(seed[key] || []);
    });
    return cad;
  }
  function seedVersao() { return (window.SEED && window.SEED.cadastrosVersao) || 1; }
  function defaults() {
    var seed = window.SEED || {};
    return validarDados({
      ocorrencias: typeof seed.criarOcorrencias === "function" ? seed.criarOcorrencias() : [],
      cadastros: seedCadastros(),
      meta: { criadoEm: nowISO(), versao: 1, cadastrosVersao: seedVersao(), sintetico: true }
    });
  }
  function objeto(value) { return value !== null && typeof value === "object" && !Array.isArray(value); }
  function texto(value) { return value == null ? "" : String(value); }
  function validarDados(input) {
    if (!objeto(input) || !Array.isArray(input.ocorrencias) || !objeto(input.cadastros)) throw new Error("Backup deve conter ocorrências e cadastros.");
    if (input.ocorrencias.length > 10000) throw new Error("O limite da demonstração é de 10.000 ocorrências.");
    var safe = clone(input), ids = Object.create(null);
    safe.ocorrencias.forEach(function (o) {
      if (!objeto(o) || !/^[A-Za-z0-9_-]{1,100}$/.test(o.id || "") || ids[o.id]) throw new Error("ID de ocorrência inválido ou duplicado.");
      ids[o.id] = true;
      if (!Object.prototype.hasOwnProperty.call(STATUS, o.status)) throw new Error("Status de ocorrência inválido.");
      ["abertaEm", "inicioEm", "socorroEm", "finalizadaEm"].forEach(function (key) {
        if (o[key] && (typeof o[key] !== "string" || !isFinite(Date.parse(o[key])))) throw new Error("Data inválida: " + key);
      });
      if (!o.abertaEm) throw new Error("Ocorrência sem data de abertura.");
      if (o.status === "finalizada" && !o.finalizadaEm) throw new Error("Ocorrência finalizada sem data de término.");
      if (!Array.isArray(o.eventos)) throw new Error("Linha do tempo inválida.");
      o.eventos.forEach(function (e) {
        if (!objeto(e) || typeof e.ts !== "string" || !isFinite(Date.parse(e.ts)) || typeof e.texto !== "string") throw new Error("Evento inválido.");
      });
      ["pausaMs", "pausaMecanicaMs"].forEach(function (key) {
        if (o[key] != null && (typeof o[key] !== "number" || !isFinite(o[key]) || o[key] < 0)) throw new Error("Duração de pausa inválida.");
      });
      CAMPOS.forEach(function (key) {
        if (o[key] != null && typeof o[key] !== "string" && typeof o[key] !== "number") throw new Error("Campo inválido: " + key);
        o[key] = texto(o[key]);
      });
      ["dataOcorrencia", "dataViagem", "terminoData"].forEach(function (key) {
        if (o[key] && !/^\d{4}-\d{2}-\d{2}$/.test(o[key])) throw new Error("Data de formulário inválida.");
      });
      ["horaQuebra", "horarioViagem", "terminoSocorro"].forEach(function (key) {
        if (o[key] && !/^([01]\d|2[0-3]):[0-5]\d$/.test(o[key])) throw new Error("Hora de formulário inválida.");
      });
    });
    ["frota", "regionais", "gerentes", "localidades", "pontosApoio", "linhas"].forEach(function (key) {
      if (!Array.isArray(safe.cadastros[key])) throw new Error("Cadastro inválido: " + key);
      if (safe.cadastros[key].length > 10000) throw new Error("Cadastro excede o limite da demonstração.");
    });
    ["linhas", "regionais"].forEach(function (key) {
      if (safe.cadastros[key].some(function (value) { return typeof value !== "string"; })) throw new Error("Cadastro textual inválido: " + key);
    });
    ["frota", "gerentes", "localidades", "pontosApoio"].forEach(function (key) {
      if (safe.cadastros[key].some(function (value) { return !objeto(value); })) throw new Error("Cadastro inválido: " + key);
      safe.cadastros[key].forEach(function (value) {
        Object.keys(value).forEach(function (campo) {
          if (value[campo] != null && typeof value[campo] !== "string" && typeof value[campo] !== "number") throw new Error("Campo de cadastro inválido.");
          value[campo] = texto(value[campo]);
        });
        var principal = key === "frota" ? "veiculo" : key === "localidades" ? "sigla" : "nome";
        if (!value[principal]) throw new Error("Cadastro sem " + principal + ".");
      });
    });
    safe.meta = objeto(safe.meta) ? safe.meta : {};
    safe.meta.sintetico = true;
    return safe;
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(db)); }
    catch (e) { console.error("Não foi possível salvar a demonstração neste navegador.", e); }
  }
  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      db = raw ? validarDados(JSON.parse(raw)) : defaults();
      if (db.meta.cadastrosVersao !== seedVersao()) {
        db.cadastros = seedCadastros(); db.meta.cadastrosVersao = seedVersao();
      }
    } catch (e) { console.warn("Demonstração reiniciada: armazenamento inválido.", e); db = defaults(); }
    save();
  }
  function duracaoMs(o, ate) {
    var inicio = new Date(o.inicioEm || o.abertaEm).getTime();
    var fim = new Date(o.socorroEm || o.finalizadaEm || ate || Date.now()).getTime();
    return Math.max(0, fim - inicio - (o.pausaMs || 0));
  }
  function duracaoSecundariaMs(o, ate) {
    return Math.max(0, new Date(o.finalizadaEm || ate || Date.now()).getTime() - new Date(o.inicioEm || o.abertaEm).getTime() - (o.pausaMecanicaMs || 0));
  }
  function nivelUrgencia(ms) {
    var min = ms / 60000;
    return min < URGENCIA.ok ? "ok" : min < URGENCIA.atencao ? "atencao" : min < URGENCIA.critico ? "critico" : "extremo";
  }
  function buscarVeiculo(codigo) {
    var alvo = texto(codigo).trim().toUpperCase();
    return db.cadastros.frota.find(function (v) { return texto(v.veiculo).toUpperCase() === alvo; }) || null;
  }
  function evento(o, mensagem, tipo) {
    o.eventos.push({ ts: nowISO(), tipo: tipo || "status", texto: mensagem });
  }
  function retomar(o) {
    // Mantém o instante real da quebra para a linha do tempo e exclui a pausa.
    var paradoEm = o.socorroEm || o.finalizadaEm;
    if (paradoEm) o.pausaMs = (o.pausaMs || 0) + Math.max(0, Date.now() - Date.parse(paradoEm));
    if (o.finalizadaEm) o.pausaMecanicaMs = (o.pausaMecanicaMs || 0) + Math.max(0, Date.now() - Date.parse(o.finalizadaEm));
    o.finalizadaEm = null; o.socorroEm = null; o.terminoSocorro = ""; o.terminoData = ""; delete o.duracaoMs;
  }
  function derivarVeiculo(o) {
    var v = buscarVeiculo(o.carro);
    o.regional = v ? v.regional : ""; o.placa = v ? v.placa : "";
    o.capacidade = v ? v.capacidade : ""; o.modelo = v ? v.modelo : "";
  }
  var CAMPOS = ["carro", "carroSegue", "motorista", "matricula", "linha", "localSocorro", "dataViagem", "horarioViagem", "qtdClientes", "encomendas", "alimentacaoFornecida", "defeitoMotorista", "responsavelManutencao", "saidaSocorro", "gerenteRegional", "coordenador", "obs", "servico", "dataOcorrencia", "horaQuebra", "terminoSocorro", "terminoData"];
  function aplicarCampos(o, dados) {
    CAMPOS.forEach(function (key) { if (Object.prototype.hasOwnProperty.call(dados, key)) o[key] = texto(dados[key]); });
  }
  var Store = {
    STATUS: STATUS, STATUS_ATIVOS: STATUS_ATIVOS, URGENCIA: URGENCIA,
    listarAtivas: function () { return db.ocorrencias.filter(function (o) { return o.status !== "finalizada"; }).sort(function (a, b) { return Date.parse(a.abertaEm) - Date.parse(b.abertaEm); }); },
    listarFinalizadas: function () { return db.ocorrencias.filter(function (o) { return o.status === "finalizada"; }).sort(function (a, b) { return Date.parse(b.finalizadaEm) - Date.parse(a.finalizadaEm); }); },
    listarTodas: function () { return db.ocorrencias.slice(); },
    obter: function (id) { return db.ocorrencias.find(function (o) { return o.id === id; }) || null; },
    criar: function (dados) {
      var o = {};
      CAMPOS.forEach(function (key) { o[key] = ""; });
      o.encomendas = "Não"; o.alimentacaoFornecida = "Não";
      aplicarCampos(o, dados || {});
      o.id = uid(); o.status = "aberta"; o.abertaEm = nowISO(); o.finalizadaEm = null; o.socorroEm = null; o.pausaMs = 0; o.pausaMecanicaMs = 0;
      o.inicioEm = montarInicio(o.dataOcorrencia, o.horaQuebra) || o.abertaEm;
      derivarVeiculo(o); o.eventos = []; evento(o, "Ocorrência aberta", "abertura");
      db.ocorrencias.push(o); save(); return o;
    },
    atualizar: function (id, patch) {
      var anterior = this.obter(id); if (!anterior) return null;
      // Valida em cópia: erro de data não pode deixar uma edição parcial.
      var o = clone(anterior); aplicarCampos(o, patch || {});
      if (patch && Object.prototype.hasOwnProperty.call(patch, "carro")) derivarVeiculo(o);
      o.inicioEm = montarInicio(o.dataOcorrencia, o.horaQuebra) || o.abertaEm;
      if (o.finalizadaEm || o.socorroEm) {
        if (!o.terminoSocorro) o.terminoSocorro = horaHM(o.socorroEm || o.finalizadaEm);
        var fim = montarFim(o.terminoData, o.terminoSocorro, o.inicioEm, o.socorroEm || o.finalizadaEm);
        if (!fim) throw new Error("Data ou hora de término inválida.");
        if (o.socorroEm) {
          if (o.finalizadaEm && Date.parse(fim) > Date.parse(o.finalizadaEm)) throw new Error("O SOS deve terminar antes da finalização.");
          o.socorroEm = fim;
        } else o.finalizadaEm = fim;
        o.terminoData = ymdLocal(fim);
      }
      if (o.finalizadaEm || o.socorroEm) o.duracaoMs = duracaoMs(o);
      evento(o, "Ocorrência editada" + (o.status === "finalizada" ? " (após finalização)" : ""), "edicao");
      Object.assign(anterior, o); save(); return anterior;
    },
    mudarStatus: function (id, status, mensagem) {
      var o = this.obter(id); if (!o || !Object.prototype.hasOwnProperty.call(STATUS, status)) return null;
      if (status === "finalizada") return this.finalizar(id, mensagem);
      if (o.finalizadaEm || (o.socorroEm && status !== "aguardando")) retomar(o);
      o.status = status; evento(o, mensagem || "Status: " + STATUS[status].label); save(); return o;
    },
    addEvento: function (id, mensagem, tipo) {
      var o = this.obter(id); if (!o || !mensagem) return null;
      evento(o, texto(mensagem), tipo || "medida"); save(); return o;
    },
    finalizarSOS: function (id, mensagem) {
      var o = this.obter(id); if (!o || o.status === "finalizada") return o;
      if (!o.socorroEm) {
        o.socorroEm = nowISO(); o.terminoSocorro = horaHM(o.socorroEm); o.terminoData = ymdLocal(o.socorroEm); o.duracaoMs = duracaoMs(o);
        evento(o, mensagem || "S.O.S. passageiros concluído — tempo principal pausado", "sos");
      }
      o.status = "aguardando"; save(); return o;
    },
    finalizar: function (id, mensagem) {
      var o = this.obter(id); if (!o || o.status === "finalizada") return o;
      o.status = "finalizada"; o.finalizadaEm = nowISO();
      if (!o.socorroEm) { o.terminoSocorro = horaHM(o.finalizadaEm); o.terminoData = ymdLocal(o.finalizadaEm); }
      o.duracaoMs = duracaoMs(o); evento(o, mensagem || "Ocorrência finalizada", "finalizacao"); save(); return o;
    },
    reabrir: function (id) {
      var o = this.obter(id); if (!o || o.status !== "finalizada") return o;
      retomar(o); o.status = "em_atendimento"; evento(o, "Ocorrência reaberta — tempo retomado"); save(); return o;
    },
    remover: function (id) { db.ocorrencias = db.ocorrencias.filter(function (o) { return o.id !== id; }); save(); },
    duracaoMs: duracaoMs, duracaoSecundariaMs: duracaoSecundariaMs, nivelUrgencia: nivelUrgencia,
    frota: function () { return clone(db.cadastros.frota); },
    regionais: function () { return clone(db.cadastros.regionais); },
    gerentes: function () { return clone(db.cadastros.gerentes); },
    localidades: function () { return clone(db.cadastros.localidades); },
    pontosApoio: function () { return clone(db.cadastros.pontosApoio); },
    linhas: function () { return clone(db.cadastros.linhas); },
    buscarVeiculo: buscarVeiculo,
    salvarLocalidades: function (arr) { if (!Array.isArray(arr)) throw new Error("Localidades inválidas."); db.cadastros.localidades = clone(arr); save(); },
    salvarLinhas: function (arr) { if (!Array.isArray(arr)) throw new Error("Linhas inválidas."); db.cadastros.linhas = arr.map(texto); save(); },
    salvarPontosApoio: function (arr) { if (!Array.isArray(arr)) throw new Error("Pontos inválidos."); db.cadastros.pontosApoio = clone(arr); save(); },
    salvarFrota: function (arr) { if (!Array.isArray(arr) || !arr.length) throw new Error("Frota inválida."); db.cadastros.frota = clone(arr); save(); },
    salvarGerente: function (g) {
      if (!g || !g.nome) return;
      var item = { nome: texto(g.nome), telefone: texto(g.telefone) };
      var i = db.cadastros.gerentes.findIndex(function (x) { return x.nome === item.nome; });
      if (i < 0) db.cadastros.gerentes.push(item); else db.cadastros.gerentes[i] = item;
      save();
    },
    removerGerente: function (nome) { db.cadastros.gerentes = db.cadastros.gerentes.filter(function (g) { return g.nome !== nome; }); save(); },
    exportarTudo: function () { return JSON.stringify({ demonstracao: true, exportadoEm: nowISO(), dados: db }, null, 2); },
    importarTudo: function (json) {
      var parsed = typeof json === "string" ? JSON.parse(json) : json;
      var novo = validarDados(parsed && parsed.dados ? parsed.dados : parsed);
      db = novo; save();
    },
    importarOcorrencias: function (lista, substituir) {
      if (!Array.isArray(lista)) throw new Error("Lista inválida.");
      var novo = clone(db), itens = clone(lista);
      itens.forEach(function (o) { if (!o.id) o.id = uid(); });
      novo.ocorrencias = substituir ? itens : novo.ocorrencias.concat(itens);
      db = validarDados(novo); save();
    },
    onChange: function () {},
    resetTudo: function () { db = defaults(); save(); },
    _raw: function () { return clone(db); }
  };
  load();
  window.Store = Store;
  window.LocalStore = Store;
  window.MODO = "local";
})();
