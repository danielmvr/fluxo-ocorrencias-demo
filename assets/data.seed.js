/* Dados criados do zero para demonstração. Não derivados de registros operacionais. */
(function () {
  "use strict";
  var empresas = [
    { id: "ALFA", nome: "Via Aurora", sufixo: "A" },
    { id: "BETA", nome: "Horizonte", sufixo: "B" },
    { id: "GAMA", nome: "Via Campo", sufixo: "G" },
    { id: "DELTA", nome: "Expresso Lume", sufixo: "D" }
  ];
  var nomes = ["Solar", "Lunar", "Bosque", "Vale", "Lago", "Serra", "Jardim", "Portal"];
  var siglas = ["SOL", "LUA", "BOS", "VAL", "LAG", "SER", "JAR", "POR"];
  var linhas = ["SOL x LUA", "BOS x VAL", "LAG x SER", "JAR x POR", "SOL x BOS", "LUA x LAG"];
  var frota = [];
  empresas.forEach(function (empresa, ei) {
    for (var i = 0; i < 6; i++) {
      var n = ei * 6 + i + 1;
      frota.push({ veiculo: (i < 3 ? 91001 + ei * 100 + i : 8101 + ei * 100 + i) + "." + empresa.sufixo,
        placa: "DEMO-" + String(n).padStart(4, "0"), modelo: i < 3 ? "Modelo panorâmico fictício" : "Modelo convencional fictício",
        capacidade: i < 3 ? 60 : 44, regional: empresa.id, uf: "XX", ano: 2020 + (n % 5) });
    }
  });
  function pad(n) { return String(n).padStart(2, "0"); }
  function data(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function hora(d) { return pad(d.getHours()) + ":" + pad(d.getMinutes()); }
  function criarOcorrencias() {
    var agora = Date.now();
    var defeitos = ["Falha simulada no sistema de arrefecimento", "Alerta simulado de pressão dos pneus", "Falha simulada no circuito elétrico", "Verificação preventiva simulada"];
    var estados = ["aberta", "em_rota", "em_atendimento", "aguardando"];
    var tempos = [18, 47, 96, 205];
    var lista = [];
    for (var i = 0; i < 16; i++) {
      var ativa = i < 4;
      var inicio = new Date(agora - (ativa ? tempos[i] : (i - 3) * 24 * 60 + 130) * 60000);
      inicio.setSeconds(0, 0);
      var veiculo = frota[ativa ? i * 6 + (i === 1 ? 3 : 0) : (i * 5) % frota.length];
      var fim = ativa ? null : new Date(inicio.getTime() + (28 + (i * 19) % 150) * 60000);
      var sos = i === 3 ? new Date(agora - 70 * 60000) : (!ativa && i % 3 === 0 ? new Date(fim.getTime() - 18 * 60000) : null);
      var ponto = i % nomes.length;
      var o = {
        id: "demo-" + pad(i + 1), carro: veiculo.veiculo, carroSegue: i === 3 ? frota[19].veiculo : "",
        regional: veiculo.regional, placa: veiculo.placa, modelo: veiculo.modelo, capacidade: veiculo.capacidade,
        motorista: "Condutor Demo " + pad(i + 1), matricula: "DEMO-" + pad(i + 1),
        servico: String(70000001 + i), linha: linhas[i % linhas.length],
        localSocorro: "Via de Demonstração, marco " + (12 + i * 7) + " · Estação " + nomes[ponto],
        dataOcorrencia: data(inicio), horaQuebra: hora(inicio), dataViagem: data(inicio), horarioViagem: hora(new Date(inicio.getTime() - 60 * 60000)),
        qtdClientes: 16 + (i * 7) % 27, encomendas: i % 2 ? "Sim" : "Não", alimentacaoFornecida: i % 3 === 0 ? "Sim" : "Não",
        defeitoMotorista: defeitos[i % 4], responsavelManutencao: "Equipe técnica demo", gerenteRegional: "Apoio " + empresas[i % 4].nome,
        coordenador: "Coordenação Demo", saidaSocorro: i ? siglas[ponto] + " - " + hora(new Date(inicio.getTime() + 10 * 60000)) : "",
        obs: "Cenário inteiramente fictício, criado para explorar o fluxo de atendimento.",
        status: ativa ? estados[i] : "finalizada", abertaEm: inicio.toISOString(), inicioEm: inicio.toISOString(),
        finalizadaEm: fim ? fim.toISOString() : null, socorroEm: sos ? sos.toISOString() : null,
        terminoSocorro: sos ? hora(sos) : (fim ? hora(fim) : ""), terminoData: sos ? data(sos) : (fim ? data(fim) : ""),
        eventos: [{ ts: inicio.toISOString(), tipo: "abertura", texto: "Ocorrência de demonstração aberta" }]
      };
      if (i !== 0) o.eventos.push({ ts: new Date(inicio.getTime() + 9 * 60000).toISOString(), tipo: "medida", texto: "Equipe de apoio demo acionada; atendimento em acompanhamento." });
      if (sos) o.eventos.push({ ts: sos.toISOString(), tipo: "sos", texto: "S.O.S. de passageiros concluído. Acompanhamento mecânico continua." });
      if (fim) o.eventos.push({ ts: fim.toISOString(), tipo: "finalizacao", texto: "Atendimento de demonstração concluído." });
      lista.push(o);
    }
    return lista;
  }
  window.SEED = {
    cadastrosVersao: 1, fonteFrota: "Gerador sintético da demonstração", frota: frota,
    regionais: empresas.map(function (e) { return e.id; }),
    gerentes: empresas.map(function (e) { return { nome: "Apoio " + e.nome, telefone: "" }; }).concat([{ nome: "Equipe técnica demo", telefone: "" }]),
    localidades: nomes.map(function (nome, i) { return { sigla: siglas[i], nome: "Estação " + nome, uf: "XX" }; }),
    pontosApoio: nomes.map(function (nome, i) { return { nome: "Base Demo " + nome, sigla: siglas[i], tipo: i % 2 ? "Oficina fictícia" : "Apoio fictício", obs: "Local inventado, sem coordenadas geográficas." }; }),
    linhas: linhas, criarOcorrencias: criarOcorrencias
  };
})();
