/* =====================================================================
   Guia Termux — simulador de terminal Termux (termuxsim.js)
   ---------------------------------------------------------------------
   Terminal fictício ana@android num celular Android com Termux.
   Comandos: pkg/apt, termux-setup-storage, termux-* (api), sshd,
   adb (com dispositivo rootado), proot-distro, termux-job-scheduler,
   crontab, python http.server, sqlite3, ngrok, meta do shell.
   ===================================================================== */
(function () {
  "use strict";

  var USER = "ana", HOST = "android";

  function estadoInicial() {
    return {
      storageConfigurado: false,
      sshdRodando: false,
      wakeLock: false,
      lanterna: false,
      rootAdb: true,
      arquivos: {
        "backup.sh": "#!/data/data/com.termux/files/usr/bin/bash\necho \"backup iniciado\"\ntar -czf ~/backup.tar.gz ~/storage/shared/DCIM\necho \"backup concluido\"\n",
        " notas.txt": "placeholder"
      },
      home: ["backup.sh", "storage", ".bashrc", ".termux", "projetos"],
      jobs: [],
      crontab: ["# crontab do Termux (ana@android)", "*/30 * * * * ~/backup.sh >> ~/backup.log 2>&1"],
      pods: null
    };
  }

  var estado = estadoInicial();

  /* ---------- utilidades ---------- */
  function pad(s, n) { s = String(s); while (s.length < n) s += " "; return s; }
  function tabelaSaida(colunas, linhas) {
    var larguras = colunas.map(function (c) { return c.length; });
    linhas.forEach(function (l) { l.forEach(function (v, i) { larguras[i] = Math.max(larguras[i], String(v).length); }); });
    function borda() { return "+" + larguras.map(function (w) { return Array(w + 2).join("-"); }).join("+") + "+"; }
    var out = borda() + "\n";
    out += "|" + colunas.map(function (c, i) { return " " + pad(c, larguras[i]) + " "; }).join("|") + "|\n";
    out += borda() + "\n";
    linhas.forEach(function (l) {
      out += "|" + l.map(function (v, i) { return " " + pad(v === null || v === undefined ? "" : v, larguras[i]) + " "; }).join("|") + "|\n";
    });
    out += borda();
    return out;
  }

  var PACOTES = {
    python: "3.11.9-2", nodejs: "20.11.1", openssh: "9.6p1", vim: "9.1.0", nano: "7.2",
    sqlite: "3.45.1", curl: "8.6.0", git: "2.44.0", nmap: "7.94", proot: "5.3.0",
    "termux-api": "0.50.1", postgresql: "16.2", nginx: "1.25.4", "ngrok": "3.12.1",
    htop: "3.3.0", tmux: "3.4", rsync: "3.2.7", tigervnc: "1.13.1", "aircrack-ng": "1.7"
  };

  function executar(linha) {
    linha = linha.trim();
    if (!linha) return "";
    var partes = linha.split(/\s+/);
    var cmd = partes[0];
    var args = partes.slice(1);
    var j = function (a) { return args.indexOf(a); };

    /* ---------- pkg / apt ---------- */
    if (cmd === "pkg" || cmd === "apt") {
      var sub = (args[0] || "").toLowerCase();
      var resto = args.slice(1);
      if (sub === "update") return "Get:1 https://packages.termux.dev/apt/termux-main stable InRelease\nReading package lists... Done\nBuilding dependency tree... Done";
      if (sub === "upgrade") return "Reading package lists... Done\n0 packages upgraded, 0 newly installed.";
      if (sub === "install") {
        var nome = resto.filter(function (a) { return a[0] !== "-"; })[0] || "";
        if (!nome) return "pkg install: falta o nome do pacote (ex.: pkg install python)";
        if (!PACOTES[nome]) return "Unable to locate package " + nome;
        return "The following NEW packages will be installed:\n  " + nome + "\n0 upgraded, 1 newly installed, 0 to remove.\nSetting up " + nome + " (" + PACOTES[nome] + ") ...\n" + nome + " instalado ✓";
      }
      if (sub === "search") {
        var termo = resto[0] || "";
        var achados = Object.keys(PACOTES).filter(function (p) { return p.indexOf(termo) !== -1; });
        return achados.length ? achados.map(function (p) { return p + "/stable " + PACOTES[p] + " " + p; }).join("\n") : "No matches found for " + termo;
      }
      if (sub === "list-installed") {
        var instalados = Object.keys(PACOTES).slice(0, 8);
        return instalados.map(function (p) { return p + "/stable " + PACOTES[p] + " [installed]"; }).join("\n");
      }
      if (sub === "show") {
        var p = resto[0] || "";
        if (!PACOTES[p]) return "Unable to locate package " + p;
        return "Package: " + p + "\nVersion: " + PACOTES[p] + "\nMaintainer: Termux\nDescription: pacote do repositório Termux (simulado)";
      }
      if (sub === "uninstall" || sub === "remove") {
        var r = resto.filter(function (a) { return a[0] !== "-"; })[0] || "";
        return r ? "Removing " + r + " ...\n" + r + " removido." : "falta o nome do pacote";
      }
      return "pkg: update | upgrade | install | search | list-installed | show | uninstall";
    }

    /* ---------- termux-setup-storage ---------- */
    if (cmd === "termux-setup-storage") {
      estado.storageConfigurado = true;
      return "Setting up storage access...\nLinks criados em ~/storage:\n  dcim -> /storage/emulated/0/DCIM\n  downloads -> /storage/emulated/0/Download\n  pictures -> /storage/emulated/0/Pictures\n  music -> /storage/emulated/0/Music\n  movies -> /storage/emulated/0/Movies\n  shared -> /storage/emulated/0\nStorage configurado ✓ (aceite a permissão no Android)";
    }

    /* ---------- termux-api ---------- */
    if (cmd === "termux-battery-status")
      return '{\n  "level": 87,\n  "status": "Charging",\n  "temperature": 31.5,\n  "plugged": "AC",\n  "health": "Good"\n}';
    if (cmd === "termux-toast") return "Toast enviado: " + (args.join(" ") || "olá do Termux") + " ✓";
    if (cmd === "termux-notification") {
      var t = args.join(" ").replace(/--title\s+\S+/, "").trim();
      return "Notificação enviada (simulada): " + (t || "Título") + " ✓";
    }
    if (cmd === "termux-sms-list") {
      return "[{\"number\":\"+5511999887766\",\"body\":\"Seu código é 123456\"},{\"number\":\"+5511912345678\",\"body\":\"Entrega confirmada\"}]";
    }
    if (cmd === "termux-location")
      return '{\n  "latitude": -23.5505,\n  "longitude": -46.6333,\n  "altitude": 760.0,\n  "provider": "gps"\n}';
    if (cmd === "termux-contact-list")
      return "[{\"name\":\"Mãe\",\"number\":\"+5511999887766\"},{\"name\":\"Max\",\"number\":\"+5511912345678\"}]";
    if (cmd === "termux-camera-photo") {
      var dest = args[args.length - 1] || "foto.jpg";
      return "Foto salva em /data/data/com.termux/files/home/" + dest.replace(/^~\//, "") + " ✓ (312 KB)";
    }
    if (cmd === "termux-torch") {
      var on = args[0] !== "off";
      estado.lanterna = on;
      return on ? "Lanterna ligada ✓" : "Lanterna desligada ✓";
    }
    if (cmd === "termux-vibrate") return "Celular vibrou ✓";
    if (cmd === "termux-wake-lock") {
      estado.wakeLock = true;
      return "Wake lock adquirido ✓ (a tela não apaga enquanto segurar)";
    }
    if (cmd === "termux-wake-unlock") {
      estado.wakeLock = false;
      return "Wake lock liberado.";
    }
    if (cmd === "termux-info")
      return "TERMUX_VERSION=0.118.0\nANDROID_VERSION=14\nCPU: Snapdragon 8 Gen 2\nRAM total: 8 GB\nStorage: 128 GB\nShell: /data/data/com.termux/files/usr/bin/bash\nDevice: Pixel 7 Pro (rooted)";

    /* ---------- termux-job-scheduler / cron ---------- */
    if (cmd === "termux-job-scheduler") {
      var script = args[j("--script")] !== -1 ? args[j("--script") + 1] : "script.sh";
      var periodo = args[j("--period")] !== -1 ? args[j("--period") + 1] : "3600000";
      estado.jobs.push({ script: script, periodo: periodo });
      return "Job agendado (id " + estado.jobs.length + "): " + script + " a cada " + periodo + " ms ✓";
    }
    if (cmd === "crontab") {
      if (args[0] === "-l") return estado.crontab.join("\n");
      if (args[0] === "-e") return "(simulado) editor aberto — não faça isso no celular real sem saber 😄";
      return "uso: crontab -l | crontab -e";
    }

    /* ---------- ssh ---------- */
    if (cmd === "passwd") return "New password: ••••••••\nBAD PASSWORD: too short\nNew password: ••••••••\nSenha alterada ✓ (simulado)";
    if (cmd === "sshd") {
      estado.sshdRodando = true;
      return "Iniciando sshd na porta 8022...\nsshd rodando ✓ — conecte do PC com:\n  ssh " + USER + "@192.168.1.42 -p 8022";
    }
    if (cmd === "ssh-keygen") return "Gerando par de chaves RSA 4096...\nYour identification has been saved in /data/data/com.termux/files/home/.ssh/id_rsa.\nFingerprint: SHA256:TermuxAna123";
    if (cmd === "ssh") return "uso: ssh usuario@host -p 8022 (simulado)";

    /* ---------- adb (celular rootado conectado) ---------- */
    if (cmd === "adb") {
      var s = (args[0] || "").toLowerCase();
      if (s === "devices") return "List of devices attached\nR5CT20ABCPIXEL\tdevice product:blueline model:Pixel_7_Pro device:blueline\n\nDispositivo rootado detectado ✓ (1 dispositivo)";
      if (s === "root") return estado.rootAdb ? "restarting adbd as root\nadbd is already running as root ✓" : "adbd cannot run as root in production builds";
      if (s === "shell") {
        var inner = args.slice(1).join(" ");
        if (/whoami/.test(inner)) return "root";
        if (/getprop ro.build.version.release/.test(inner)) return "14";
        if (/ls \/data/.test(inner)) return "(root) acesso total a /data ✓";
        return "(adb shell no Pixel 7 Pro rootado) saida de: " + (inner || "shell");
      }
      if (s === "logcat") return "--------- beginning of main\nI/ActivityManager: Displayed com.termux/.app.TermuxActivity\nD/adbd: root shell conectado";
      if (s === "install") return "Success ✓ (app instalado via adb)";
      return "adb: devices | root | shell | logcat | install";
    }

    /* ---------- proot-distro ---------- */
    if (cmd === "proot-distro") {
      var s = (args[0] || "").toLowerCase();
      if (s === "list") return "Instaladas:\n  ubuntu-24.04\nDisponíveis: debian, alpine, archlinux, fedora, void";
      if (s === "install") return "Installing " + (args[1] || "debian") + "...\nDownloading bootstrap... done.\n" + (args[1] || "debian") + " instalado ✓ — entre com: proot-distro login " + (args[1] || "debian");
      if (s === "login") return "Entrando no " + (args[1] || "ubuntu") + "...\nroot@localhost:~# (proot — sem root real, mas com apt completo)";
      if (s === "reset") return (args[1] || "ubuntu") + " resetado ✓";
      return "proot-distro: list | install | login | reset";
    }

    /* ---------- servidores e bancos ---------- */
    if (cmd === "python" && /http\.server/.test(args.join(" "))) {
      var porta = args[args.length - 1] || "8080";
      return "Serving HTTP on 0.0.0.0 port " + porta + " (http://192.168.1.42:" + porta + "/ ) ...\n(ctrl+c para parar)";
    }
    if (cmd === "python" && args[0] === "--version") return "Python 3.11.9";
    if (cmd === "node" && args[0] === "--version") return "v20.11.1";
    if (cmd === "sqlite3") {
      var q = args.slice(1).join(" ");
      if (args[0] === "--version") return "3.45.1 2024-01-15";
      if (/select 1/.test(q)) return "1";
      if (/\.tables/.test(q)) return "usuarios  produtos";
      return "(sqlite3 simulado) banco: " + (args[0] || ":memory:") + " — tente: sqlite3 meu.db \"select 1;\"";
    }
    if (cmd === "psql" || cmd === "postgres") return "PostgreSQL 16.2 no Termux ✓\npsql -U postgres -d meubanco (simulado)";
    if (cmd === "nginx") return "nginx version: nginx/1.25.4\nnginx -s stop (simulado)";
    if (cmd === "ngrok" || cmd === "cloudflared") {
      var p2 = args[args.length - 1] || "8080";
      return "Forwarding  https://termux-ana-7f3k.ngrok-free.app -> http://localhost:" + p2 + "\nTúnel aberto ✓ — seu site no celular está público na internet";
    }

    /* ---------- rede ---------- */
    if (cmd === "ping") return "PING " + (args[args.length - 1] || "8.8.8.8") + ": 56 data bytes\n64 bytes: icmp_seq=0 ttl=117 time=23.4 ms\n1 packets transmitted, 1 packets received, 0.0% packet loss ✓";
    if (cmd === "ifconfig" || cmd === "ip") {
      return "wlan0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>\n        inet 192.168.1.42  netmask 255.255.255.0\n        ether dc:a6:32:11:22:33\n\nlo: inet 127.0.0.1";
    }
    if (cmd === "nmap") return "Starting Nmap 7.94 (simulado)\nHost 192.168.1.42 is up.\nPORT     STATE SERVICE\n8022/tcp open  ssh\n8080/tcp open  http\nNmap done: 1 IP address scanned ✓";
    if (cmd === "rsync") return "sending incremental file list\nbackup.tar.gz\n1.204.800 bytes  100%  2.34MB/s\nSincronizado com o PC ✓";

    /* ---------- shell básico ---------- */
    switch (cmd) {
      case "whoami": return "u0_a231 (ana)";
      case "pwd": return "/data/data/com.termux/files/home";
      case "uname": return "Linux localhost 5.10.137-android14 #1 SMP PREEMPT\nAndroid 14 · aarch64";
      case "ls":
        if (args.join(" ").indexOf("storage") !== -1 && !estado.storageConfigurado)
          return "ls: cannot access '/data/data/com.termux/files/home/storage': Permission denied\n(dica: rode termux-setup-storage antes)";
        if (args.join(" ").indexOf("storage") !== -1)
          return "dcim  downloads  movies  music  pictures  shared";
        return estado.home.join("  ");
      case "cat": {
        var a = args[0] || "";
        if (estado.arquivos[a]) return estado.arquivos[a].replace(/\n$/, "");
        if (a === "backup.log") return "backup iniciado\nbackup concluido\nbackup iniciado\nbackup concluido";
        return "cat: " + a + ": No such file or directory";
      }
      case "clear": return "\x1b[2J\x1b[H";
      case "echo": return args.join(" ");
      case "date": return new Date().toString();
      case "vim": case "nano": return "(simulado) editor " + cmd + " aberto — :q para sair 😄";
      case "htop": case "top": return "CPU 12%  MEM 3.1/8 GB  SWAP 0\n  1 root  Termux\n  2 u0_a231  bash\n(press q)";
      case "help": return "Termux simulado (ana@android):\n  pkg update | pkg install python | pkg list-installed | pkg search vim\n  termux-setup-storage   ls ~/storage\n  termux-battery-status | termux-toast 'oi' | termux-notification --title oi\n  termux-sms-list | termux-location | termux-contact-list\n  termux-camera-photo ~/foto.jpg | termux-torch on | termux-vibrate\n  termux-wake-lock | termux-job-scheduler --script ~/backup.sh --period 300000 | crontab -l\n  passwd | sshd | ssh-keygen\n  adb devices | adb root | adb shell whoami\n  proot-distro list | proot-distro login ubuntu\n  python -m http.server 8080 | sqlite3 meu.db \"select 1;\" | ngrok http 8080\n  ping -c 1 8.8.8.8 | ifconfig | nmap localhost | rsync\n  shell: ls cat pwd whoami uname clear echo help exit history";
      case "exit": return "(simulador) sessão encerrada — clique em Reiniciar.";
      case "history": return "(simulador) histórico desta caixa";
      default: return cmd + ": command not found (simulado — tente 'help')";
    }
  }

  /* ---------- interface ---------- */
  function montarTerminal(container) {
    var historico = [], histIdx = -1;
    container.classList.add("docker-term");
    var output = document.createElement("div");
    output.className = "term-output";
    var inputLine = document.createElement("div");
    inputLine.className = "term-input-line";
    var prompt = document.createElement("span");
    prompt.className = "term-prompt";
    prompt.textContent = USER + "@" + HOST + ":~$ ";
    var input = document.createElement("input");
    input.className = "term-input";
    input.setAttribute("autocomplete", "off");
    input.setAttribute("spellcheck", "false");
    input.setAttribute("autocapitalize", "off");
    inputLine.appendChild(prompt);
    inputLine.appendChild(input);
    container.appendChild(output);
    container.appendChild(inputLine);

    var bv = document.createElement("div");
    bv.className = "term-line term-welcome";
    bv.textContent = "Termux simulado — ana@android (Pixel 7 Pro, Android 14, com adb rootado). Tente: pkg install python   ou   adb devices";
    output.appendChild(bv);

    function rolar() { output.scrollTop = output.scrollHeight; }
    function print(texto, classe) {
      var div = document.createElement("div");
      div.className = "term-line " + (classe || "");
      if (texto.indexOf("\x1b[2J") === 0) { output.innerHTML = ""; return; }
      div.textContent = texto;
      output.appendChild(div);
      rolar();
    }
    function rodarComando(linha) {
      print(USER + "@" + HOST + ":~$ " + linha, "term-cmd");
      historico.push(linha);
      histIdx = historico.length;
      var resultado = executar(linha);
      if (resultado) resultado.split("\n").forEach(function (l) {
        var classe = /^(Unable|ls:|cat:|error|command not found)/.test(l) ? "term-err"
          : (/✓|instalado|rodando|acesso|root$|serving|Serving|Forwarding|Wake lock|Lanterna|Foto salva|Notificação|Toast|Job agendado|Storage configurado|dispositivo|concluido|alterada|removido|scanned|Sincronizado|received/.test(l) ? "term-ok" : "term-out");
        print(l, classe);
      });
    }

    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { var v = input.value; input.value = ""; rodarComando(v); }
      else if (e.key === "ArrowUp") { e.preventDefault(); if (histIdx > 0) { histIdx--; input.value = historico[histIdx] || ""; } }
      else if (e.key === "ArrowDown") { e.preventDefault(); if (histIdx < historico.length - 1) { histIdx++; input.value = historico[histIdx]; } else { histIdx = historico.length; input.value = ""; } }
      else if (e.key === "l" && e.ctrlKey) { e.preventDefault(); output.innerHTML = ""; }
      else if (e.key === "c" && e.ctrlKey) { e.preventDefault(); print(USER + "@" + HOST + ":~$ ^C", "term-cmd"); input.value = ""; }
    });

    container.addEventListener("click", function () { input.focus({ preventScroll: true }); });
    setTimeout(function () { input.focus({ preventScroll: true }); }, 100);

    var goal = container.getAttribute("data-goal");
    var solucao = container.getAttribute("data-solucao");
    if (goal) {
      var check = setInterval(function () {
        if (output.textContent.indexOf(goal.replace(/^out:/, "")) !== -1) {
          clearInterval(check);
          var badge = document.createElement("div");
          badge.className = "term-missao-ok";
          badge.textContent = "✔ Missão cumprida!";
          container.appendChild(badge);
        }
      }, 500);
    }

    var toolbar = document.createElement("div");
    toolbar.className = "term-toolbar";
    var btnR = document.createElement("button");
    btnR.type = "button"; btnR.className = "term-btn"; btnR.textContent = "Reiniciar";
    btnR.addEventListener("click", function (e) {
      e.stopPropagation();
      estado = estadoInicial();
      output.innerHTML = "";
      var b2 = document.createElement("div");
      b2.className = "term-line term-welcome";
      b2.textContent = "Termux reiniciado. Tente pkg list-installed ou termux-battery-status";
      output.appendChild(b2);
      input.value = "";
      input.focus({ preventScroll: true });
    });
    toolbar.appendChild(btnR);
    if (solucao) {
      var btnS = document.createElement("button");
      btnS.type = "button"; btnS.className = "term-btn"; btnS.textContent = "Ver comando";
      btnS.addEventListener("click", function (e) { e.stopPropagation(); input.value = solucao; input.focus({ preventScroll: true }); });
      toolbar.appendChild(btnS);
    }
    container.insertBefore(toolbar, container.firstChild);
  }

  function init() { document.querySelectorAll(".try").forEach(montarTerminal); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
