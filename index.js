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
  serverStatusButton.addEventListener("click", () => checkServerStatus())
  serverStartButton.addEventListener("click", () => startServer())

  await checkServerStatus()

  ws.onmessage = (event) => {
    const eventData = JSON.parse(event.data)

    if (eventData.message == "start" && eventData.event == "spawn") {
      serverStatusDetails.removeAttribute("hidden")
    }

    if (eventData.message == "start" && eventData.event == "data") {
      const node = document.createElement("p")
      node.innerText = eventData.data
      serverStatusLog.removeChild(serverStatusLog.firstChild)
      serverStatusLog.appendChild(node)
      node.scrollIntoView({ behavior: "smooth" })
    }

    console.log(eventData)
  };
}

function handleServerStatus({ online, error }) {
  serverStatusText.setAttribute("aria-busy", false)

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
