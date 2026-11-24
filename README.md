# Guia Termux ☸️

Curso de Termux em português, do zero ao avançado, em **3 níveis + projetos + referência**.

Cada aula explica o conceito e deixa você pratiquer no **termux simulado** (`.try`) — máquina `ana@android` com celular Pixel 7 Pro com Android 14 e adb rootado.

Site 100% estático (HTML + CSS + JS, sem build): abre direto no navegador e funciona no GitHub Pages.

## Estrutura

```
index.html                 página inicial
<tema>.html                uma aula por tema
assets/style.css           visual (tema claro/escuro, cor verde Android)
assets/site.js             níveis/menu (NIVEIS), Anterior/Próximo, quiz
assets/termuxsim.js       simulador de terminal Termux no Android
CONTRIBUINDO.md            como escrever uma aula
```

## O que o simulador sabe

`pkg update|install|search|list-installed`, `termux-setup-storage`, `termux-battery-status|toast|notification|sms-list|location|contact-list|camera-photo|torch|vibrate|wake-lock`, `termux-job-scheduler`, `crontab -l`, `sshd`, `passwd`, `ssh-keygen`, `adb devices|root|shell|logcat`, `proot-distro list|login`, `python -m http.server`, `sqlite3`, `ngrok http`, `ping`, `ifconfig`, `nmap`, `rsync`; shell: `ls, cat, pwd, whoami, uname, clear, echo, help, exit, history`.
Erros reais: `Error from server (NotFound)`, `unknown command`, `No resources found`.

## Limitações

- Estado fictício em memória (não persiste entre páginas; Reiniciar restaura).
- Não executa containers de verdade.

## Publicar no GitHub Pages

Envie a pasta para um repositório e ative **Settings → Pages → Deploy from a branch → main / (root)**.
