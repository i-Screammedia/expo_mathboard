(function () {
  const TOC = [
    { page: 1, title: "이번 시간에 공부할 내용" },
    { page: 2, title: "쌓기나무로 모양 만들기" },
    { page: 3, title: "위에서 본 모양에 수를 쓰는 방법" },
    { page: 4, title: "앞에서 본 모양 알아보기" },
    { page: 5, title: "옆에서 본 모양 알아보기" },
    { page: 6, title: "쌓기나무의 개수 구하기" },
    { page: 7, title: "공부한 내용을 확인해요" }
  ];
  const STUDENTS = [
    { name: "김민준", wait: false, help: false },
    { name: "이서연", wait: false, help: true },
    { name: "박도윤", wait: false, help: false },
    { name: "최하은", wait: true, help: false },
    { name: "정시우", wait: true, help: false }
  ];

  const state = {
    zoom: 100,
    classSeconds: 925,
    locked: false,
    sharing: false,
    annotating: false,
    monitoring: false,
    kbMath: false
  };
  const IDLE_RESET_MS = 2 * 60 * 1000;

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  const toastEl = $("#toast");
  let toastTimer;
  function toast(msg, ms = 1800) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), ms);
  }

  function setIconActive(el, on) {
    if (!el) return;
    el.classList.toggle("active", on);
    el.setAttribute("aria-pressed", String(!!on));
  }

  function fmtTime(sec) {
    const m = String(Math.floor(sec / 60)).padStart(2, "0");
    const s = String(sec % 60).padStart(2, "0");
    return `${m}:${s}`;
  }

  setInterval(() => {
    state.classSeconds += 1;
    const t = fmtTime(state.classSeconds);
    $("#classTimer").textContent = t;
  }, 1000);

  const backdrop = $("#backdrop");
  const panels = {
    toc: $("#panelToc"),
    ai: $("#panelAi"),
    guide: $("#panelGuide"),
    monitor: $("#panelMonitor"),
    game: $("#panelGame"),
    timer: $("#panelTimer"),
    pick: $("#panelPick"),
    report: $("#panelReport"),
    end: $("#panelEnd"),
    back: $("#panelBack")
  };

  function closeToolFrame() {
    const frame = $("#toolFrame");
    if (!frame?.classList.contains("show")) return;
    frame.classList.remove("show");
    frame.dataset.returnTo = "";
    const iframe = $("#toolFrameIframe");
    if (iframe) iframe.src = "about:blank";
  }
  function openToolFrame(title, url, returnTo) {
    $("#toolFrameTitle").textContent = title;
    const iframe = $("#toolFrameIframe");
    iframe.title = title;
    iframe.src = url;
    const frame = $("#toolFrame");
    frame.dataset.returnTo = returnTo || "";
    frame.classList.add("show");
  }

  function closeGameMenu() {
    $("#gameUnitMenu")?.setAttribute("hidden", "");
    $("#gameUnit")?.setAttribute("aria-expanded", "false");
  }

  function closeAll() {
    closeToolFrame();
    closeGameMenu();
    Object.values(panels).forEach((el) => el?.classList.remove("show"));
    backdrop.classList.remove("show");
    document.body.classList.remove("is-modal");
  }

  function dismissModal() {
    const showGuide = panels.ai?.classList.contains("show");
    closeAll();
    if (showGuide) {
      requestAnimationFrame(() => openPanel("guide"));
    }
  }

  function setGameSwitch(on, silent) {
    const sw = $("#gameSwitch");
    if (!sw) return;
    sw.classList.toggle("on", on);
    $("#gameToggleWrap")?.classList.toggle("is-on", on);
    sw.setAttribute("aria-pressed", String(on));
    sw.setAttribute("aria-label", on ? "수학 게임 활성" : "수학 게임 비활성");
    if (!silent) {
      toast(on ? "학생에게 수학 게임이 활성화되었습니다." : "수학 게임을 비활성화했습니다.");
    }
  }

  function setKbMode(on) {
    state.kbMath = on;
    const btn = $("#kbToggle");
    btn?.classList.toggle("on", on);
    btn?.setAttribute("aria-pressed", String(on));
    btn?.setAttribute("aria-label", on ? "수식 키보드" : "키보드");
    $("#stageUi")?.classList.toggle("is-math", on);
    $("#kbHintTag")?.classList.toggle("show", on);
    $("#kbToggle")?.setAttribute("aria-expanded", String(on));
  }

  function openPanel(key) {
    closeAll();
    const el = panels[key];
    if (!el) return;
    el.classList.add("show");
    if (key !== "toc" && key !== "monitor") {
      backdrop.classList.add("show");
      document.body.classList.add("is-modal");
    }
    if (key === "game") setGameSwitch(false, true);
    if (key === "ai") requestAnimationFrame(placeAiMathTip);
  }

  function placeAiMathTip() {
    const modal = panels.ai;
    const tip = $("#aiMathTip");
    const row = modal?.querySelector('[data-math-tool="매쓰 보드"]');
    if (!modal?.classList.contains("show") || !tip || !row) return;
    const modalBox = modal.getBoundingClientRect();
    const rowBox = row.getBoundingClientRect();
    tip.style.left = `${Math.round(modalBox.right + 14)}px`;
    const tipH = tip.offsetHeight || 96;
    let top = Math.round(rowBox.top + rowBox.height / 2 - 28);
    top = Math.max(12, Math.min(top, window.innerHeight - tipH - 12));
    tip.style.top = `${top}px`;
    tip.style.transform = "none";
  }

  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-close]") || e.target === backdrop) {
      e.stopImmediatePropagation();
      dismissModal();
      return;
    }
    const op = e.target.closest("[data-kit]");
    if (op) toast(`${op.dataset.kit}를 열었습니다.`);
  });
  $("#panelGame")?.querySelector("[data-close]")?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    closeAll();
  });
  $("#toolFrameClose")?.addEventListener("click", () => {
    const returnTo = $("#toolFrame")?.dataset.returnTo;
    closeToolFrame();
    if (returnTo === "game") openPanel("game");
    if (returnTo === "ai") openPanel("ai");
  });

  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-feature]");
    if (!btn) return;
    const f = btn.dataset.feature;
    if (f === "lock") {
      state.locked = !state.locked;
      $("#lockDim")?.classList.toggle("on", state.locked);
      setIconActive($("#btnLock"), state.locked);
      toast(state.locked
        ? "학생이 화면을 넘길 수 없도록 잠금 처리되었습니다."
        : "화면 잠금이 해제되었습니다.");
    } else if (f === "share") {
      state.sharing = !state.sharing;
      setIconActive($("#btnShare"), state.sharing);
      toast(state.sharing ? "학생 화면을 가렸습니다." : "학생 화면 가리기가 해제되었습니다.", 3000);
    } else if (f === "annotate") {
      state.annotating = !state.annotating;
      setIconActive($("#btnAnno"), state.annotating);
      toast(state.annotating ? "판서 도구를 켰습니다." : "판서 도구를 껐습니다.");
    } else if (f === "monitor") {
      state.monitoring = !state.monitoring;
      setIconActive($("#btnMonitor") || document.querySelector('[data-feature="monitor"]'), state.monitoring);
      toast(state.monitoring ? "수업에 학생 모니터링이 가능합니다." : "학생 모니터링을 종료했습니다.", 3000);
    } else if (f === "game") {
      if (panels.game.classList.contains("show")) closeAll();
      else openPanel("game");
    }
    else if (f === "timer") openPanel("timer");
    else if (f === "pick") openPanel("pick");
    else if (f === "ai") {
      if (panels.ai.classList.contains("show")) dismissModal();
      else openPanel("ai");
    }
    else if (f === "toc") {
      if (panels.toc.classList.contains("show")) closeAll();
      else openPanel("toc");
    } else if (f === "report") openPanel("report");
    else if (f === "end") openPanel("end");
    else if (f === "back") openPanel("back");
    else if (f === "next-in") toast("다음 활동으로 이동합니다.");
    else if (f === "keypad") {
      setKbMode(!state.kbMath);
    } else if (f === "reset") {
      $$(".ans").forEach((el) => { el.value = ""; });
      toast("입력한 답을 지웠습니다.");
    } else if (f === "check") {
      const filled = $$(".ans").every((el) => el.value.trim());
      toast(filled ? "답을 확인했습니다." : "빈칸을 모두 채워 주세요.");
    }
  });

  function applyZoom() {
    const label = $("#zoomValue");
    if (label) label.textContent = `${state.zoom} %`;
    const stage = $("#slideZoom");
    if (stage) stage.style.transform = `scale(${state.zoom / 100})`;
  }
  $("#zoomIn").addEventListener("click", () => {
    state.zoom = Math.min(150, state.zoom + 10);
    applyZoom();
  });
  $("#zoomOut").addEventListener("click", () => {
    state.zoom = Math.max(70, state.zoom - 10);
    applyZoom();
  });

  $("#prevPage").addEventListener("click", () => toast("이전 쪽입니다."));
  $("#nextPage").addEventListener("click", () => toast("다음 쪽입니다."));

  function tocThumb(page) {
    const file = `${String(page).padStart(2, "0")}번슬라이드.png`;
    return `<div class="toc-thumb"><img src="${encodeURI(file)}" alt="${page}쪽"></div>`;
  }

  function tocCard(page) {
    const item = TOC.find((t) => t.page === page);
    return `<div class="toc-row">
      <button type="button" class="toc-card${page === 1 ? " current" : ""}" data-go="${page}">
        ${tocThumb(page)}
        <span class="toc-caption">${item.title}</span>
      </button>
    </div>`;
  }

  function renderToc() {
    const sections = [
      { name: "들어가기", pages: [1] },
      { name: "학습하기", pages: [2, 3, 4, 5, 6] },
      { name: "정리하기", pages: [7] }
    ];
    $("#tocList").innerHTML = sections.map((sec) => `
      <section class="toc-section">
        <div class="toc-section-title"><i></i>${sec.name}</div>
        ${sec.pages.map(tocCard).join("")}
      </section>
    `).join("");
  }
  $("#tocList").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-go]");
    if (!btn) return;
    closeAll();
    toast(`${btn.dataset.go}쪽으로 이동합니다.`);
  });
  renderToc();

  function renderStudents() {
    $("#studentGrid").innerHTML = STUDENTS.map((s) => `
      <figure class="student-card ${s.wait ? "wait" : ""} ${s.help ? "help" : ""}">
        <div class="mini-screen${s.wait ? "" : " live"}">${s.wait ? "대기" : "학습 중"}</div>
        <figcaption>${s.name}<em>${s.wait ? "미접속" : s.help ? "도움" : "3쪽"}</em></figcaption>
      </figure>
    `).join("");
  }

  $("#muteAll")?.addEventListener("click", () => toast("모든 학생 소리를 껐습니다."));
  $("#openMonitorWin")?.addEventListener("click", () => toast("새 창에서 모니터링을 열었습니다."));

  const gameMenu = $("#gameUnitMenu");
  $("#gameUnit")?.addEventListener("click", (e) => {
    e.stopPropagation();
    const open = gameMenu.hasAttribute("hidden");
    if (open) gameMenu.removeAttribute("hidden");
    else gameMenu.setAttribute("hidden", "");
    $("#gameUnit").setAttribute("aria-expanded", String(open));
  });
  gameMenu?.addEventListener("click", (e) => {
    const item = e.target.closest("[data-unit]");
    if (!item) return;
    $$("[data-unit]", gameMenu).forEach((b) => b.classList.toggle("on", b === item));
    $("#gameUnitLabel").textContent = item.dataset.unit;
    $$(".game-card-unit").forEach((s) => { s.textContent = item.dataset.unit; });
    closeGameMenu();
  });
  document.addEventListener("click", closeGameMenu);
  $("#gameSwitch")?.addEventListener("click", () => {
    setGameSwitch(!$("#gameSwitch").classList.contains("on"));
  });
  $$("[data-game]").forEach((b) => b.addEventListener("click", () => {
    if (b.dataset.soon) {
      toast("멀티형 게임은 2027년에 업데이트될 예정입니다.");
      return;
    }
    toast("실제 게임 체험은 수학 게임 모니터에서 확인해주세요.", 3000);
  }));

  $$("[data-math-tool]").forEach((b) => b.addEventListener("click", () => {
    const url = b.dataset.mathUrl;
    if (url) {
      closeAll();
      openToolFrame(b.dataset.mathTool, url, "ai");
      return;
    }
    toast(`${b.dataset.mathTool}를 열었습니다.`);
  }));
  $("#aiPopout")?.addEventListener("click", () => toast("새 창에서 AI 수학교구를 열었습니다."));
  $("#aiMaximize")?.addEventListener("click", () => toast("AI 수학교구 창을 크게 펼쳤습니다."));
  $("#pickPopout")?.addEventListener("click", () => toast("새 창에서 뽑기를 열었습니다."));
  $("#pickMaximize")?.addEventListener("click", () => toast("뽑기 창을 크게 펼쳤습니다."));
  $("#timerPopout")?.addEventListener("click", () => toast("새 창에서 타이머를 열었습니다."));
  $("#timerMaximize")?.addEventListener("click", () => toast("타이머 창을 크게 펼쳤습니다."));

  function updateReportCount(input, el, max) {
    if (el) el.textContent = `${(input?.value || "").length}/${max}`;
  }
  function resetReportForm() {
    if ($("#reportTitle")) $("#reportTitle").value = "";
    if ($("#reportText")) $("#reportText").value = "";
    if ($("#reportType")) $("#reportType").selectedIndex = 0;
    if ($("#reportDetail")) $("#reportDetail").selectedIndex = 0;
    const file = $("#reportFile");
    if (file) file.value = "";
    const name = $("#reportFileName");
    if (name) name.textContent = "";
    $("#reportFile")?.closest(".report-upload")?.classList.remove("has-file");
    updateReportCount($("#reportTitle"), $("#reportTitleCount"), 50);
    updateReportCount($("#reportText"), $("#reportTextCount"), 300);
  }
  $("#reportTitle")?.addEventListener("input", () => {
    updateReportCount($("#reportTitle"), $("#reportTitleCount"), 50);
  });
  $("#reportText")?.addEventListener("input", () => {
    updateReportCount($("#reportText"), $("#reportTextCount"), 300);
  });
  $("#reportFile")?.addEventListener("change", () => {
    const file = $("#reportFile")?.files?.[0];
    const name = $("#reportFileName");
    const wrap = $("#reportFile")?.closest(".report-upload");
    if (file && name) {
      name.textContent = file.name;
      wrap?.classList.add("has-file");
    } else if (name) {
      name.textContent = "";
      wrap?.classList.remove("has-file");
    }
  });
  $("#reportSend")?.addEventListener("click", () => {
    closeAll();
    resetReportForm();
    toast("오류 신고가 접수되었습니다. 감사합니다.");
  });
  $("#endConfirm")?.addEventListener("click", () => {
    closeAll();
    toast("학습 이력을 전송하고 수업을 종료했습니다.");
  });
  $("#backLeave")?.addEventListener("click", () => {
    closeAll();
    toast("수업을 종료하고 나갑니다.");
  });

  window.addEventListener("resize", placeAiMathTip);

  const startWithAi = !new URLSearchParams(location.search).has("idle");
  let idleTimer;
  function isFreshHome() {
    if (state.annotating || state.locked || state.sharing || state.kbMath) return false;
    if ($("#toolFrame")?.classList.contains("show")) return false;
    const open = Object.entries(panels)
      .filter(([, el]) => el?.classList.contains("show"))
      .map(([key]) => key);
    if (startWithAi) return open.length === 1 && open[0] === "ai";
    return open.length === 0;
  }
  function armIdleReset() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      if (isFreshHome()) {
        armIdleReset();
        return;
      }
      location.reload();
    }, IDLE_RESET_MS);
  }
  ["pointerdown", "keydown", "touchstart", "wheel"].forEach((type) => {
    document.addEventListener(type, armIdleReset, { passive: true });
  });
  armIdleReset();

  if (startWithAi) {
    openPanel("ai");
  }
})();
