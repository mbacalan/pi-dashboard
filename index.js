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

let wsOpen = false
const ws = new WebSocket('ws://192.168.178.251:3000/server');

ws.onopen = () => {
  wsOpen = true
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

  if (!online && error) {
    serverStatusText.innerText = "❌ Error checking server status"
    return
  }

  if (!online) {
    serverStatusText.innerText = "🔴 Server is not running"
    return
  }

  if (online) {
    serverStatusText.innerText = "🟢 Server is running"
    serverStartButton.innerText = "Stop Server"
    return
  }
}

function handleServerDetails(data) {
  serverStatusDetails.removeAttribute("hidden")
  serverStatusVersion.innerHTML = `<p>Version: ${data.version.name || "-"}</p>`
  serverStatusPlayers.innerHTML = `<p>Online: ${data.players.online || "0"}</p>`
}

async function checkServerStatus() {
  serverStatusText.innerText = "Checking server status..."
  serverStatusText.setAttribute("aria-busy", true)

  try {
    const response = await fetch("http://192.168.178.251:3000/status")

    if (!response.ok) {
      throw new Error("Network response was not OK");
    }

    const data = await response.json()

    handleServerStatus({ online: data.online, error: false })

    if (data.online) {
      handleServerDetails(data)
    }

    return
  } catch (error) {
    handleServerStatus({ online: false, error: true })
    return
  }
}

function startServer() {
  if (wsOpen) {
    ws.send(serverRunning ? "stop" : "start")
  }
}
