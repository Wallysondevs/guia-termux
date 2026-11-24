# Como contribuir com o Guia Termux

## Adicionar uma aula

1. Crie `<tema>.html` na raiz copiando a estrutura de uma aula existente (head com tema + script inline de scroll, `<nav class="sidebar">`, `<div class="pager"></div>`, conteúdo, `<script src="assets/site.js?v=1">`).
2. Adicione a página no `NIVEIS` em `assets/site.js`.
3. Missão no Termux simulado:

```html
<div class="try" data-goal="TEXTO NA SAÍDA" data-solucao="pkg …">
<p class="try-task"><strong>Missão:</strong> …</p>
</div>
```

O simulador (`assets/termuxsim.js`) imprime saídas estilo Termux (JSON do `termux-battery-status`), confirmações com `✓` (`sshd rodando`, `adb root` → `already running as root`, `termux-camera-photo` → `Foto salva`) e erros (`ls: cannot access … Permission denied`). Confira no termuxsim.js a saída exata antes do `data-goal` (ex.: `pkg install python` imprime `python instalado ✓`; `adb devices` imprime `Dispositivo rootado detectado ✓`).

## Padrão de escrita

- Toda aula começa com `<p class="intro">` e `<div class="note">` "Você vai aprender".
- YAML em `<pre class="file" data-file="deploy.yaml">`, sessão em `<pre class="term">$ pkg …</pre>`.
- Erros em `<div class="warn">`; anatomia em `<dl class="anatomy">`; tabelas em `table.ref`; termine com `div.tip` da próxima aula.

## Testar local

`python3 -m http.server` na pasta e abra `index.html`.
