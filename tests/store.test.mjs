import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const STORAGE_KEY = 'rotaDemo.ocorrencias.v1';
const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;
const seedSource = await readFile(new URL('../assets/data.seed.js', import.meta.url), 'utf8');
const storeSource = await readFile(new URL('../assets/store.js', import.meta.url), 'utf8');
const localTime = (day, hour, minute = 0) => new Date(2026, 9, day, hour, minute).getTime();
const plain = value => JSON.parse(JSON.stringify(value));

function browser({ now = localTime(17, 10), stored = [] } = {}) {
  let clock = now;
  const storage = new Map(stored);
  const reads = [];
  const writes = [];
  class ClockDate extends Date {
    constructor(...args) { super(...(args.length ? args : [clock])); }
    static now() { return clock; }
  }
  const context = {
    Date: ClockDate,
    localStorage: {
      getItem(key) { reads.push(key); return storage.get(key) ?? null; },
      setItem(key, value) { writes.push(key); storage.set(key, String(value)); },
      removeItem(key) { storage.delete(key); }
    },
    console: { log() {}, warn() {}, error() {} }
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(seedSource, context, { filename: 'data.seed.js' });
  vm.runInContext(storeSource, context, { filename: 'store.js' });
  return {
    store: context.Store, storage, reads, writes,
    advance(ms) { clock += ms; },
    now() { return clock; }
  };
}

function dados(store) {
  return JSON.parse(store.exportarTudo()).dados;
}

function criarAsNove(store, extra = {}) {
  return store.criar({
    carro: store.frota()[0].veiculo,
    dataOcorrencia: '2026-10-17', horaQuebra: '09:00',
    motorista: 'Condutor de teste', ...extra
  });
}

test('a demonstração inicia com cadastros fictícios e cenários ativos e finalizados', () => {
  const { store } = browser();
  assert.equal(store.frota().length, 24);
  assert.equal(store.localidades().length, 8);
  assert.equal(store.pontosApoio().length, 8);
  assert.equal(store.gerentes().length, 5);
  assert.equal(store.linhas().length, 6);
  assert.equal(store.listarAtivas().length, 4);
  assert.equal(store.listarFinalizadas().length, 12);
  assert.equal(store.listarTodas().length, 16);
  assert.equal(new Set(store.frota().map(v => v.veiculo)).size, 24);
  assert.equal(new Set(store.frota().map(v => v.placa)).size, 24);
  assert.ok(store.frota().every(v => /\.(A|B|G|D)$/.test(v.veiculo) && /^DEMO-\d{4}$/.test(v.placa)));
  assert.ok(store.localidades().every(l => l.nome.startsWith('Estação ')));
  assert.ok(store.gerentes().every(g => !g.telefone));
  assert.ok(store.pontosApoio().every(p => !p.latitude && !p.longitude && !p.lat && !p.lng));
});

test('o armazenamento consulta e grava somente a chave exclusiva, preservando outros dados', () => {
  const legacy = '{"informacao":"não pertence à demonstração"}';
  const runtime = browser({ stored: [['outro-projeto.ocorrencias', legacy]] });
  criarAsNove(runtime.store);
  runtime.store.resetTudo();
  assert.deepEqual([...new Set(runtime.reads)], [STORAGE_KEY]);
  assert.deepEqual([...new Set(runtime.writes)], [STORAGE_KEY]);
  assert.equal(runtime.storage.get('outro-projeto.ocorrencias'), legacy);
  assert.equal(runtime.store.listarAtivas().length, 4);
});

test('criar uma ocorrência preenche os dados do veículo e conta desde a quebra informada', () => {
  const runtime = browser();
  const { store } = runtime;
  const vehicle = store.frota()[0];
  const occurrence = criarAsNove(store, { carro: `  ${vehicle.veiculo.toLowerCase()}  ` });
  assert.equal(occurrence.status, 'aberta');
  assert.equal(Date.parse(occurrence.abertaEm), runtime.now());
  assert.equal(Date.parse(occurrence.inicioEm), localTime(17, 9));
  for (const field of ['placa', 'modelo', 'capacidade', 'regional']) {
    assert.equal(String(occurrence[field]), String(vehicle[field]));
  }
  assert.equal(store.duracaoMs(occurrence), 60 * MINUTE);
  runtime.advance(7 * MINUTE);
  assert.equal(store.duracaoMs(occurrence), 67 * MINUTE);
  assert.equal(store.duracaoSecundariaMs(occurrence), 67 * MINUTE);
  assert.ok(occurrence.eventos.some(e => e.tipo === 'abertura'));

  const replacement = store.frota()[7];
  store.atualizar(occurrence.id, { carro: replacement.veiculo });
  assert.equal(occurrence.placa, replacement.placa);
  assert.equal(occurrence.regional, replacement.regional);
  store.atualizar(occurrence.id, { carro: 'VEICULO-INEXISTENTE' });
  assert.equal(occurrence.placa, '');
  assert.equal(occurrence.modelo, '');
});

test('concluir SOS pausa o relógio principal e mantém o mecânico; retomar desconta a espera', () => {
  const runtime = browser();
  const { store } = runtime;
  const occurrence = criarAsNove(store);
  const beginning = occurrence.inicioEm;
  runtime.advance(15 * MINUTE);
  store.finalizarSOS(occurrence.id);
  assert.equal(occurrence.status, 'aguardando');
  assert.equal(store.duracaoMs(occurrence), 75 * MINUTE);
  runtime.advance(30 * MINUTE);
  assert.equal(store.duracaoMs(occurrence), 75 * MINUTE);
  assert.equal(store.duracaoSecundariaMs(occurrence), 105 * MINUTE);

  store.mudarStatus(occurrence.id, 'em_atendimento');
  runtime.advance(15 * MINUTE);
  assert.equal(occurrence.inicioEm, beginning);
  assert.equal(store.duracaoMs(occurrence), 90 * MINUTE);
  assert.equal(store.duracaoSecundariaMs(occurrence), 120 * MINUTE);
});

test('finalizar congela os dois relógios e reabrir retoma sem contar o período encerrado', () => {
  const runtime = browser();
  const { store } = runtime;
  const occurrence = criarAsNove(store);
  const beginning = occurrence.inicioEm;
  store.addEvento(occurrence.id, 'Acompanhamento de teste');
  store.finalizar(occurrence.id);
  assert.equal(store.listarAtivas().some(o => o.id === occurrence.id), false);
  assert.equal(store.listarFinalizadas().some(o => o.id === occurrence.id), true);
  runtime.advance(30 * MINUTE);
  assert.equal(store.duracaoMs(occurrence), 60 * MINUTE);
  assert.equal(store.duracaoSecundariaMs(occurrence), 60 * MINUTE);

  store.reabrir(occurrence.id);
  assert.equal(occurrence.status, 'em_atendimento');
  assert.equal(occurrence.finalizadaEm, null);
  assert.equal(occurrence.inicioEm, beginning);
  assert.equal(occurrence.terminoSocorro, '');
  assert.equal(occurrence.terminoData, '');
  assert.ok(occurrence.eventos.some(e => e.texto === 'Acompanhamento de teste'));
  runtime.advance(15 * MINUTE);
  assert.equal(store.duracaoMs(occurrence), 75 * MINUTE);
  assert.equal(store.duracaoSecundariaMs(occurrence), 75 * MINUTE);
});

test('reabrir após SOS e finalização preserva os tempos distintos de passageiros e mecânica', () => {
  const runtime = browser();
  const { store } = runtime;
  const occurrence = criarAsNove(store);
  store.finalizarSOS(occurrence.id);
  runtime.advance(20 * MINUTE);
  store.finalizar(occurrence.id);
  runtime.advance(40 * MINUTE);
  assert.equal(store.duracaoMs(occurrence), 60 * MINUTE);
  assert.equal(store.duracaoSecundariaMs(occurrence), 80 * MINUTE);
  store.reabrir(occurrence.id);
  runtime.advance(10 * MINUTE);
  assert.equal(store.duracaoMs(occurrence), 70 * MINUTE);
  assert.equal(store.duracaoSecundariaMs(occurrence), 90 * MINUTE);
});

test('editar término após meia-noite aceita dia seguinte e rejeita término anterior sem edição parcial', () => {
  const { store } = browser({ now: localTime(18, 0, 40) });
  const occurrence = store.criar({ dataOcorrencia: '2026-10-17', horaQuebra: '23:30' });
  store.finalizar(occurrence.id);
  store.atualizar(occurrence.id, { terminoData: '', terminoSocorro: '00:15' });
  assert.equal(Date.parse(occurrence.finalizadaEm), localTime(18, 0, 15));
  assert.equal(occurrence.terminoData, '2026-10-18');
  assert.equal(store.duracaoMs(occurrence), 45 * MINUTE);
  assert.equal(store.duracaoSecundariaMs(occurrence), 45 * MINUTE);

  store.atualizar(occurrence.id, { terminoData: '2026-10-18', terminoSocorro: '00:25' });
  assert.equal(store.duracaoMs(occurrence), 55 * MINUTE);
  const before = plain(occurrence);
  assert.throws(() => store.atualizar(occurrence.id, {
    obs: 'esta alteração também deve ser rejeitada',
    terminoData: '2026-10-17', terminoSocorro: '22:00'
  }), /término|quebra/i);
  assert.deepEqual(plain(store.obter(occurrence.id)), before);
});

test('editar o término do SOS conserva a conclusão mecânica e rejeita SOS posterior a ela', () => {
  const runtime = browser({ now: localTime(18, 0, 45) });
  const { store } = runtime;
  const occurrence = store.criar({ dataOcorrencia: '2026-10-17', horaQuebra: '23:30' });
  store.finalizarSOS(occurrence.id);
  runtime.advance(30 * MINUTE);
  store.finalizar(occurrence.id);
  const mechanicalEnd = occurrence.finalizadaEm;
  store.atualizar(occurrence.id, { terminoData: '2026-10-18', terminoSocorro: '00:20' });
  assert.equal(occurrence.finalizadaEm, mechanicalEnd);
  assert.equal(store.duracaoMs(occurrence), 50 * MINUTE);
  assert.equal(store.duracaoSecundariaMs(occurrence), 105 * MINUTE);
  const before = plain(occurrence);
  assert.throws(() => store.atualizar(occurrence.id, {
    terminoData: '2026-10-18', terminoSocorro: '01:30'
  }), /SOS|finalização/i);
  assert.deepEqual(plain(store.obter(occurrence.id)), before);
});

test('backup exportado preserva cadastros, estados, eventos e tempos após importar e recarregar', () => {
  const source = browser();
  const occurrence = criarAsNove(source.store);
  source.store.addEvento(occurrence.id, 'Nota fictícia que deve persistir', 'medida');
  source.advance(12 * MINUTE);
  source.store.finalizarSOS(occurrence.id);
  source.advance(8 * MINUTE);
  source.store.finalizar(occurrence.id);
  const backup = source.store.exportarTudo();
  const expected = dados(source.store);
  const target = browser({ now: source.now() });
  target.store.importarTudo(backup);
  assert.deepEqual(dados(target.store), expected);
  assert.equal(target.store.duracaoMs(target.store.obter(occurrence.id)), 72 * MINUTE);
  assert.equal(target.store.duracaoSecundariaMs(target.store.obter(occurrence.id)), 80 * MINUTE);

  const reloaded = browser({ now: source.now(), stored: [...target.storage] });
  assert.deepEqual(dados(reloaded.store), expected);
  assert.deepEqual([...new Set(reloaded.reads)], [STORAGE_KEY]);
});

test('backups malformados, com IDs inválidos ou duplicados são rejeitados sem substituir a base', () => {
  const { store } = browser();
  const original = dados(store);
  const duplicate = structuredClone(original);
  duplicate.ocorrencias[1].id = duplicate.ocorrencias[0].id;
  const invalidId = structuredClone(original);
  invalidId.ocorrencias[0].id = '../registro-invalido';
  const invalidDate = structuredClone(original);
  invalidDate.ocorrencias[0].abertaEm = 'não é uma data';
  const missingCatalog = structuredClone(original);
  delete missingCatalog.cadastros.frota;
  for (const invalid of ['{JSON incompleto', {}, duplicate, invalidId, invalidDate, missingCatalog]) {
    assert.throws(() => store.importarTudo(invalid));
    assert.deepEqual(dados(store), original);
  }
});

test('importação de ocorrências suporta acrescentar e substituir com validação antes de gravar', () => {
  const { store } = browser();
  const imported = plain(store.listarTodas()[0]);
  imported.id = 'registro-importado';
  imported.obs = 'Registro inteiramente fictício importado';
  store.importarOcorrencias([imported], false);
  assert.equal(store.listarTodas().length, 17);
  assert.equal(store.obter(imported.id).obs, imported.obs);
  const before = dados(store);
  assert.throws(() => store.importarOcorrencias([imported], false), /ID/i);
  assert.deepEqual(dados(store), before);
  store.importarOcorrencias([imported], true);
  assert.equal(store.listarTodas().length, 1);
  assert.equal(store.obter(imported.id).obs, imported.obs);
});

test('restaurar apaga alterações locais e recria as datas do cenário em relação ao relógio atual', () => {
  const runtime = browser();
  const { store } = runtime;
  const originalOpening = Date.parse(store.listarAtivas().find(o => o.status === 'aberta').abertaEm);
  criarAsNove(store);
  store.salvarLinhas(['LINHA DE TESTE']);
  runtime.advance(30 * DAY);
  store.resetTudo();
  assert.equal(store.listarAtivas().length, 4);
  assert.equal(store.listarFinalizadas().length, 12);
  assert.equal(store.listarTodas().length, 16);
  assert.equal(store.linhas().length, 6);
  assert.equal(store.linhas().includes('LINHA DE TESTE'), false);
  const restored = store.listarAtivas().find(o => o.status === 'aberta');
  assert.equal(Date.parse(restored.abertaEm) - originalOpening, 30 * DAY);
  assert.equal(store.duracaoMs(restored), 18 * MINUTE);
  assert.ok(store.listarFinalizadas().every(o => Date.parse(o.finalizadaEm) < runtime.now()));
  assert.equal(Date.parse(dados(store).meta.criadoEm), runtime.now());
});
