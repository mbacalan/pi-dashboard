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

class ServerStatusHandler {
  constructor() {
    this.online = false
  }

  handleStart() {
    dom.serverStatusText.setAttribute("aria-busy", true)
    dom.serverStatusText.innerText = "Starting server..."
    dom.serverStartButton.innerText = "Start Server"
    this._disableServerStartButton();
    this._hideServerStatusDetails();
    this.online = false
  }

  handleStatusError() {
    dom.serverStatusText.setAttribute("aria-busy", false)
    dom.serverStatusText.innerText = "❌ Error checking server status"
    dom.serverStartButton.innerText = "Start Server"
    this._hideServerStatusDetails();
    this.online = false
  }

  handleOffline() {
    dom.serverStatusText.setAttribute("aria-busy", false)
    dom.serverStatusText.innerText = "🔴 Server is not running"
    dom.serverStartButton.innerText = "Start Server"
    this._hideServerStatusDetails();
    this.online = false
  }

  handleOnline() {
    dom.serverStatusText.setAttribute("aria-busy", false)
    dom.serverStatusText.innerText = "🟢 Server is running"
    dom.serverStartButton.innerText = "Stop Server"
    this._enableServerStartButton();
    this.online = true
  }

  _hideServerStatusDetails() {
    dom.serverStatusDetails.setAttribute("hidden", true)
  }

  _disableServerStartButton() {
    dom.serverStartButton.setAttribute("disabled", true)
  }

  _enableServerStartButton() {
    dom.serverStartButton.removeAttribute("disabled")
  }
}

const serverStatusHandler = new ServerStatusHandler()

function checkServerStatus() {
  dom.serverStatusText.innerText = "Checking server status..."
  dom.serverStatusText.setAttribute("aria-busy", true)

  ws.send("status")
}

function onProcessStatusCheck(eventData) {
  if (eventData.online) {
    showServerDetails(eventData)
    return
  }

  serverStatusHandler.handleStatusError()
}

function onProcessSpawn(eventData) {
  if (eventData.success) {
    serverStatusHandler.handleStart()
    return
  }

  serverStatusHandler.handleStatusError()
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
    serverStatusHandler.handleOnline()
  }
}

function onProcessStop(eventData) {
  if (eventData.success) {
    serverStatusHandler.handleOffline()
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
