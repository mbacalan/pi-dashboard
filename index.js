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

let wsOpen = false
let serverRunning = false

const ws = new WebSocket(`ws://${import.meta.env.VITE_API_URL}`);
ws.onopen = () => {
  wsOpen = true
  checkServerStatus()
};

window.onload = async () => {
  dom.serverStatusButton.addEventListener("click", () => checkServerStatus())
  dom.serverStartButton.addEventListener("click", () => toggleServer())

  ws.onmessage = (event) => {
    const eventData = JSON.parse(event.data)

    if (eventData.message == "start" && eventData.event == "spawn") {
      onWsStartSpawn(eventData)
    }

    if (eventData.message == "start" && eventData.event == "data") {
      onWsStartData(eventData)
    }

    if (eventData.message == "status") {
      onWsStatus(eventData)
    }

    if (eventData.message == "stop" && eventData.event == "data") {
      onWsStop(eventData)
    }
  };
}

function onWsStatus(eventData) {
  try {
    handleServerStatus({ online: eventData.online, error: false })

    if (eventData.online) {
      showServerDetails(eventData)
    }
  } catch (err) {
    handleServerStatus({ online: false, error: true })
  }
}

function onWsStartSpawn(eventData) {
  if (eventData.success) {
    handleServerStatus({ online: false, error: false, initiated: true })
    return
  }

  handleServerStatus({ online: false, error: true })
}

function onWsStartData(eventData) {
  const node = document.createElement("p")

  dom.serverStatusDetails.removeAttribute("hidden")
  node.innerText = eventData.data

  if (dom.serverStatusLogEmpty) {
    dom.serverStatusLogEmpty.remove()
  }

  dom.serverStatusLog.appendChild(node)
  node.scrollIntoView({ behavior: "smooth" })

  if (serverUpRegex.test(eventData.data)) {
    handleServerStatus({ online: true, error: false })
  }
}

function onWsStop(eventData) {
  if (eventData.success) {
    handleServerStatus({ online: false, error: false })
  }
}

function handleServerStatus({ online, error, initiated }) {
  dom.serverStatusText.setAttribute("aria-busy", initiated ?? false)

  if (!online && !error && initiated) {
    dom.serverStatusText.innerText = "Starting server..."
    dom.serverStartButton.innerText = "Start Server"
    disableServerStartButton();
    hideServerStatusDetails();
    serverRunning = false
    return
  }

  if (!online && error) {
    dom.serverStatusText.innerText = "❌ Error checking server status"
    dom.serverStartButton.innerText = "Start Server"
    hideServerStatusDetails();
    serverRunning = false
    return
  }

  if (!online) {
    dom.serverStatusText.innerText = "🔴 Server is not running"
    dom.serverStartButton.innerText = "Start Server"
    hideServerStatusDetails();
    serverRunning = false
    return
  }

  if (online) {
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

function checkServerStatus() {
  dom.serverStatusText.innerText = "Checking server status..."
  dom.serverStatusText.setAttribute("aria-busy", true)

  ws.send("status")
}

function toggleServer() {
  if (!wsOpen) {
    dom.serverStatusText.innerText = "WS connection failed, refresh and try again"
  }

  if (!serverRunning) {
    dom.serverStatusText.innerText = "Starting server..."
    dom.serverStatusText.setAttribute("aria-busy", true)
    ws.send("start")
  }

  if (serverRunning) {
    dom.serverStatusText.innerText = "Stopping server..."
    dom.serverStatusText.setAttribute("aria-busy", true)
    ws.send("stop")
  }
}
