(function () {
  "use strict";
  document.addEventListener("DOMContentLoaded", function () {
    var notice = document.querySelector("#demoNotice");
    document.querySelector("#demoReset").addEventListener("click", function () {
      if (!confirm("Restaurar os cenários fictícios? As alterações desta demonstração serão substituídas.")) return;
      window.Store.resetTudo();
      location.reload();
    });
    document.querySelector("#demoExemplo").addEventListener("click", function () {
      document.querySelector('[data-view="nova"]').click();
      var form = document.querySelector("#form-ocorrencia");
      form.reset();
      // O reset do formulário limpa o modo de edição no próximo ciclo.
      setTimeout(function () {
      var d = new Date(Date.now() - 5 * 60000);
      var pad = function (n) { return String(n).padStart(2, "0"); };
      var dia = d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
      var dados = { carro: "91002.A", carroSegue: "", servico: "70000999", dataOcorrencia: dia, horaQuebra: pad(d.getHours()) + ":" + pad(d.getMinutes()), motorista: "Condutor de Teste", matricula: "DEMO-99", linha: "SOL x LUA", localSocorro: "Via de Demonstração, marco 42", dataViagem: dia, horarioViagem: "08:00", qtdClientes: "28", defeitoMotorista: "Falha simulada no sistema de partida", responsavelManutencao: "Equipe técnica demo", gerenteRegional: "Apoio Via Aurora", coordenador: "Coordenação Demo", obs: "Exemplo fictício para testar uma nova abertura." };
      Object.keys(dados).forEach(function (k) { form.elements[k].value = dados[k]; });
      form.elements.carro.dispatchEvent(new Event("input", { bubbles: true }));
      notice.textContent = "Exemplo preenchido. Revise os dados e clique em Abrir ocorrência para acompanhar o atendimento.";
      document.querySelector("#view-nova").scrollIntoView({ block: "start" });
      form.elements.carro.focus({ preventScroll: true });
      }, 0);
    });
    document.querySelector("#form-ocorrencia").addEventListener("submit", function () {
      if (document.querySelector("#view-painel").classList.contains("active")) notice.textContent = "Registro salvo na demonstração. Abra os detalhes para acompanhar a linha do tempo.";
    });
    // Associa rótulos existentes aos controles sem mudar a estrutura dos formulários.
    document.querySelectorAll(".form-card label").forEach(function (label, i) {
      var field = label.nextElementSibling;
      if (field && field.matches("input,select,textarea")) {
        if (!field.id) field.id = "demo-field-" + i;
        label.htmlFor = field.id;
      }
    });
    document.querySelectorAll(".toolbar input:not([type=checkbox]):not([type=file]), .toolbar select").forEach(function (field) {
      if (!field.getAttribute("aria-label")) field.setAttribute("aria-label", field.placeholder || field.title || "Filtrar registros");
    });
    var overlay = document.querySelector("#overlay");
    var lastFocus;
    new MutationObserver(function () {
      if (overlay.classList.contains("open")) {
        if (!overlay.contains(document.activeElement)) lastFocus = document.activeElement;
        overlay.querySelector(".modal").focus({ preventScroll: true });
      } else if (lastFocus && lastFocus.isConnected) lastFocus.focus({ preventScroll: true });
    }).observe(overlay, { attributes: true, attributeFilter: ["class"] });
    document.addEventListener("keydown", function (e) {
      if (!overlay.classList.contains("open")) return;
      if (e.key === "Escape") document.querySelector("#m-fechar").click();
      if (e.key !== "Tab") return;
      var items = Array.from(overlay.querySelectorAll("button,input,select,textarea,[tabindex='0']")).filter(function (el) { return !el.disabled && el.getClientRects().length; });
      var first = items[0], last = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === overlay.querySelector(".modal"))) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  });
})();
