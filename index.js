const dom = {
  serverStartButton: document.getElementById("server-start-button"),
  serverStatusButton: document.getElementById("server-status-button"),
  serverStatusText: document.getElementById("server-status-text"),
  serverStatusDetails: document.getElementById("server-status-details"),
  serverStatusVersion: document.getElementById("server-status-version"),
  serverStatusPlayers: document.getElementById("server-status-players"),
  serverStatusLog: document.getElementById("server-status-log"),
  serverStatusLogEmpty: document.getElementById("server-status-log-empty"),
}

const serverUpRegex = /^\[\d{2}:\d{2}:\d{2} INFO\]: Done \(\d+\.\d+s\)! For help, type "help"\n$/;

const ws = new WebSocket(`ws://${import.meta.env.VITE_API_URL}`);
ws.onopen = () => {
  checkServerStatus()
};

window.onload = async () => {
  dom.serverStatusButton.addEventListener("click", checkServerStatus)
  dom.serverStartButton.addEventListener("click", toggleServer)

  ws.onmessage = (event) => {
    const eventData = JSON.parse(event.data)

    if (eventData.message == "start" && eventData.event == "spawn") {
      onProcessSpawn(eventData)
    }

    if (eventData.message == "start" && eventData.event == "data") {
      onProcessStart(eventData)
    }

    if (eventData.message == "stop") {
      onProcessStop(eventData)
    }

    if (eventData.message == "status") {
      onProcessStatusCheck(eventData)
    }
  };
}

function onProcessStatusCheck(eventData) {
  if (eventData.online) {
    showServerDetails(eventData)
    return
  }

  handleServerStatusError()
}

function onProcessSpawn(eventData) {
  if (eventData.success) {
    handleServerStart()
    return
  }

  handleServerStatusError()
}

function onProcessStart(eventData) {
  const node = document.createElement("p")

  dom.serverStatusDetails.removeAttribute("hidden")
  node.innerText = eventData.data

  if (dom.serverStatusLogEmpty) {
    dom.serverStatusLogEmpty.remove()
  }

  dom.serverStatusLog.appendChild(node)
  node.scrollIntoView({ behavior: "smooth" })

  if (serverUpRegex.test(eventData.data)) {
    handleServerOnline()
  }
}

function onProcessStop(eventData) {
  if (eventData.success) {
    handleServerOffline()
    clearServerDetails()
  }
}

function showServerDetails(data) {
  dom.serverStatusDetails.removeAttribute("hidden")
  dom.serverStatusVersion.innerHTML = `<p>Version: ${data.version.name || "-"}</p>`
  dom.serverStatusPlayers.innerHTML = `<p>Online: ${data.players.online || "0"}</p>`
}

function clearServerDetails() {
  dom.serverStatusDetails.setAttribute("hidden", true)
  dom.serverStatusVersion.innerHTML = ""
  dom.serverStatusPlayers.innerHTML = ""

  do {
    dom.serverStatusLog.removeChild(dom.serverStatusLog.firstChild)
  } while (dom.serverStatusLog.firstChild)
}

function handleServerStart() {
  dom.serverStatusText.setAttribute("aria-busy", true)
  dom.serverStatusText.innerText = "Starting server..."
  dom.serverStartButton.innerText = "Start Server"
  disableServerStartButton();
  hideServerStatusDetails();
  serverRunning = false
  return
}

function handleServerStatusError() {
  dom.serverStatusText.setAttribute("aria-busy", false)
  dom.serverStatusText.innerText = "❌ Error checking server status"
  dom.serverStartButton.innerText = "Start Server"
  hideServerStatusDetails();
  serverRunning = false
  return
}

function handleServerOffline() {
  dom.serverStatusText.setAttribute("aria-busy", false)
  dom.serverStatusText.innerText = "🔴 Server is not running"
  dom.serverStartButton.innerText = "Start Server"
  hideServerStatusDetails();
  serverRunning = false
  return
}

function handleServerOnline() {
  dom.serverStatusText.setAttribute("aria-busy", false)
  dom.serverStatusText.innerText = "🟢 Server is running"
  dom.serverStartButton.innerText = "Stop Server"
  enableServerStartButton();
  serverRunning = true
  return
}

function hideServerStatusDetails() {
  dom.serverStatusDetails.setAttribute("hidden", true)
}

function disableServerStartButton() {
  dom.serverStartButton.setAttribute("disabled", true)
}

function enableServerStartButton() {
  dom.serverStartButton.removeAttribute("disabled")
}

function checkServerStatus() {
  dom.serverStatusText.innerText = "Checking server status..."
  dom.serverStatusText.setAttribute("aria-busy", true)

  ws.send("status")
}

function toggleServer() {
  if (ws.readyState != ws.OPEN) {
    dom.serverStatusText.innerText = "WS connection failed, refresh and try again"
  }

  if (!serverStatusHandler.online) {
    dom.serverStatusText.innerText = "Starting server..."
    dom.serverStatusText.setAttribute("aria-busy", true)
    ws.send("start")
  }

  if (serverStatusHandler.online) {
    dom.serverStatusText.innerText = "Stopping server..."
    dom.serverStatusText.setAttribute("aria-busy", true)
    ws.send("stop")
  }
}
